import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
  useDerivedValue,
  useAnimatedProps,
  SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface PullToRefreshSpinnerProps {
  progress: SharedValue<number>;
  size?: number;
  isDark: boolean;
}

const PullToRefreshSpinner: React.FC<PullToRefreshSpinnerProps> = ({
  progress,
  size = 38,
  isDark,
}) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - Math.min(1, progress.value));
    return {
      strokeDashoffset,
    };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="instaRefreshGradShared" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4F5BD5" />
          <Stop offset="35%" stopColor="#962FBF" />
          <Stop offset="65%" stopColor="#D62976" />
          <Stop offset="100%" stopColor="#FA7E1E" />
        </LinearGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={isDark ? '#3A3A3C' : '#E5E5E5'}
        strokeWidth={strokeWidth}
        opacity={isDark ? 0.3 : 0.6}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#instaRefreshGradShared)"
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

interface GradientPullRefreshProps {
  onRefresh: () => Promise<void>;
  scrollY: SharedValue<number>;
  children: React.ReactNode;
}

export const GradientPullRefresh: React.FC<GradientPullRefreshProps> = ({
  onRefresh,
  scrollY,
  children,
}) => {
  const { isDark } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isRefreshingShared = useSharedValue(false);
  const refreshProgress = useSharedValue(0);
  const spinValue = useSharedValue(0);
  const refreshBarHeight = useSharedValue(0);

  const PULL_THRESHOLD = 80;
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dragY = useSharedValue(0);
  const gestureActive = useSharedValue(false);

  const finishRefresh = useCallback(() => {
    refreshBarHeight.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) });
    refreshProgress.value = withTiming(0, { duration: 200 });
    spinValue.value = 0;
    isRefreshingShared.value = false;
    setIsRefreshing(false);
  }, []);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshingShared.value) return;
    isRefreshingShared.value = true;
    setIsRefreshing(true);

    refreshBarHeight.value = withSpring(64, { damping: 14, stiffness: 180 });
    refreshProgress.value = withTiming(1, { duration: 250 });

    spinValue.value = 0;
    spinValue.value = withRepeat(
      withTiming(360, { duration: 600, easing: Easing.linear }),
      -1,
      false
    );

    try {
      await onRefresh();
    } catch (err) {
      console.warn('[GradientPullRefresh] Refresh failed:', err);
    } finally {
      runOnJS(finishRefresh)();
    }
  }, [onRefresh, finishRefresh]);

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e) => {
      startX.value = e.changedTouches[0].x;
      startY.value = e.changedTouches[0].y;
      dragY.value = 0;
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
      dragY.value = 0;
      gestureActive.value = false;
      if (pulled > PULL_THRESHOLD && !isRefreshingShared.value) {
        runOnJS(triggerRefresh)();
      }
    });

  const pullProgress = useDerivedValue(() => refreshProgress.value);

  const refreshBarAnimStyle = useAnimatedStyle(() => ({
    height: isRefreshingShared.value
      ? refreshBarHeight.value
      : Math.min(refreshBarHeight.value, dragY.value * 0.55),
    overflow: 'hidden',
  }));

  const spinnerAnimStyle = useAnimatedStyle(() => {
    const h = isRefreshingShared.value ? refreshBarHeight.value : dragY.value * 0.55;
    const opacity = interpolate(h, [0, 40], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(h, [0, 44], [0.5, 1], Extrapolation.CLAMP);
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

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <Animated.View style={[styles.refreshBar, refreshBarAnimStyle]}>
          <Animated.View style={[styles.spinnerContainer, spinnerAnimStyle]}>
            <PullToRefreshSpinner progress={pullProgress} isDark={isDark} />
          </Animated.View>
        </Animated.View>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  refreshBar: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
});
