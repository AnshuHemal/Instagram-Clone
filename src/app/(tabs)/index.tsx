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
import { FeedSkeleton, Skeleton } from '@/components/Skeleton';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStories, UserStoryGroup } from '@/contexts/StoriesContext';
import { useToast } from '@/contexts/ToastContext';
import { StoryPlayerModal } from '@/components/StoryPlayerModal';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { followService } from '@/services/follow';
import { api } from '@/services/api';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
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
  const router = useRouter();
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

  const { stories, fetchStories, uploadStory, viewStory, loading: storiesLoading } = useStories();
  const { showToast } = useToast();
  const [playerVisible, setPlayerVisible] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const res = await api.get('/auth/users/suggestions');
      if (res.data && Array.isArray(res.data)) {
        setSuggestions(res.data);
      }
    } catch (err) {
      console.error('[FeedScreen] Failed to fetch follow suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (posts.length === 0 && !isLoading) {
      fetchSuggestions();
    }
  }, [posts.length, isLoading]);

  const handleFollowSuggestion = async (targetId: string) => {
    // Optimistic toggle
    setSuggestions(prev => prev.map(u => u.id === targetId ? { ...u, checked: !u.checked } : u));
    
    try {
      const u = suggestions.find(s => s.id === targetId);
      if (u) {
        if (u.checked) {
          await followService.unfollowUser(targetId);
        } else {
          await followService.followUser(targetId);
        }
        triggerRefresh();
      }
    } catch (err) {
      console.error('Failed to toggle follow suggestion:', err);
      // Rollback
      setSuggestions(prev => prev.map(u => u.id === targetId ? { ...u, checked: !u.checked } : u));
    }
  };

  const handleDismissSuggestion = (targetId: string) => {
    setSuggestions(prev => prev.filter(u => u.id !== targetId));
  };

  // Initial load
  useEffect(() => {
    fetchPosts(null, true);
    fetchStories();

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

  const triggerRefresh = useCallback(async () => {
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

    // Fire real API refresh; close bar when done
    try {
      await Promise.all([
        fetchPosts(null, true),
        fetchStories(),
      ]);
    } catch (err) {
      console.error('[FeedScreen] Refresh failed:', err);
    } finally {
      runOnJS(finishRefresh)();
    }
  }, [fetchPosts, fetchStories, finishRefresh]);

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

  // ── Story Opening and Media Selection ─────────────────────────────────────
  const openStoriesGroup = (index: number) => {
    setSelectedGroupIndex(index);
    setPlayerVisible(true);
  };

  const handleAddStory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const type = asset.type === 'video' ? 'video' : 'image';

      showToast({
        title: 'Uploading Story',
        message: 'Your story is uploading to Cloudinary...',
        type: 'info',
      });

      const success = await uploadStory(asset.uri, type);

      if (success) {
        showToast({
          title: 'Story Shared',
          message: 'Your story has been shared successfully.',
          type: 'success',
        });
      } else {
        showToast({
          title: 'Upload Failed',
          message: 'Failed to upload your story. Please try again.',
          type: 'error',
        });
      }
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading && !isRefreshing && cursor) {
      fetchPosts(cursor, false);
    }
  };

  const handleBookmarkToggle = (_id: string) => {
    // Handled locally in PostCard
  };

  const renderStoriesHeader = useMemo(() => {
    const renderYourStory = () => {
      const avatarUri = user?.avatar || '';
      const hasAvatar = !!avatarUri;
      const userGroup = stories.find((g) => g.userId === user?.id);

      const handlePress = () => {
        if (userGroup) {
          const idx = stories.findIndex((g) => g.userId === user?.id);
          if (idx !== -1) {
            openStoriesGroup(idx);
          }
        } else {
          handleAddStory();
        }
      };

      const ringSize = 66;
      const innerSize = 62;
      const size = 60;

      return (
        <Pressable style={styles.yourStoryContainer} onPress={handlePress}>
          <View style={styles.yourStoryAvatarOuter}>
            {userGroup ? (
              userGroup.isSeen ? (
                <View
                  style={[
                    styles.seenRing,
                    {
                      width: ringSize,
                      height: ringSize,
                      borderRadius: ringSize / 2,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: avatarUri || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                  />
                </View>
              ) : (
                <ExpoLinearGradient
                  colors={colors.storyRing as any}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.gradientRing,
                    {
                      width: ringSize,
                      height: ringSize,
                      borderRadius: ringSize / 2,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.innerRing,
                      {
                        width: innerSize,
                        height: innerSize,
                        borderRadius: innerSize / 2,
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: avatarUri || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }}
                      style={{ width: size, height: size, borderRadius: size / 2 }}
                    />
                  </View>
                </ExpoLinearGradient>
              )
            ) : (
              <View style={styles.avatarNoStory}>
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
                <Pressable onPress={handleAddStory} style={styles.yourStoryAddBadge} hitSlop={8}>
                  <Ionicons name="add" size={13} color="#FFFFFF" />
                </Pressable>
              </View>
            )}
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

    const otherStories = stories.filter((g) => g.userId !== user?.id);
    const showSkeletons = storiesLoading && otherStories.length === 0;
    const storiesData: (string | UserStoryGroup)[] = showSkeletons 
      ? ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] 
      : otherStories;

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
            data={storiesData}
            keyExtractor={(item) => (typeof item === 'string' ? item : item.userId)}
            contentContainerStyle={styles.storiesList}
            ListHeaderComponent={renderYourStory}
            nestedScrollEnabled={true}
            renderItem={({ item }) => {
              if (typeof item === 'string') {
                return (
                  <View style={{ marginRight: 15, alignItems: 'center', width: 66 }}>
                    <Skeleton width={66} height={66} borderRadius={33} />
                    <Skeleton width={45} height={10} borderRadius={5} style={{ marginTop: 6 }} />
                  </View>
                );
              }
              const globalIndex = stories.findIndex((g) => g.userId === item.userId);
              return (
                <StoryCircle
                  username={item.username}
                  avatar={item.avatar}
                  isSeen={item.isSeen}
                  onPress={() => openStoriesGroup(globalIndex)}
                />
              );
            }}
          />
        </View>
      </View>
    );
  }, [stories, storiesLoading, colors.border, colors.storyRing, isDark, user, setPagerScrollEnabled]);

  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmptyFeed = () => {
    if (isLoading) {
      return <FeedSkeleton />;
    }

    return (
      <View style={styles.emptyFeedContainer}>
        <View style={styles.emptyFeedHeader}>
          <Ionicons name="people-circle-outline" size={54} color={colors.primary} />
          <ThemedText style={[styles.emptyFeedTitle, { color: colors.text }]}>
            Welcome to your Feed!
          </ThemedText>
          <ThemedText style={styles.emptyFeedSubtitle}>
            Follow accounts to see photos and videos in your timeline.
          </ThemedText>
        </View>

        {loadingSuggestions && suggestions.length === 0 ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
        ) : suggestions.length > 0 ? (
          <View style={styles.suggestionsWrapper}>
            <View style={styles.suggestionsHeaderRow}>
              <ThemedText style={[styles.suggestionsSectionTitle, { color: colors.text }]}>
                Suggested for you
              </ThemedText>
              <Pressable onPress={() => router.push('/(auth)/follow-suggestions')}>
                <ThemedText style={{ color: '#0095F6', fontFamily: Fonts.bold, fontSize: 13.5 }}>
                  See All
                </ThemedText>
              </Pressable>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={suggestions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.suggestionsCarouselList}
              renderItem={({ item, index }) => (
                <ReAnimated.View
                  entering={FadeIn.delay(index * 100).duration(300)}
                  style={[
                    styles.suggestionFeedCard,
                    {
                      backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9',
                      borderColor: isDark ? '#2C2C2E' : '#E5E5E5',
                    },
                  ]}
                >
                  <Pressable 
                    onPress={() => handleDismissSuggestion(item.id)} 
                    style={styles.dismissFeedSuggestion} 
                    hitSlop={6}
                  >
                    <Ionicons name="close" size={13} color={colors.textSecondary} />
                  </Pressable>

                  <Pressable onPress={() => router.push({ pathname: '/profile', params: { userId: item.id } })}>
                    <Image source={{ uri: item.avatarUrl }} style={styles.suggestionFeedAvatar} />
                  </Pressable>

                  <View style={styles.suggestionFeedNameRow}>
                    <ThemedText
                      numberOfLines={1}
                      style={[styles.suggestionFeedUsername, { color: colors.text }]}
                    >
                      {item.username}
                    </ThemedText>
                    {item.verified && (
                      <Ionicons name="checkmark-circle" size={13} color="#0095F6" />
                    )}
                  </View>

                  <ThemedText
                    numberOfLines={1}
                    style={[styles.suggestionFeedDisplayName, { color: colors.textSecondary }]}
                  >
                    {item.displayName}
                  </ThemedText>

                  <Pressable
                    onPress={() => handleFollowSuggestion(item.id)}
                    style={[
                      styles.suggestionFeedFollowBtn,
                      item.checked
                        ? {
                            backgroundColor: 'transparent',
                            borderWidth: 0.8,
                            borderColor: isDark ? '#555' : '#DBDBDB',
                          }
                        : { backgroundColor: '#0095F6' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.suggestionFeedFollowBtnText,
                        { color: item.checked ? colors.text : '#FFFFFF' },
                      ]}
                    >
                      {item.checked ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                </ReAnimated.View>
              )}
            />
          </View>
        ) : (
          <View style={styles.emptyFeedPlaceholderContainer}>
            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
              No suggestions available. Create a post to start the conversation!
            </ThemedText>
          </View>
        )}
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
            ListEmptyComponent={renderEmptyFeed}
          />
        </View>
      </GestureDetector>

      {/* ── Fullscreen Story Viewer ── */}
      <StoryPlayerModal
        visible={playerVisible}
        userGroups={stories}
        initialGroupIndex={selectedGroupIndex}
        onClose={() => setPlayerVisible(false)}
        onStoryViewed={viewStory}
      />

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
  gradientRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  seenRing: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  avatarNoStory: {
    position: 'relative',
    width: 66,
    height: 66,
  },
  // ── Empty Feed & Follow Suggestions
  emptyFeedContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyFeedHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  emptyFeedTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyFeedSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  suggestionsWrapper: {
    width: '100%',
    paddingLeft: 16,
  },
  suggestionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 24,
    marginBottom: 16,
  },
  suggestionsSectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  suggestionsCarouselList: {
    paddingRight: 24,
    paddingBottom: 10,
  },
  suggestionFeedCard: {
    width: 140,
    borderRadius: 12,
    borderWidth: 0.8,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  dismissFeedSuggestion: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    padding: 2,
  },
  suggestionFeedAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  suggestionFeedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
    marginBottom: 2,
  },
  suggestionFeedUsername: {
    fontFamily: Fonts.bold,
    fontSize: 12.5,
    textAlign: 'center',
    maxWidth: '80%',
  },
  suggestionFeedDisplayName: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    textAlign: 'center',
    width: '100%',
    marginBottom: 12,
  },
  suggestionFeedFollowBtn: {
    width: '100%',
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionFeedFollowBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  emptyFeedPlaceholderContainer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
