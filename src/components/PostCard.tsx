import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Image, Pressable, Animated, TextInput, Keyboard, Platform, Modal, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Post, Comment } from '@/contexts/PostsContext';
import { api } from '@/services/api';

const WINDOW_WIDTH = Dimensions.get('window').width;

// Dynamic check for expo-video
let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (e) {
  // Silent fallback
}

interface PostCardProps {
  post: Post;
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
  onAddComment: (postId: string, text: string) => Promise<any>;
}

// Inline Video Player Component
const VideoItem: React.FC<{ mediaUrl: string; isActive: boolean }> = ({ mediaUrl, isActive }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    if (!ExpoVideo || !mediaUrl) return;

    const cleanUrl = mediaUrl.replace('.mp4.m3u8', '.m3u8');
    let p: any = null;
    try {
      p = ExpoVideo.createVideoPlayer(cleanUrl);
      p.loop = true;
      p.muted = isMuted;
      p.showNowPlayingNotification = false;
      if (isActive) {
        p.play();
      } else {
        p.pause();
      }
      setPlayer(p);
    } catch (err) {
      console.error('Error creating video player in PostCard:', err);
    }

    return () => {
      if (p) {
        try {
          p.pause();
        } catch (e) {}

        // Release with delay so VideoView has time to unmount cleanly
        setTimeout(() => {
          try {
            p.release();
          } catch (e) {}
        }, 5000);
      }
    };
  }, [mediaUrl]);

  // Sync play/pause with isActive
  useEffect(() => {
    if (player) {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, player]);

  // Sync mute state
  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

  if (!ExpoVideo) {
    return (
      <View style={styles.videoPlaceholder}>
        <Ionicons name="play-circle" size={48} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <Pressable onPress={() => setIsMuted(!isMuted)} style={styles.videoPressable}>
      {player && (
        <ExpoVideo.VideoView
          key={`post-video-view-${mediaUrl}`}
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      )}
      <View style={styles.volumeIconContainer}>
        <Ionicons
          name={isMuted ? 'volume-mute' : 'volume-high'}
          size={16}
          color="#FFFFFF"
        />
      </View>
    </Pressable>
  );
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLikeToggle,
  onBookmarkToggle,
  onAddComment,
}) => {
  const { colors, isDark } = useTheme();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [lastTap, setLastTap] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Carousel animation
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  // Animation values for double tap
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  // Animation values for like button click
  const likeScale = useRef(new Animated.Value(1)).current;

  // Load comments when showComments modal opens
  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const response = await api.get(`/posts/${post.id}/comments`);
      setComments(response.data.data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const triggerLikeAnim = () => {
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeScale, {
        toValue: 1.0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerDoubleTapHeart = () => {
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1.2,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleImagePress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY) {
      if (!post.isLiked) {
        onLikeToggle(post.id);
        triggerLikeAnim();
      }
      triggerDoubleTapHeart();
    } else {
      setLastTap(now);
    }
  };

  const handleLikePress = () => {
    onLikeToggle(post.id);
    triggerLikeAnim();
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      const addedComment = await onAddComment(post.id, newComment.trim());
      if (addedComment) {
        setComments((prev) => [addedComment, ...prev]);
      }
      setNewComment('');
      Keyboard.dismiss();
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Safe fallback for user data
  const username = post.user?.username || 'user';
  const avatarUrl = post.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  const displayName = post.user?.displayName || username;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <View style={styles.usernameRow}>
              <ThemedText type="smallBold" style={{ color: colors.text }}>
                {username}
              </ThemedText>
              {post.user?.isVerified && (
                <Ionicons name="checkmark-circle" size={12} color="#0095F6" style={{ marginLeft: 3 }} />
              )}
            </View>
            {post.location && (
              <ThemedText type="small" style={[styles.location, { color: colors.textSecondary }]}>
                {post.location}
              </ThemedText>
            )}
          </View>
        </View>
        <Pressable style={styles.headerRight}>
          <Feather name="more-horizontal" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Post Media horizontal carousel */}
      <View style={styles.carouselWrapper}>
        <Animated.FlatList
          data={post.media}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: false,
              listener: (event: any) => {
                const width = event.nativeEvent.layoutMeasurement.width;
                const offset = event.nativeEvent.contentOffset.x;
                const index = Math.round(offset / width);
                if (index !== activeIndex) {
                  setActiveIndex(index);
                }
              },
            }
          )}
          renderItem={({ item, index }) => (
            <Pressable onPress={handleImagePress} style={styles.mediaContainer}>
              {item.mediaType === 'VIDEO' ? (
                <VideoItem mediaUrl={item.mediaUrl} isActive={index === activeIndex} />
              ) : (
                <Image source={{ uri: item.mediaUrl }} style={styles.postImage} />
              )}
            </Pressable>
          )}
        />

        {/* Double Tap Heart */}
        <Animated.View
          style={[
            styles.doubleTapHeart,
            {
              transform: [{ scale: heartScale }],
              opacity: heartOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="heart" size={90} color="#FFFFFF" />
        </Animated.View>

        {/* Scale/Opacity Animated Dot Indicators */}
        {post.media.length > 1 && (
          <View style={styles.dotsContainer}>
            {post.media.map((_, i) => {
              const inputRange = [
                (i - 1) * WINDOW_WIDTH,
                i * WINDOW_WIDTH,
                (i + 1) * WINDOW_WIDTH,
              ];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.8, 1.2, 0.8],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.4, 1.0, 0.4],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      opacity,
                      transform: [{ scale }],
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              );
            })}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsBar}>
        <View style={styles.actionsLeft}>
          <Pressable onPress={handleLikePress} style={styles.actionButton}>
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Ionicons
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={26}
                color={post.isLiked ? colors.likeActive : colors.text}
              />
            </Animated.View>
          </Pressable>
          <Pressable onPress={() => setShowComments(true)} style={styles.actionButton}>
            <Feather name="message-circle" size={24} color={colors.text} />
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Feather name="send" size={23} color={colors.text} />
          </Pressable>
        </View>
        <Pressable onPress={() => setIsBookmarked(!isBookmarked)} style={styles.actionButton}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={colors.text}
          />
        </Pressable>
      </View>

      {/* Likes */}
      <View style={styles.likesContainer}>
        <ThemedText type="smallBold" style={{ color: colors.text }}>
          {post.likesCount.toLocaleString()} likes
        </ThemedText>
      </View>

      {/* Caption */}
      {post.caption ? (
        <View style={styles.captionContainer}>
          <ThemedText type="small" style={{ color: colors.text, lineHeight: 18 }}>
            <ThemedText type="smallBold" style={{ color: colors.text }}>
              {username}{' '}
            </ThemedText>
            {post.caption}
          </ThemedText>
        </View>
      ) : null}

      {/* Comments Preview Link */}
      {post.commentsCount > 0 && (
        <Pressable onPress={() => setShowComments(true)} style={styles.commentsPreviewContainer}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            View all {post.commentsCount} comments
          </ThemedText>
        </Pressable>
      )}

      {/* Timestamp */}
      <View style={styles.timestampContainer}>
        <ThemedText style={[styles.timestamp, { color: colors.textSecondary }]}>
          {formatTimeAgo(post.createdAt).toUpperCase()}
        </ThemedText>
      </View>

      {/* Interactive Comments Modal */}
      <Modal visible={showComments} animationType="slide" transparent onRequestClose={() => setShowComments(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.modalBar} />
              <View style={styles.modalHeaderTitle}>
                <ThemedText type="subtitle">Comments</ThemedText>
              </View>
              <Pressable onPress={() => setShowComments(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Comments Scrollable Area */}
            {loadingComments ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.commentsList}
                renderItem={({ item }) => (
                  <View style={styles.modalCommentItem}>
                    <View style={styles.commentUserRow}>
                      <Image
                        source={{ uri: item.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }}
                        style={styles.commentAvatar}
                      />
                      <View style={styles.commentTextColumn}>
                        <View style={styles.commentMetaRow}>
                          <ThemedText type="smallBold" style={{ color: colors.text }}>
                            {item.user?.username || 'user'}
                          </ThemedText>
                          <ThemedText type="small" style={[styles.commentTime, { color: colors.textSecondary }]}>
                            {formatTimeAgo(item.createdAt)}
                          </ThemedText>
                        </View>
                        <ThemedText type="small" style={[styles.commentText, { color: colors.text }]}>
                          {item.text}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyComments}>
                    <ThemedText style={{ color: colors.textSecondary }}>No comments yet.</ThemedText>
                  </View>
                }
              />
            )}

            {/* Comment Input Box */}
            <View style={[styles.modalInputContainer, { borderTopColor: colors.border }]}>
              <TextInput
                placeholder="Add a comment..."
                placeholderTextColor={isDark ? '#8E8E8F' : '#9E9E9E'}
                value={newComment}
                onChangeText={setNewComment}
                style={[
                  styles.commentInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? '#262626' : '#FAFAFA',
                    borderColor: colors.border,
                  },
                ]}
              />
              <Pressable
                onPress={handleSendComment}
                disabled={!newComment.trim()}
                style={styles.modalSendButton}
              >
                <ThemedText type="smallBold" style={{ color: newComment.trim() ? colors.primary : colors.textSecondary }}>
                  Post
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 0.5,
    paddingBottom: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  userInfo: {
    justifyContent: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    padding: 5,
  },
  carouselWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  mediaContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH,
    backgroundColor: '#000000',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPressable: {
    flex: 1,
  },
  volumeIconContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  doubleTapHeart: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -45,
    zIndex: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignSelf: 'center',
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionButton: {
    padding: 2,
  },
  likesContainer: {
    paddingHorizontal: 12,
  },
  captionContainer: {
    paddingHorizontal: 12,
    marginTop: 6,
  },
  commentsPreviewContainer: {
    paddingHorizontal: 12,
    marginTop: 6,
  },
  timestampContainer: {
    paddingHorizontal: 12,
    marginTop: 6,
  },
  timestamp: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '70%',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 10,
  },
  modalBar: {
    width: 40,
    height: 5,
    backgroundColor: '#8E8E8F',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
  },
  modalHeaderTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  closeButton: {
    padding: 5,
    marginLeft: 'auto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    padding: 15,
    gap: 15,
  },
  modalCommentItem: {
    paddingVertical: 4,
  },
  commentUserRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentTextColumn: {
    flex: 1,
    gap: 2,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentTime: {
    fontSize: 11,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 17,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 20 : 10,
    borderTopWidth: 0.5,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  modalSendButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});

