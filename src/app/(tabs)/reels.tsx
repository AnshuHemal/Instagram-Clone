import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
  Text,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useReels } from '@/contexts/ReelsContext';
import { ReelItem } from '@/components/ReelItem';
import { Fonts } from '@/constants/theme';
import ReAnimated, {
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
        <LinearGradient id="instaRefreshGradReels" x1="0%" y1="0%" x2="100%" y2="100%">
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
        stroke="url(#instaRefreshGradReels)"
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


export default function ReelsScreen({ isTabActive = true }: { isTabActive?: boolean }) {
  const { colors, isDark } = useTheme();
  const {
    reels,
    isLoading,
    isRefreshing,
    hasMore,
    cursor,
    activeId,
    setActiveId,
    prewarmedPlayer,
    players,
    fetchReels,
    handleLikeToggle,
  } = useReels();

  const [isFocused, setIsFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );
  
  const { height: windowHeight } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveId(viewableItems[0].item.id);
    }
  }).current;

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

    // Fire real API refresh; close bar when done
    fetchReels(null, true);
    setTimeout(() => {
      runOnJS(finishRefresh)();
    }, 2000);
  }, [fetchReels, finishRefresh]);

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

  // Prefetch or refresh the reels list if not loaded yet
  useEffect(() => {
    if (reels.length === 0) {
      fetchReels(null, true);
    }
  }, []);

  const handleRefresh = () => {
    fetchReels(null, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading && cursor) {
      fetchReels(cursor, false);
    }
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading || isRefreshing) return null;
    return (
      <View style={[styles.emptyContainer, { height: windowHeight }]}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="film-outline" size={40} color="rgba(255,255,255,0.5)" />
        </View>
        <Text style={styles.emptyTitle}>No Reels Yet</Text>
        <Text style={styles.emptySubtitle}>
          Reels from people you follow will appear here.
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {isFocused && <StatusBar style="light" />}

      {/* ── Custom gradient refresh bar ── */}
      <ReAnimated.View style={[styles.refreshBar, refreshBarAnimStyle]}>
        <ReAnimated.View style={[styles.refreshSpinner, spinnerAnimStyle]}>
          <PullToRefreshSpinner progress={pullProgress} isDark={isDark} />
        </ReAnimated.View>
      </ReAnimated.View>

      <GestureDetector gesture={panGesture}>
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={reels}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ReelItem
                reel={item}
                isActive={item.id === activeId}
                isScreenFocused={isFocused && isTabActive}
                onLikeToggle={handleLikeToggle}
                height={windowHeight}
                preloadedPlayer={players[item.id] || null}
              />
            )}
            pagingEnabled={true}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            onScroll={(e) => {
              scrollY.value = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            style={styles.list}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: windowHeight,
              offset: windowHeight * index,
              index,
            })}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  footerLoader: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  emptyContainer: {
    flex: 1,
    height: 500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#A8A8A8',
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#A8A8A8',
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  refreshBar: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'absolute',
    top: 40,
    zIndex: 999,
  },
  refreshSpinner: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 2,
  },
});
