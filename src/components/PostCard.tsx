import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Post } from '@/contexts/PostsContext';
import { CommentsSheet } from '@/components/CommentsSheet';
import { ShareSheetModal } from './ShareSheetModal';
import { useAuth } from '@/contexts/AuthContext';
import { haptics } from '@/utils/haptics';
import { useSaved } from '@/contexts/SavedContext';
import { useRouter } from 'expo-router';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';

const WINDOW_WIDTH = Dimensions.get('window').width;

// ─── Inline Video Player ──────────────────────────────────────────────────────

let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (e) {}

// Global muting state to sync sound settings across all feed items (matching Instagram UX)
let globalFeedMuted = true;

const VideoItem: React.FC<{
  mediaUrl: string;
  isActive: boolean;
  onDoubleTap?: () => void;
}> = ({
  mediaUrl,
  isActive,
  onDoubleTap,
}) => {
  const [isMuted, setIsMuted] = useState(globalFeedMuted);
  const [player, setPlayer] = useState<any>(null);
  const opacity = useSharedValue(0);

  const lastTapRef = useRef(0);
  const singleTapTimeoutRef = useRef<any>(null);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

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
    if (player) {
      if (isActive) {
        player.play();
        opacity.value = withTiming(1, { duration: 300 });
      } else {
        player.pause();
        opacity.value = 0;
      }
    } else {
      opacity.value = 0;
    }
  }, [isActive, player]);

  // Keep player muted state in sync with local state
  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

  // Keep local state in sync with global feed muting state changes
  useEffect(() => {
    setIsMuted(globalFeedMuted);
  }, [isActive]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    globalFeedMuted = nextMuted;
  };

  const handlePress = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 280) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapRef.current = 0;
      onDoubleTap?.();
    } else {
      lastTapRef.current = now;
      singleTapTimeoutRef.current = setTimeout(() => {
        lastTapRef.current = 0;
        handleToggleMute();
      }, 250);
    }
  };

  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
    };
  }, []);

  if (!ExpoVideo) {
    return (
      <View style={styles.videoPlaceholder}>
        <Ionicons name="play-circle" size={48} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <Pressable onPress={handlePress} style={StyleSheet.absoluteFill}>
      {player && (
        <ReAnimated.View style={[StyleSheet.absoluteFill, animStyle]}>
          <ExpoVideo.VideoView
            key={`post-video-${mediaUrl}`}
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
        </ReAnimated.View>
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
  isActive?: boolean;
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
  onAddComment: (postId: string, text: string) => Promise<any>;
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

export const PostCard: React.FC<PostCardProps> = ({
  post,
  isActive = false,
  onLikeToggle,
  onBookmarkToggle,
  onAddComment,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [showComments, setShowComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.commentsCount);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  // useRef instead of useState — avoids stale closure in handleImagePress
  const lastTapRef = useRef(0);
  const { isSaved, toggleSave } = useSaved();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(post.user?.isFollowing ?? false);

  const handleFollowToggle = async () => {
    const targetId = post.userId || post.user?.id;
    if (!targetId) return;
    haptics.onButtonPress();
    const previous = isFollowing;
    setIsFollowing(!previous);
    try {
      const { followService } = require('@/services/follow');
      if (previous) {
        await followService.unfollowUser(targetId);
      } else {
        await followService.followUser(targetId);
      }
    } catch (err) {
      console.error('[PostCard] Follow toggle error:', err);
      setIsFollowing(previous);
    }
  };

  // Sync count from prop when feed refreshes
  useEffect(() => {
    setLocalCommentsCount(post.commentsCount);
    setIsFollowing(post.user?.isFollowing ?? false);
  }, [post.commentsCount, post.user?.isFollowing]);

  const scrollX = useRef(new Animated.Value(0)).current;

  // ── Animations ──
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(1)).current;

  // Separate animated values for reel double-tap heart (same animation, clean lifecycle)
  const reelHeartScale = useRef(new Animated.Value(0)).current;
  const reelHeartOpacity = useRef(new Animated.Value(0)).current;

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

  const triggerReelDoubleTapHeart = () => {
    reelHeartScale.setValue(0);
    reelHeartOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(reelHeartScale, {
        toValue: 1,
        friction: 3,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(reelHeartOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
    ]).start();
  };

  // ── Handlers ──
  const handleReelDoubleTap = () => {
    haptics.onLike();
    if (!post.isLiked) {
      onLikeToggle(post.id);
      triggerLikeAnim();
    }
    triggerReelDoubleTapHeart();
  };

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
      if (isReelCard) {
        // Wait 300ms to see if a second tap comes in
        setTimeout(() => {
          if (lastTapRef.current === now) {
            lastTapRef.current = 0;
            router.push(`/reel/${post.id}` as any);
          }
        }, 300);
      }
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
    <ReAnimated.View entering={FadeInDown.duration(280).springify()} style={[styles.container, { borderBottomColor: colors.border }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerLeft}
          onPress={() => router.push(`/profile/${post.user?.id}` as any)}
          hitSlop={4}
        >
          <ExpoImage
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            transition={200}
          />
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
        </Pressable>

        <View style={styles.headerRight}>
          {/* Follow button — shown for other users' posts */}
          {post.user?.id !== user?.id && (
            <>
              <Pressable
                onPress={handleFollowToggle}
                style={({ pressed }) => [
                  styles.followBtn,
                  isFollowing && styles.followingBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <ThemedText
                  style={[
                    styles.followBtnText,
                    isFollowing && { color: colors.text },
                  ]}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </ThemedText>
              </Pressable>
              <View style={[styles.headerDot, { backgroundColor: colors.textSecondary }]} />
            </>
          )}
          <Pressable style={styles.moreBtn} hitSlop={10}>
            <Feather name="more-horizontal" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* ── Media (Reel thumbnail or Post carousel) ── */}
      <View style={[styles.carouselWrapper, isReelCard && styles.reelCarouselWrapper]}>
        {isReelCard ? (
          <Pressable onPress={handleImagePress} style={styles.reelMediaContainer}>
            {/* Always render the thumbnail poster in the background */}
            <ExpoImage
              source={{ uri: post.thumbnailUrl || post.media?.[0]?.mediaUrl || '' }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              transition={300}
            />

            {/* If active, render the video player on top of it, fading in */}
            {isActive && (
              <VideoItem
                mediaUrl={post.hlsUrl || post.media?.[0]?.mediaUrl || ''}
                isActive={isActive}
                onDoubleTap={handleReelDoubleTap}
              />
            )}

            {/* If NOT active, show the play button overlay */}
            {!isActive && (
              <View style={styles.reelOverlay}>
                <View style={styles.reelPlayButtonContainer}>
                  <Ionicons name="play" size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
                </View>
              </View>
            )}

            {/* ── Double-tap heart overlay for Reel ── */}
            <Animated.View
              style={[
                styles.reelDoubleTapHeart,
                {
                  transform: [{ scale: reelHeartScale }],
                  opacity: reelHeartOpacity,
                },
              ]}
              pointerEvents="none"
            >
              <Ionicons name="heart" size={100} color="#FFFFFF" />
            </Animated.View>
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
                    isActive={isActive && index === activeIndex}
                  />
                ) : (
                  <ExpoImage
                    source={{ uri: item.mediaUrl }}
                    style={styles.postImage}
                    contentFit="cover"
                    placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                    transition={300}
                  />
                )}
              </Pressable>
            )}
          />
        ) : (
          <View style={[styles.mediaContainer, { justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
          </View>
        )}

        {/* Double-tap heart (for posts and reels) */}
        {true && (
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
          onPress={() => {
            haptics.light();
            router.push(`/post/${post.id}` as any);
          }}
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
    </ReAnimated.View>
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  followBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0095F6',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 2,
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
  reelCarouselWrapper: {
    aspectRatio: 0.8, // 4:5 aspect ratio for Reels in feed
  },
  mediaContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH,
    backgroundColor: '#000',
  },
  reelMediaContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH * 1.25,
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
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  reelPlayButtonContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
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
  reelDoubleTapHeart: {
    position: 'absolute',
    zIndex: 30,
    alignSelf: 'center',
    top: '50%',
    marginTop: -50,
    // Premium glow shadow matching Instagram's burst effect
    shadowColor: '#FF3040',
    shadowOpacity: 0.6,
    shadowRadius: 30,
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