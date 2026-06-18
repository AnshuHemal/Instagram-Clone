import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Post } from '@/contexts/PostsContext';
import { CommentsSheet } from '@/components/CommentsSheet';
import { ShareSheetModal } from './ShareSheetModal';
import { useAuth } from '@/contexts/AuthContext';
import { haptics } from '@/utils/haptics';
import { useSaved } from '@/contexts/SavedContext';

const WINDOW_WIDTH = Dimensions.get('window').width;

// ─── Inline Video Player ──────────────────────────────────────────────────────

let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (e) {}

const VideoItem: React.FC<{ mediaUrl: string; isActive: boolean }> = ({
  mediaUrl,
  isActive,
}) => {
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
      isActive ? p.play() : p.pause();
      setPlayer(p);
    } catch (err) {
      console.error('[PostCard] Video player error:', err);
    }
    return () => {
      if (p) {
        try { p.pause(); } catch {}
        setTimeout(() => { try { p.release(); } catch {} }, 5000);
      }
    };
  }, [mediaUrl]);

  useEffect(() => {
    if (player) { isActive ? player.play() : player.pause(); }
  }, [isActive, player]);

  useEffect(() => {
    if (player) { player.muted = isMuted; }
  }, [isMuted, player]);

  if (!ExpoVideo) {
    return (
      <View style={styles.videoPlaceholder}>
        <Ionicons name="play-circle" size={48} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <Pressable onPress={() => setIsMuted((m) => !m)} style={styles.videoPressable}>
      {player && (
        <ExpoVideo.VideoView
          key={`post-video-${mediaUrl}`}
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post;
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
  onAddComment: (postId: string, text: string) => Promise<any>;
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLikeToggle,
  onBookmarkToggle,
  onAddComment,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [showComments, setShowComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.commentsCount);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  // useRef instead of useState — avoids stale closure in handleImagePress
  const lastTapRef = useRef(0);
  const { isSaved, toggleSave } = useSaved();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  // Sync count from prop when feed refreshes
  useEffect(() => {
    setLocalCommentsCount(post.commentsCount);
  }, [post.commentsCount]);

  const scrollX = useRef(new Animated.Value(0)).current;

  // ── Animations ──
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(1)).current;

  const triggerLikeAnim = () => {
    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.4, duration: 70, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
    ]).start();
  };

  const triggerDoubleTapHeart = () => {
    heartScale.setValue(0);
    heartOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(heartScale, { toValue: 1, friction: 3, tension: 80, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(heartOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]),
    ]).start();
  };

  // ── Handlers ──
  const handleImagePress = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      // Double tap — reset so a third tap doesn't re-trigger
      lastTapRef.current = 0;
      if (!post.isLiked) {
        onLikeToggle(post.id);
        triggerLikeAnim();
      }
      triggerDoubleTapHeart();
    } else {
      lastTapRef.current = now;
    }
  };

  const handleLikePress = () => {
    haptics.onLike();
    onLikeToggle(post.id);
    triggerLikeAnim();
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const diff = Date.now() - new Date(dateString).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'Just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const username = post.user?.username ?? 'user';
  const avatarUrl =
    post.user?.avatarUrl ??
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

  const isReelCard = post.type === 'reel';

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View>
            <View style={styles.usernameRow}>
              <ThemedText type="smallBold" style={{ color: colors.text }}>
                {username}
              </ThemedText>
              {post.user?.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={12}
                  color="#0095F6"
                  style={{ marginLeft: 3 }}
                />
              )}
              {isReelCard && (
                <View style={styles.reelBadge}>
                  <Ionicons name="film" size={10} color="#FFFFFF" />
                  <ThemedText style={styles.reelBadgeText}>Reel</ThemedText>
                </View>
              )}
            </View>
            {post.location ? (
              <ThemedText
                type="small"
                style={[styles.location, { color: colors.textSecondary }]}
              >
                {post.location}
              </ThemedText>
            ) : null}
          </View>
        </View>
        <Pressable style={styles.moreBtn} hitSlop={10}>
          <Feather name="more-horizontal" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* ── Media (Reel thumbnail or Post carousel) ── */}
      <View style={styles.carouselWrapper}>
        {isReelCard ? (
          <Pressable onPress={handleImagePress} style={styles.mediaContainer}>
            <Image
              source={{ uri: post.thumbnailUrl || post.media?.[0]?.mediaUrl || '' }}
              style={styles.postImage}
            />
            <View style={styles.reelOverlay}>
              <View style={styles.reelPlayButton}>
                <Ionicons name="play-circle" size={52} color="#FFFFFF" />
              </View>
              {post.viewsCount && (
                <ThemedText style={styles.reelViewsText}>
                  {parseInt(post.viewsCount).toLocaleString()} views
                </ThemedText>
              )}
            </View>
          </Pressable>
        ) : post.media && post.media.length > 0 ? (
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
                listener: (e: any) => {
                  const idx = Math.round(
                    e.nativeEvent.contentOffset.x /
                      e.nativeEvent.layoutMeasurement.width,
                  );
                  if (idx !== activeIndex) setActiveIndex(idx);
                },
              },
            )}
            renderItem={({ item, index }) => (
              <Pressable onPress={handleImagePress} style={styles.mediaContainer}>
                {item.mediaType === 'VIDEO' ? (
                  <VideoItem
                    mediaUrl={item.mediaUrl}
                    isActive={index === activeIndex}
                  />
                ) : (
                  <Image source={{ uri: item.mediaUrl }} style={styles.postImage} />
                )}
              </Pressable>
            )}
          />
        ) : (
          <View style={[styles.mediaContainer, { justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
          </View>
        )}

        {/* Double-tap heart (only for posts) */}
        {!isReelCard && (
          <Animated.View
            style={[
              styles.doubleTapHeart,
              { transform: [{ scale: heartScale }], opacity: heartOpacity },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="heart" size={90} color="#FFFFFF" />
          </Animated.View>
        )}

        {/* Carousel dots (only for multi-media posts) */}
        {!isReelCard && post.media && post.media.length > 1 && (
          <View style={styles.dotsContainer}>
            {post.media.map((_, i) => {
              const range = [
                (i - 1) * WINDOW_WIDTH,
                i * WINDOW_WIDTH,
                (i + 1) * WINDOW_WIDTH,
              ];
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: colors.primary,
                      opacity: scrollX.interpolate({
                        inputRange: range,
                        outputRange: [0.4, 1, 0.4],
                        extrapolate: 'clamp',
                      }),
                      transform: [
                        {
                          scale: scrollX.interpolate({
                            inputRange: range,
                            outputRange: [0.8, 1.2, 0.8],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                    },
                  ]}
                />
              );
            })}
          </View>
        )}
      </View>

      {/* ── Action bar ── */}
      <View style={styles.actionsBar}>
        <View style={styles.actionsLeft}>
          <Pressable onPress={handleLikePress} style={styles.actionBtn}>
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Ionicons
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={26}
                color={post.isLiked ? colors.likeActive : colors.text}
              />
            </Animated.View>
          </Pressable>
          <Pressable onPress={() => setShowComments(true)} style={styles.actionBtn}>
            <Feather name="message-circle" size={24} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => setShowShareModal(true)} style={styles.actionBtn}>
            <Feather name="send" size={23} color={colors.text} />
          </Pressable>
        </View>
        <Pressable
          onPress={() => {
            haptics.light();
            toggleSave(post.id);
            onBookmarkToggle?.(post.id);
          }}
          style={styles.actionBtn}
        >
          <Ionicons
            name={isSaved(post.id) ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isSaved(post.id) ? '#0095F6' : colors.text}
          />
        </Pressable>
      </View>

      {/* ── Likes / Views ── */}
      <View style={styles.likesContainer}>
        <ThemedText type="smallBold" style={{ color: colors.text }}>
          {post.likesCount.toLocaleString()} likes
          {isReelCard && post.viewsCount ? ` · ${parseInt(post.viewsCount).toLocaleString()} views` : ''}
        </ThemedText>
      </View>

      {/* ── Caption ── */}
      {post.caption ? (
        <Pressable
          onPress={() => setCaptionExpanded(e => !e)}
          style={styles.captionContainer}
          disabled={post.caption.length <= 100}
        >
          <ThemedText
            type="small"
            style={{ color: colors.text, lineHeight: 18 }}
            numberOfLines={captionExpanded ? undefined : 3}
          >
            <ThemedText type="smallBold" style={{ color: colors.text }}>
              {username}{' '}
            </ThemedText>
            {post.caption}
          </ThemedText>
          {!captionExpanded && post.caption.length > 100 && (
            <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: 2 }}>
              more
            </ThemedText>
          )}
        </Pressable>
      ) : null}

      {/* ── Comments preview ── */}
      {localCommentsCount > 0 ? (
        <Pressable
          onPress={() => setShowComments(true)}
          style={styles.commentsPreview}
        >
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            View all {localCommentsCount.toLocaleString()} comments
          </ThemedText>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => setShowComments(true)}
          style={styles.commentsPreview}
        >
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            Add a comment...
          </ThemedText>
        </Pressable>
      )}

      {/* ── Timestamp ── */}
      <View style={styles.timestampContainer}>
        <ThemedText style={[styles.timestamp, { color: colors.textSecondary }]}>
          {formatTimeAgo(post.createdAt).toUpperCase()}
        </ThemedText>
      </View>

      {/* ── Comments sheet ── */}
      <CommentsSheet
        visible={showComments}
        postId={post.id}
        commentsCount={localCommentsCount}
        onClose={() => setShowComments(false)}
        onCommentAdded={(newCount) => setLocalCommentsCount(newCount)}
      />

      <ShareSheetModal
        visible={showShareModal}
        referenceType="post"
        referenceId={post.id}
        previewImageUrl={post.media?.[0]?.mediaUrl}
        previewCaption={post.caption}
        onClose={() => setShowShareModal(false)}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 0.5,
    paddingBottom: 14,
  },
  // Header
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
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 11,
    marginTop: 1,
  },
  moreBtn: { padding: 5 },
  reelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0095F6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    gap: 3,
  },
  reelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  // Media
  carouselWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  mediaContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH,
    backgroundColor: '#000',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  reelOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  reelPlayButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reelViewsText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPressable: { flex: 1 },
  volumeIconContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    shadowColor: '#FF3040',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignSelf: 'center',
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.38)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Actions
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
    gap: 14,
  },
  actionBtn: { padding: 2 },
  // Content
  likesContainer: { paddingHorizontal: 12 },
  captionContainer: { paddingHorizontal: 12, marginTop: 5 },
  commentsPreview: { paddingHorizontal: 12, marginTop: 5 },
  timestampContainer: { paddingHorizontal: 12, marginTop: 5 },
  timestamp: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
});