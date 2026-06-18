/**
 * Post Detail Screen — /post/[id]
 * Full-screen post view with comments, nested replies, and like/save actions.
 * Supports deep linking: instafrontend://post/[id]
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
  Text,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSaved } from '@/contexts/SavedContext';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ErrorState } from '@/components/ErrorState';
import { PostOptionsSheet } from '@/components/PostOptionsSheet';
import { ShareSheetModal } from '@/components/ShareSheetModal';
import { haptics } from '@/utils/haptics';
import { formatDistanceToNow } from '@/utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CommentReply {
  id: string;
  text: string;
  parentId: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl?: string; isVerified: boolean };
}

interface Comment {
  id: string;
  text: string;
  parentId: null;
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl?: string; isVerified: boolean };
  replies?: CommentReply[];
  showReplies?: boolean;
  loadingReplies?: boolean;
}

interface PostDetail {
  id: string;
  userId: string;
  caption?: string;
  location?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked: boolean;
  isSaved: boolean;
  media: { id: string; mediaUrl: string; mediaType: string; orderIndex: number }[];
  user: { id: string; username: string; displayName: string; avatarUrl?: string; isVerified: boolean };
}

// ─── Hashtag / mention highlighter ────────────────────────────────────────────

function renderHighlightedText(text: string, baseStyle: object): React.ReactNode {
  const parts = text.split(/(#\w+|@\w+)/g);
  return (
    <Text style={baseStyle}>
      {parts.map((part, i) =>
        /^[#@]\w+$/.test(part)
          ? <Text key={i} style={{ color: '#0095F6' }}>{part}</Text>
          : <Text key={i}>{part}</Text>
      )}
    </Text>
  );
}

// ─── Comment Row ───────────────────────────────────────────────────────────────

const CommentRow: React.FC<{
  comment: Comment | CommentReply;
  isReply?: boolean;
  colors: any;
  isDark: boolean;
  currentUserId: string;
  onLike: (id: string) => void;
  onReply?: (comment: Comment) => void;
  onExpand?: (comment: Comment) => void;
  parentComment?: Comment;
}> = ({ comment, isReply = false, colors, isDark, currentUserId, onLike, onReply, onExpand, parentComment }) => {
  const isOwn = comment.user.id === currentUserId;
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const handleLike = () => {
    haptics.light();
    heartScale.value = withSpring(1.4, { damping: 6 }, () => {
      heartScale.value = withSpring(1, { damping: 10 });
    });
    onLike(comment.id);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(200).springify()}
      style={[styles.commentRow, isReply && styles.commentRowReply]}
    >
      {isReply && <View style={[styles.replyLine, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />}

      {/* Avatar */}
      {comment.user.avatarUrl ? (
        <Image source={{ uri: comment.user.avatarUrl }} style={[styles.commentAvatar, isReply && styles.commentAvatarSmall]} />
      ) : (
        <View style={[styles.commentAvatar, styles.commentAvatarDefault, { backgroundColor: isDark ? '#2C2C2E' : '#E0E0E0' }, isReply && styles.commentAvatarSmall]}>
          <Ionicons name="person" size={isReply ? 12 : 16} color={isDark ? '#636366' : '#AEAEB2'} />
        </View>
      )}

      {/* Body */}
      <View style={styles.commentBody}>
        <View style={styles.commentBubble}>
          <Text style={[styles.commentUsername, { color: colors.text }]}>
            {comment.user.username}
            {comment.user.isVerified && (
              <Text style={{ color: '#0095F6' }}> ✓</Text>
            )}
          </Text>
          {renderHighlightedText(comment.text, [styles.commentText, { color: colors.text }])}        </View>

        {/* Actions row */}
        <View style={styles.commentMeta}>
          <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
            {formatDistanceToNow(new Date(comment.createdAt))}
          </Text>

          {(comment as Comment).likesCount > 0 && (
            <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
              {(comment as Comment).likesCount} {(comment as Comment).likesCount === 1 ? 'like' : 'likes'}
            </Text>
          )}

          {!isReply && onReply && (
            <Pressable onPress={() => onReply(comment as Comment)}>
              <Text style={[styles.commentReplyBtn, { color: colors.textSecondary }]}>Reply</Text>
            </Pressable>
          )}
        </View>

        {/* Expand replies */}
        {!isReply && (comment as Comment).repliesCount > 0 && onExpand && (
          <Pressable
            onPress={() => onExpand(comment as Comment)}
            style={styles.viewRepliesBtn}
          >
            <View style={[styles.viewRepliesLine, { backgroundColor: isDark ? '#444' : '#C7C7CC' }]} />
            <Text style={[styles.viewRepliesLabel, { color: colors.textSecondary }]}>
              {(comment as Comment).showReplies
                ? 'Hide replies'
                : `View ${(comment as Comment).repliesCount} ${(comment as Comment).repliesCount === 1 ? 'reply' : 'replies'}`}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Like button */}
      <Animated.View style={heartStyle}>
        <Pressable onPress={handleLike} style={styles.commentLikeBtn}>
          <Ionicons
            name={(comment as Comment).isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={(comment as Comment).isLiked ? '#FF3B30' : colors.textSecondary}
          />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSaved();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showLikedBy, setShowLikedBy] = useState(false);
  const [likedByUsers, setLikedByUsers] = useState<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]>([]);
  const [likedByLoading, setLikedByLoading] = useState(false);

  const commentInputRef = useRef<TextInput>(null);
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const isOwner = post?.userId === user?.id;

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [postRes, commentsRes] = await Promise.all([
        api.get(`/posts/${id}`),
        api.get(`/posts/${id}/comments`, { params: { limit: 15 } }),
      ]);

      const p = postRes.data?.data ?? postRes.data;
      setPost(p);
      setIsLiked(p.isLiked);
      setLikesCount(p.likesCount);

      const cData = commentsRes.data;
      setComments(cData?.data ?? []);
      setCommentsCursor(cData?.meta?.nextCursor ?? null);
      setHasMoreComments(cData?.meta?.hasMore ?? false);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleLike = async () => {
    if (!user) return;
    haptics.medium();
    heartScale.value = withSpring(1.35, { damping: 5 }, () => {
      heartScale.value = withSpring(1, { damping: 10 });
    });
    setIsLiked(prev => !prev);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    try {
      await api.post(`/posts/${id}/like`);
    } catch {
      setIsLiked(prev => !prev);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  const handleSave = async () => {
    haptics.light();
    await toggleSave(id!);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !user) return;
    setIsPosting(true);
    const text = commentText.trim();
    setCommentText('');

    try {
      let res: any;
      if (replyTarget) {
        res = await api.post(`/posts/${id}/comments/${replyTarget.id}/reply`, { text });
        // Add reply to parent comment
        setComments(prev => prev.map(c => {
          if (c.id !== replyTarget.id) return c;
          return {
            ...c,
            repliesCount: c.repliesCount + 1,
            replies: c.showReplies ? [...(c.replies ?? []), res.data?.data] : c.replies,
          };
        }));
      } else {
        res = await api.post(`/posts/${id}/comment`, { text });
        setComments(prev => [res.data?.data, ...prev]);
        setPost(p => p ? { ...p, commentsCount: p.commentsCount + 1 } : p);
      }
      setReplyTarget(null);
    } catch {
      haptics.error();
    } finally {
      setIsPosting(false);
    }
  };

  const handleExpandReplies = async (comment: Comment) => {
    if (comment.showReplies) {
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, showReplies: false } : c));
      return;
    }

    setComments(prev => prev.map(c => c.id === comment.id ? { ...c, loadingReplies: true } : c));
    try {
      const res = await api.get(`/posts/${id}/comments/${comment.id}/replies`);
      const replies: CommentReply[] = res.data?.data ?? [];
      setComments(prev => prev.map(c =>
        c.id === comment.id ? { ...c, replies, showReplies: true, loadingReplies: false } : c
      ));
    } catch {
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, loadingReplies: false } : c));
    }
  };

  const handleCommentLike = async (commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, isLiked: !c.isLiked, likesCount: c.isLiked ? c.likesCount - 1 : c.likesCount + 1 };
      }
      const updatedReplies = c.replies?.map(r =>
        r.id === commentId ? { ...r, isLiked: !r.isLiked, likesCount: r.isLiked ? r.likesCount - 1 : r.likesCount + 1 } : r
      );
      return { ...c, replies: updatedReplies };
    }));
    try {
      await api.post(`/posts/${id}/comments/${commentId}/like`);
    } catch {}
  };

  const loadMoreComments = async () => {
    if (!hasMoreComments || loadingMore || !commentsCursor) return;
    setLoadingMore(true);
    try {
      const res = await api.get(`/posts/${id}/comments`, { params: { limit: 15, cursor: commentsCursor } });
      const cData = res.data;
      setComments(prev => [...prev, ...(cData?.data ?? [])]);
      setCommentsCursor(cData?.meta?.nextCursor ?? null);
      setHasMoreComments(cData?.meta?.hasMore ?? false);
    } catch {} finally {
      setLoadingMore(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      await api.delete(`/posts/${id}`);
      router.back();
    } catch {}
  };

  const fetchLikedBy = async () => {
    setLikedByLoading(true);
    setShowLikedBy(true);
    try {
      const res = await api.get(`/posts/${id}/likes`, { params: { limit: 50 } });
      setLikedByUsers(res.data?.data || []);
    } catch (_) {
    } finally {
      setLikedByLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#0095F6" />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorState title="Couldn't load post" subtitle="This post may have been deleted or an error occurred." onRetry={() => load()} />
      </View>
    );
  }

  const saved = isSaved(id!);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom header with glassmorphism */}
      <BlurView
        intensity={isDark ? 60 : 80}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <ThemedText style={styles.headerTitle}>Post</ThemedText>

        <Pressable onPress={() => setShowOptions(true)} style={styles.headerBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      </BlurView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => load(true)}
              tintColor="#0095F6"
            />
          }
          showsVerticalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) {
              loadMoreComments();
            }
          }}
          scrollEventThrottle={300}
        >
          {/* Post User Header */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.postHeader}>
            <Pressable
              onPress={() => router.push(`/profile?userId=${post.user.id}` as any)}
              style={styles.postUserRow}
            >
              {post.user.avatarUrl ? (
                <Image source={{ uri: post.user.avatarUrl }} style={styles.postAvatar} />
              ) : (
                <View style={[styles.postAvatar, styles.postAvatarDefault, { backgroundColor: isDark ? '#2C2C2E' : '#E0E0E0' }]}>
                  <Ionicons name="person" size={18} color={isDark ? '#636366' : '#AEAEB2'} />
                </View>
              )}
              <View style={styles.postUserInfo}>
                <View style={styles.postUserNameRow}>
                  <Text style={[styles.postUsername, { color: colors.text }]}>{post.user.username}</Text>
                  {post.user.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color="#0095F6" style={{ marginLeft: 4 }} />
                  )}
                </View>
                {post.location && (
                  <Text style={[styles.postLocation, { color: colors.textSecondary }]}>{post.location}</Text>
                )}
              </View>
            </Pressable>
          </Animated.View>

          {/* Media Carousel */}
          {post.media.length > 0 && (
            <View style={styles.mediaContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={({ nativeEvent }) => {
                  const newIndex = Math.round(nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setActiveMediaIndex(newIndex);
                }}
                scrollEventThrottle={100}
              >
                {post.media.map((m) => (
                  <Image
                    key={m.id}
                    source={{ uri: m.mediaUrl }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>

              {/* Dot indicator */}
              {post.media.length > 1 && (
                <View style={styles.dotsContainer}>
                  {post.media.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: i === activeMediaIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                          width: i === activeMediaIndex ? 18 : 6,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Actions bar */}
          <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.actionsBar}>
            {/* Like */}
            <Pressable onPress={handleLike} style={styles.actionBtn}>
              <Animated.View style={heartStyle}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={26}
                  color={isLiked ? '#FF3B30' : colors.text}
                />
              </Animated.View>
            </Pressable>

            {/* Comment (focus input) */}
            <Pressable
              onPress={() => commentInputRef.current?.focus()}
              style={styles.actionBtn}
            >
              <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
            </Pressable>

            {/* Share */}
            <Pressable onPress={() => setShowShare(true)} style={styles.actionBtn}>
              <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
            </Pressable>

            <View style={{ flex: 1 }} />

            {/* Save */}
            <Pressable onPress={handleSave} style={styles.actionBtn}>
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={saved ? '#0095F6' : colors.text}
              />
            </Pressable>
          </Animated.View>

          {/* Stats — tap to see who liked */}
          <View style={styles.statsRow}>
            <Pressable onPress={fetchLikedBy} hitSlop={8}>
              <Text style={[styles.statsText, { color: colors.text }]}>
                {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
              </Text>
            </Pressable>
          </View>

          {/* Caption */}
          {post.caption ? (
            <Pressable
              style={styles.captionRow}
              onPress={() => post.caption && post.caption.length > 100 && setCaptionExpanded(e => !e)}
              hitSlop={4}
            >
              <Text style={[styles.captionText, { color: colors.text }]} numberOfLines={captionExpanded ? undefined : 3}>
                <Text style={[styles.captionUsername, { color: colors.text }]}>{post.user.username} </Text>
                {post.caption.split(/(#\w+|@\w+)/g).map((part, i) =>
                  /^[#@]\w+$/.test(part)
                    ? <Text key={i} style={{ color: '#0095F6' }}>{part}</Text>
                    : <Text key={i}>{part}</Text>
                )}
              </Text>
              {!captionExpanded && post.caption.length > 100 && (
                <Text style={[styles.captionText, { color: colors.textSecondary, marginTop: 2 }]}>
                  more
                </Text>
              )}
            </Pressable>
          ) : null}

          {/* Timestamp */}
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {formatDistanceToNow(new Date(post.createdAt))} ago
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} />

          {/* Comments */}
          <View style={styles.commentsSection}>
            {comments.length === 0 ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.noComments}>
                <Ionicons name="chatbubble-outline" size={32} color={isDark ? '#48484A' : '#C7C7CC'} />
                <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>
                  No comments yet. Be the first!
                </Text>
              </Animated.View>
            ) : (
              comments.map(comment => (
                <View key={comment.id}>
                  <CommentRow
                    comment={comment}
                    colors={colors}
                    isDark={isDark}
                    currentUserId={user?.id ?? ''}
                    onLike={handleCommentLike}
                    onReply={(c) => {
                      setReplyTarget(c);
                      setTimeout(() => commentInputRef.current?.focus(), 100);
                    }}
                    onExpand={handleExpandReplies}
                  />

                  {/* Loading replies spinner */}
                  {comment.loadingReplies && (
                    <View style={styles.repliesLoader}>
                      <ActivityIndicator size="small" color="#0095F6" />
                    </View>
                  )}

                  {/* Replies */}
                  {comment.showReplies && comment.replies?.map(reply => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      isReply
                      colors={colors}
                      isDark={isDark}
                      currentUserId={user?.id ?? ''}
                      onLike={handleCommentLike}
                    />
                  ))}
                </View>
              ))
            )}

            {loadingMore && (
              <ActivityIndicator size="small" color="#0095F6" style={{ paddingVertical: 16 }} />
            )}
          </View>
        </ScrollView>

        {/* Comment input bar */}
        <View
          style={[
            styles.commentInputBar,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderTopColor: isDark ? '#2C2C2E' : '#F2F2F7',
              paddingBottom: Math.max(insets.bottom, 8),
            },
          ]}
        >
          {replyTarget && (
            <View style={[styles.replyBanner, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
              <Text style={[styles.replyBannerText, { color: colors.textSecondary }]}>
                Replying to <Text style={{ color: colors.text, fontFamily: Fonts.semiBold }}>@{replyTarget.user.username}</Text>
              </Text>
              <Pressable onPress={() => setReplyTarget(null)}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          )}

          <View style={styles.inputRow}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.inputAvatar} />
            ) : (
              <View style={[styles.inputAvatar, styles.inputAvatarDefault, { backgroundColor: isDark ? '#2C2C2E' : '#E0E0E0' }]}>
                <Ionicons name="person" size={14} color={isDark ? '#636366' : '#AEAEB2'} />
              </View>
            )}

            <TextInput
              ref={commentInputRef}
              value={commentText}
              onChangeText={setCommentText}
              placeholder={replyTarget ? `Reply to @${replyTarget.user.username}...` : 'Add a comment...'}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.commentInput,
                {
                  color: colors.text,
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  fontFamily: Fonts.regular,
                },
              ]}
              multiline
              maxLength={2200}
              returnKeyType="send"
              onSubmitEditing={handleAddComment}
            />

            <Pressable
              onPress={handleAddComment}
              disabled={!commentText.trim() || isPosting}
              style={[styles.sendBtn, { opacity: commentText.trim() && !isPosting ? 1 : 0.4 }]}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#0095F6" />
              ) : (
                <Ionicons name="paper-plane" size={20} color="#0095F6" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Options Sheet */}
      <PostOptionsSheet
        visible={showOptions}
        postId={id!}
        isOwner={isOwner}
        onClose={() => setShowOptions(false)}
        onEdit={() => router.push(`/edit-post/${id}` as any)}
        onDelete={handleDeletePost}
        onShare={() => setShowShare(true)}
      />

      {/* Share Modal */}
      <ShareSheetModal
        visible={showShare}
        referenceType="post"
        referenceId={id!}
        previewImageUrl={post.media[0]?.mediaUrl}
        previewCaption={post.caption}
        onClose={() => setShowShare(false)}
      />

      {/* ── Who Liked Modal ── */}
      <Modal
        visible={showLikedBy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLikedBy(false)}
      >
        <View style={[styles.likedByContainer, { backgroundColor: colors.background }]}>
          {/* Handle + header */}
          <View style={[styles.likedByHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
            <View style={styles.likedByHandle} />
            <Text style={[styles.likedByTitle, { color: colors.text }]}>Likes</Text>
            <Pressable onPress={() => setShowLikedBy(false)} style={styles.likedByClose}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {likedByLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#0095F6" />
            </View>
          ) : likedByUsers.length === 0 ? (
            <View style={styles.noComments}>
              <Ionicons name="heart-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>
                No likes yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={likedByUsers}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setShowLikedBy(false);
                    router.push(`/profile?userId=${item.id}` as any);
                  }}
                  style={styles.likedByRow}
                >
                  <Image
                    source={{ uri: item.avatarUrl || 'https://ui-avatars.com/api/?name=U&size=80' }}
                    style={styles.likedByAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontFamily: Fonts.semiBold, fontSize: 14 }}>
                      {item.username}
                    </Text>
                    {item.displayName ? (
                      <Text style={{ color: colors.textSecondary, fontFamily: Fonts.regular, fontSize: 12, marginTop: 1 }}>
                        {item.displayName}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  headerBtn: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 17,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  // Post header
  postHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  postUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  postAvatarDefault: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  postUserInfo: { gap: 2 },
  postUserNameRow: { flexDirection: 'row', alignItems: 'center' },
  postUsername: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  postLocation: {
    fontFamily: Fonts.regular,
    fontSize: 11,
  },

  // Media
  mediaContainer: {
    position: 'relative',
    backgroundColor: '#000',
  },
  mediaImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },

  // Actions
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  actionBtn: {
    padding: 8,
  },

  // Stats
  statsRow: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  statsText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },

  // Caption
  captionRow: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  captionUsername: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  captionText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },

  // Timestamp
  timestamp: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontFamily: Fonts.regular,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  divider: {
    height: 1,
    marginBottom: 8,
  },

  // Comments
  commentsSection: {
    paddingHorizontal: 14,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noCommentsText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 10,
  },
  commentRowReply: {
    paddingLeft: 40,
    paddingVertical: 8,
    position: 'relative',
  },
  replyLine: {
    position: 'absolute',
    left: 29,
    top: 0,
    bottom: 0,
    width: 1.5,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  commentAvatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  commentAvatarDefault: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBody: {
    flex: 1,
    gap: 4,
  },
  commentBubble: {
    gap: 2,
  },
  commentUsername: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  commentText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  commentMeta: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  commentTime: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  commentReplyBtn: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
  commentLikeBtn: {
    padding: 6,
    marginTop: 4,
  },
  viewRepliesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  viewRepliesLine: {
    width: 20,
    height: 1,
  },
  viewRepliesLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
  repliesLoader: {
    paddingLeft: 52,
    paddingVertical: 6,
  },

  // Comment input
  commentInputBar: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 14,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 8,
  },
  replyBannerText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingBottom: 6,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 2,
  },
  inputAvatarDefault: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 38,
  },
  sendBtn: {
    padding: 8,
    marginBottom: 2,
  },

  // Liked By modal
  likedByContainer: {
    flex: 1,
  },
  likedByHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    alignItems: 'center',
    position: 'relative',
  },
  likedByHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.35)',
    marginBottom: 12,
    alignSelf: 'center',
  },
  likedByTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    textAlign: 'center',
  },
  likedByClose: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  likedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  likedByAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
