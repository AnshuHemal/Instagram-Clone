import React, { useState, useRef } from 'react';
import { StyleSheet, View, Image, Pressable, Animated, TextInput, Keyboard, Platform, Modal, FlatList } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Post, Comment } from '@/constants/mockData';

interface PostCardProps {
  post: Post;
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
  onAddComment: (postId: string, text: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLikeToggle,
  onBookmarkToggle,
  onAddComment,
}) => {
  const { colors, isDark } = useTheme();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [lastTap, setLastTap] = useState(0);

  // Animation values for double tap
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  // Animation values for like button click
  const likeScale = useRef(new Animated.Value(1)).current;

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
    // Reset scale and opacity
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    // Scale up and fade out
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

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    onAddComment(post.id, newComment.trim());
    setNewComment('');
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <ThemedText type="smallBold" style={{ color: colors.text }}>
              {post.user.username}
            </ThemedText>
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

      {/* Post Image Container with Double Tap Heart */}
      <Pressable onPress={handleImagePress} style={styles.imageContainer}>
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
        <Animated.View
          style={[
            styles.doubleTapHeart,
            {
              transform: [{ scale: heartScale }],
              opacity: heartOpacity,
            },
          ]}
        >
          <Ionicons name="heart" size={100} color="#FFFFFF" />
        </Animated.View>
      </Pressable>

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
        <Pressable onPress={() => onBookmarkToggle(post.id)} style={styles.actionButton}>
          <Feather
            name={post.isBookmarked ? 'bookmark' : 'bookmark'}
            style={post.isBookmarked && { color: colors.text }}
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
      <View style={styles.captionContainer}>
        <ThemedText type="small" style={{ color: colors.text, lineHeight: 18 }}>
          <ThemedText type="smallBold" style={{ color: colors.text }}>
            {post.user.username}{' '}
          </ThemedText>
          {post.caption}
        </ThemedText>
      </View>

      {/* Comments Preview */}
      {post.commentsCount > 0 && (
        <Pressable onPress={() => setShowComments(true)} style={styles.commentsPreviewContainer}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            View all {post.commentsCount} comments
          </ThemedText>
        </Pressable>
      )}

      {/* Recent comments list (displays top 2) */}
      <View style={styles.recentComments}>
        {post.comments.slice(0, 2).map((comment) => (
          <ThemedText key={comment.id} type="small" style={styles.commentItem}>
            <ThemedText type="smallBold">{comment.username} </ThemedText>
            {comment.text}
          </ThemedText>
        ))}
      </View>

      {/* Timestamp */}
      <View style={styles.timestampContainer}>
        <ThemedText style={[styles.timestamp, { color: colors.textSecondary }]}>
          {post.timestamp.toUpperCase()}
        </ThemedText>
      </View>

      {/* Interactive Comments Modal */}
      <Modal visible={showComments} animationType="slide" transparent>
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
            <FlatList
              data={post.comments}
              keyExtractor={(item: any) => item.id}
              contentContainerStyle={styles.commentsList}
              renderItem={({ item }: { item: any }) => (
                <View style={styles.modalCommentItem}>
                  <View style={styles.commentUserRow}>
                    <ThemedText type="smallBold" style={{ color: colors.text }}>
                      {item.username}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.commentTime, { color: colors.textSecondary }]}>
                      {item.timestamp}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={[styles.commentText, { color: colors.text }]}>
                    {item.text}
                  </ThemedText>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <ThemedText style={{ color: colors.textSecondary }}>No comments yet.</ThemedText>
                </View>
              }
            />

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
  location: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    padding: 5,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  doubleTapHeart: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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
  recentComments: {
    paddingHorizontal: 12,
    marginTop: 4,
    gap: 2,
  },
  commentItem: {
    fontSize: 13,
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
  // Modal styles
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
  commentsList: {
    padding: 15,
    gap: 15,
  },
  modalCommentItem: {
    gap: 4,
  },
  commentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentTime: {
    fontSize: 11,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
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
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  modalSendButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});
