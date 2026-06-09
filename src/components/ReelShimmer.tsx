import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export const ReelShimmer = () => {
  const insets = useSafeAreaInsets();
  const tabHeight = Platform.OS === 'ios'
    ? 50 + insets.bottom
    : 60 + (insets.bottom > 0 ? insets.bottom - 5 : 8);

  const bottomOffset = tabHeight + 15;
  const translateX = useRef(new Animated.Value(-WINDOW_WIDTH)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(translateX, {
        toValue: WINDOW_WIDTH,
        duration: 1500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();
    return () => {
      shimmerAnimation.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Skeletons Layout */}
      {/* Right Sidebar Skeletons */}
      <View style={[styles.rightSidebar, { bottom: bottomOffset }]}>
        <View style={styles.musicDiscSkeleton} />
        <View style={styles.circleSkeleton} />
        <View style={styles.textSkeletonShort} />
        <View style={styles.circleSkeleton} />
        <View style={styles.textSkeletonShort} />
        <View style={styles.circleSkeleton} />
        <View style={styles.circleSkeleton} />
      </View>

      {/* Bottom Details Skeletons */}
      <View style={[styles.bottomOverlay, { bottom: bottomOffset }]}>
        <View style={styles.userRow}>
          <View style={styles.avatarSkeleton} />
          <View style={styles.usernameSkeleton} />
          <View style={styles.followSkeleton} />
        </View>
        <View style={styles.captionLineLong} />
        <View style={styles.captionLineMedium} />
        <View style={styles.musicRowSkeleton} />
      </View>

      {/* Sweeping Shimmer Highlight Overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.02)',
            'rgba(255, 255, 255, 0.08)',
            'rgba(255, 255, 255, 0.14)',
            'rgba(255, 255, 255, 0.08)',
            'rgba(255, 255, 255, 0.02)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F0F10',
    overflow: 'hidden',
  },
  rightSidebar: {
    position: 'absolute',
    right: 15,
    alignItems: 'center',
    gap: 20,
    zIndex: 2,
  },
  circleSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  textSkeletonShort: {
    width: 24,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: -12, // Pull text placeholder closer to its circular button
  },
  musicDiscSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 5,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 15,
    right: 80,
    zIndex: 2,
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  usernameSkeleton: {
    width: 90,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  followSkeleton: {
    width: 64,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  captionLineLong: {
    width: '90%',
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  captionLineMedium: {
    width: '65%',
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  musicRowSkeleton: {
    width: 120,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 4,
  },
});
