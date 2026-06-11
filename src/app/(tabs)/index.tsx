import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Modal,
  Image,
  Animated,
  Pressable,
  ActivityIndicator,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { FeedHeader } from '@/components/FeedHeader';
import { StoryCircle } from '@/components/StoryCircle';
import { PostCard } from '@/components/PostCard';
import { ThemedText } from '@/components/themed-text';
import { MOCK_STORIES, Story } from '@/constants/mockData';
import { Ionicons } from '@expo/vector-icons';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTabPager } from '@/contexts/TabPagerContext';
import * as SecureStore from 'expo-secure-store';
import ReAnimated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  useDerivedValue,
  useAnimatedProps,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Fonts } from '@/constants/theme';

// ─── Gradient Spinner (same as Profile) ──────────────────────────────────────

const AnimatedCircle = ReAnimated.createAnimatedComponent(Circle);

const PullToRefreshSpinner = ({
  progress,
  size = 38,
  isDark,
}: {
  progress: SharedValue<number>;
  size?: number;
  isDark: boolean;
}) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - Math.min(1, progress.value));
    return { strokeDashoffset };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="instaRefreshGradHome" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%"   stopColor="#4F5BD5" />
          <Stop offset="35%"  stopColor="#962FBF" />
          <Stop offset="65%"  stopColor="#D62976" />
          <Stop offset="100%" stopColor="#FA7E1E" />
        </LinearGradient>
      </Defs>
      {/* Track circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={isDark ? '#3A3A3C' : '#E5E5E5'}
        strokeWidth={strokeWidth}
        opacity={isDark ? 0.3 : 0.6}
        fill="none"
      />
      {/* Animated gradient arc */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#instaRefreshGradHome)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        fill="none"
      />
    </Svg>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { setPagerScrollEnabled } = useTabPager();
  const {
    posts,
    isLoading,
    isRefreshing,
    hasMore,
    cursor,
    fetchPosts,
    handleLikeToggle,
    handleAddComment,
  } = usePosts();

  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [showTutorial, setShowTutorial] = useState(false);

  // Initial load
  useEffect(() => {
    fetchPosts(null, true);

    const checkTutorial = async () => {
      try {
        const val = await SecureStore.getItemAsync('tutorialShown');
        if (!val) setShowTutorial(true);
      } catch (err) {
        console.error('Failed to read tutorial viewed state:', err);
      }
    };
    checkTutorial();
  }, []);

  const handleCloseTutorial = async () => {
    setShowTutorial(false);
    try {
      await SecureStore.setItemAsync('tutorialShown', 'true');
    } catch (err) {
      console.error('Failed to write tutorial viewed state:', err);
    }
  };

  // ── Pull-to-refresh (custom gradient, no native spinner) ──────────────────
  const isRefreshingShared = useSharedValue(false);
  const refreshProgress    = useSharedValue(0);
  const spinValue          = useSharedValue(0);
  const refreshBarHeight   = useSharedValue(0);
  const scrollY            = useSharedValue(0);

  // Gesture detection
  const PULL_THRESHOLD = 80;
  const startX        = useSharedValue(0);
  const startY        = useSharedValue(0);
  const dragY         = useSharedValue(0);
  const gestureActive = useSharedValue(false);

  const finishRefresh = useCallback(() => {
    refreshBarHeight.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) });
    refreshProgress.value  = withTiming(0, { duration: 200 });
    spinValue.value        = 0;
    isRefreshingShared.value = false;
  }, []);

  const triggerRefresh = useCallback(() => {
    if (isRefreshingShared.value) return;
    isRefreshingShared.value = true;

    // Open the animated bar
    refreshBarHeight.value = withSpring(64, { damping: 14, stiffness: 180 });
    refreshProgress.value  = withTiming(1, { duration: 250 });

    // Start continuous spinner rotation
    spinValue.value = 0;
    spinValue.value = withRepeat(
      withTiming(360, { duration: 600, easing: Easing.linear }),
      -1,
      false
    );

    // Fire real API refresh; close bar when done (or after max 4s)
    fetchPosts(null, true);
    setTimeout(() => {
      runOnJS(finishRefresh)();
    }, 2000);
  }, [fetchPosts, finishRefresh]);

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e) => {
      startX.value      = e.changedTouches[0].x;
      startY.value      = e.changedTouches[0].y;
      dragY.value       = 0;
      gestureActive.value = false;
    })
    .onTouchesMove((e, state) => {
      if (gestureActive.value) return;
      const dx = Math.abs(e.changedTouches[0].x - startX.value);
      const dy = e.changedTouches[0].y - startY.value;

      // Fail immediately on horizontal gestures to allow child horizontal scrolling
      if (dx > 10 && dx > Math.abs(dy)) {
        state.fail();
        return;
      }

      if (scrollY.value <= 0 && dy > 8 && !isRefreshingShared.value) {
        gestureActive.value = true;
        state.activate();
      } else if (scrollY.value > 0 || dy < -5) {
        state.fail();
      }
    })
    .onUpdate((e) => {
      if (!isRefreshingShared.value) {
        dragY.value = Math.max(0, e.translationY);
      }
    })
    .onEnd(() => {
      const pulled = dragY.value;
      dragY.value       = 0;
      gestureActive.value = false;
      if (pulled > PULL_THRESHOLD && !isRefreshingShared.value) {
        runOnJS(triggerRefresh)();
      }
    });

  // Animated styles
  const pullProgress = useDerivedValue(() => refreshProgress.value);

  const refreshBarAnimStyle = useAnimatedStyle(() => ({
    height: isRefreshingShared.value
      ? refreshBarHeight.value
      : Math.min(refreshBarHeight.value, dragY.value * 0.55),
    overflow: 'hidden' as const,
  }));

  const spinnerAnimStyle = useAnimatedStyle(() => {
    const h = isRefreshingShared.value ? refreshBarHeight.value : dragY.value * 0.55;
    const opacity = interpolate(h, [0, 40], [0, 1], Extrapolation.CLAMP);
    const scale   = interpolate(h, [0, 44], [0.5, 1], Extrapolation.CLAMP);
    const dragRot = !isRefreshingShared.value
      ? interpolate(dragY.value, [0, PULL_THRESHOLD], [0, 360], Extrapolation.CLAMP)
      : 0;
    return {
      opacity,
      transform: [
        { scale },
        { rotate: `${isRefreshingShared.value ? spinValue.value : dragRot}deg` },
      ],
    };
  });

  // ── Story Modal ───────────────────────────────────────────────────────────
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const storyProgress  = useRef(new Animated.Value(0)).current;
  const storyTimerRef  = useRef<any>(null);

  const handleLoadMore = () => {
    if (hasMore && !isLoading && !isRefreshing && cursor) {
      fetchPosts(cursor, false);
    }
  };

  const handleBookmarkToggle = (_id: string) => {
    // Handled locally in PostCard
  };

  const openStory = (story: Story) => {
    setActiveStory(story);
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, isSeen: true } : s))
    );
    storyProgress.setValue(0);
    Animated.timing(storyProgress, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false,
    }).start();
    if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    storyTimerRef.current = setTimeout(closeStory, 4000);
  };

  const closeStory = () => {
    setActiveStory(null);
    storyProgress.setValue(0);
    if (storyTimerRef.current) {
      clearTimeout(storyTimerRef.current);
      storyTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    };
  }, []);

  // ── Sub-renders ──────────────────────────────────────────────────────────

  const renderStoriesHeader = useMemo(() => {
    const renderYourStory = () => {
      const avatarUri = user?.avatar || '';
      const hasAvatar = !!avatarUri;
      return (
        <Pressable style={styles.yourStoryContainer}>
          <View style={styles.yourStoryAvatarOuter}>
            {hasAvatar ? (
              <Image source={{ uri: avatarUri }} style={styles.yourStoryAvatar} />
            ) : (
              <View
                style={[
                  styles.yourStoryAvatar,
                  styles.yourStoryAvatarPlaceholder,
                  { backgroundColor: isDark ? '#3A3A3C' : '#D4D4D4' },
                ]}
              >
                <View style={styles.silhouetteHead} />
                <View style={styles.silhouetteBody} />
              </View>
            )}
            <View style={styles.yourStoryAddBadge}>
              <Ionicons name="add" size={13} color="#FFFFFF" />
            </View>
          </View>
          <ThemedText
            numberOfLines={1}
            style={[styles.yourStoryLabel, { color: isDark ? '#FFFFFF' : '#262626' }]}
          >
            Your story
          </ThemedText>
        </Pressable>
      );
    };

    return (
      <View style={[styles.storiesContainer, { borderBottomColor: colors.border }]}>
        <View
          onStartShouldSetResponderCapture={() => {
            setPagerScrollEnabled(false);
            return false;
          }}
          onTouchEnd={() => setPagerScrollEnabled(true)}
          onTouchCancel={() => setPagerScrollEnabled(true)}
        >
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={stories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.storiesList}
            ListHeaderComponent={renderYourStory}
            nestedScrollEnabled={true}
            renderItem={({ item }) => (
              <StoryCircle
                username={item.username}
                avatar={item.avatar}
                isSeen={item.isSeen}
                onPress={() => openStory(item)}
              />
            )}
          />
        </View>
      </View>
    );
  }, [stories, colors.border, isDark, user, setPagerScrollEnabled]);

  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Fixed header */}
      <FeedHeader />

      {/* ── Custom gradient refresh bar (below header) ── */}
      <ReAnimated.View style={[styles.refreshBar, refreshBarAnimStyle]}>
        <ReAnimated.View style={[styles.refreshSpinner, spinnerAnimStyle]}>
          <PullToRefreshSpinner progress={pullProgress} isDark={isDark} />
        </ReAnimated.View>
      </ReAnimated.View>

      {/* ── Feed list wrapped in gesture detector ── */}
      <GestureDetector gesture={panGesture}>
        <View style={{ flex: 1 }}>
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderStoriesHeader}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onLikeToggle={handleLikeToggle}
                onBookmarkToggle={handleBookmarkToggle}
                onAddComment={handleAddComment}
              />
            )}
            onScroll={(e) => {
              scrollY.value = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            overScrollMode="never"
            bounces={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            contentContainerStyle={styles.feedScroll}
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyFeed}>
                  <ThemedText style={{ color: colors.textSecondary }}>
                    No posts available. Be the first to create one!
                  </ThemedText>
                </View>
              ) : null
            }
          />
        </View>
      </GestureDetector>

      {/* ── Fullscreen Story Viewer ── */}
      {activeStory && (
        <Modal visible={activeStory !== null} transparent animationType="fade">
          <View style={styles.storyOverlay}>
            <View style={styles.storyHeaderContainer}>
              <View style={[styles.storyProgressBarContainer, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                <Animated.View
                  style={[
                    styles.storyProgressBar,
                    {
                      backgroundColor: '#FFFFFF',
                      width: storyProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <View style={styles.storyUserRow}>
                <Image source={{ uri: activeStory.avatar }} style={styles.storyUserAvatar} />
                <ThemedText type="smallBold" style={styles.storyUsername}>
                  {activeStory.username}
                </ThemedText>
                <Pressable onPress={closeStory} style={styles.storyCloseButton}>
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
            <Image source={{ uri: activeStory.imageUrl }} style={styles.storyImage} />
          </View>
        </Modal>
      )}

      {/* ── Tutorial Modal ── */}
      {showTutorial && (
        <Modal transparent visible={showTutorial} animationType="none" onRequestClose={handleCloseTutorial}>
          <View style={styles.tutorialOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseTutorial}>
              <ReAnimated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              />
            </Pressable>
            <ReAnimated.View
              entering={SlideInDown.duration(350)}
              exiting={SlideOutDown.duration(250)}
              style={[styles.tutorialCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
            >
              <Image
                source={require('@/assets/images/navigation_tutorial.jpg')}
                style={styles.tutorialImage}
                resizeMode="contain"
              />
              <Text style={[styles.tutorialTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Swipe to easily access Reels and messages
              </Text>
              <Text style={[styles.tutorialSubtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                We've simplified our navigation to help you find and enjoy your favorite parts of Instagram.
              </Text>
              <Pressable style={styles.tutorialButton} onPress={handleCloseTutorial}>
                <Text style={styles.tutorialButtonText}>Got it</Text>
              </Pressable>
            </ReAnimated.View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  feedScroll: { paddingBottom: 20 },

  // ── Custom refresh bar
  refreshBar: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  refreshSpinner: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  // ── Stories
  storiesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  storiesList: {
    paddingHorizontal: 15,
  },

  // ── Your Story
  yourStoryContainer: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  yourStoryAvatarOuter: {
    position: 'relative',
    width: 66,
    height: 66,
  },
  yourStoryAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  yourStoryAvatarPlaceholder: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  silhouetteHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#A8A8A8',
    marginBottom: 2,
  },
  silhouetteBody: {
    width: 40,
    height: 28,
    borderRadius: 20,
    backgroundColor: '#A8A8A8',
    marginBottom: -6,
  },
  yourStoryAddBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  yourStoryLabel: {
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '400',
  },

  footerLoader: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  emptyFeed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 30,
  },

  // ── Story Viewer Modal
  storyOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: '100%',
    height: '85%',
    resizeMode: 'cover',
  },
  storyHeaderContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    zIndex: 10,
    gap: 12,
  },
  storyProgressBarContainer: {
    height: 3,
    width: '100%',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  storyProgressBar: { height: '100%' },
  storyUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  storyUsername: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  storyCloseButton: {
    marginLeft: 'auto',
    padding: 5,
  },

  // ── Tutorial Modal
  tutorialOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  tutorialCard: {
    width: '100%',
    borderRadius: 36,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  tutorialImage: {
    width: '80%',
    height: 160,
    marginBottom: 20,
  },
  tutorialTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  tutorialSubtitle: {
    fontSize: 14.5,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  tutorialButton: {
    backgroundColor: '#0064E0',
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 15.5,
  },
});
