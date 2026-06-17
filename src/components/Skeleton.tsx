import React from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SkeletonVariant = 'text' | 'avatar' | 'rect' | 'post' | 'reel' | 'notification' | 'user' | 'grid';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  borderRadius,
  style,
  count = 1,
}) => {
  const { isDark } = useTheme();
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const baseColor = isDark ? '#1C1C1E' : '#F0F0F0';
  const highlightColor = isDark ? '#2C2C2E' : '#E0E0E0';

  const animatedBg = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [baseColor, highlightColor],
  });

  const ShimmerView: React.FC<{ style: any; children?: React.ReactNode }> = ({ style, children }) => (
    <Animated.View style={[style, { backgroundColor: animatedBg }]}>
      {children}
    </Animated.View>
  );

  const renderVariant = () => {
    switch (variant) {
      case 'avatar':
        return <ShimmerView style={[styles.avatar, { width, height, borderRadius: borderRadius ?? 999 }]} />;
      case 'text':
        return <ShimmerView style={[styles.text, { width, height, borderRadius: borderRadius ?? 4 }]} />;
      case 'post':
        return (
          <View style={[styles.postCard, style]}>
            <View style={styles.postHeader}>
              <ShimmerView style={styles.avatar} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <ShimmerView style={{ width: '60%', height: 12, marginBottom: 6, borderRadius: 4 }} />
                <ShimmerView style={{ width: '40%', height: 10, borderRadius: 4 }} />
              </View>
            </View>
            <ShimmerView style={{ width: '100%', aspectRatio: 1, borderRadius: 0 }} />
            <View style={styles.postActions}>
              {[0, 1, 2].map((i) => <ShimmerView key={i} style={{ width: 24, height: 24, borderRadius: 12 }} />)}
            </View>
          </View>
        );
      case 'reel':
        return (
          <View style={[styles.reelCard, style]}>
            <ShimmerView style={{ width: '100%', aspectRatio: 9/16, borderRadius: 0 }} />
            <View style={{ padding: 8 }}>
              <ShimmerView style={{ width: '80%', height: 12, marginBottom: 6, borderRadius: 4 }} />
              <ShimmerView style={{ width: '50%', height: 10, borderRadius: 4 }} />
            </View>
          </View>
        );
      case 'notification':
        return (
          <View style={[styles.notificationCard, style]}>
            <View style={styles.notifLeft}>
              <ShimmerView style={styles.avatar} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <ShimmerView style={{ width: '90%', height: 12, marginBottom: 6, borderRadius: 4 }} />
                <ShimmerView style={{ width: '60%', height: 10, borderRadius: 4 }} />
              </View>
            </View>
            <ShimmerView style={{ width: 44, height: 44, borderRadius: 4 }} />
          </View>
        );
      case 'user':
        return (
          <View style={[styles.userCard, style]}>
            <ShimmerView style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <ShimmerView style={{ width: '70%', height: 13, marginBottom: 5, borderRadius: 4 }} />
              <ShimmerView style={{ width: '50%', height: 11, borderRadius: 4 }} />
            </View>
            <ShimmerView style={{ width: 70, height: 30, borderRadius: 8 }} />
          </View>
        );
      case 'grid':
        return <ShimmerView style={{ width, height, borderRadius: borderRadius ?? 2 }} />;
      case 'rect':
      default:
        return <ShimmerView style={{ width, height, borderRadius: borderRadius ?? 4 }} />;
    }
  };

  if (count > 1 && ['post', 'reel', 'notification', 'user'].includes(variant)) {
    return (
      <View style={style}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={{ marginBottom: i < count - 1 ? 12 : 0 }}>{renderVariant()}</View>
        ))}
      </View>
    );
  }

  return renderVariant();
};

export const FeedSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={{ paddingVertical: 8 }}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={{ marginBottom: 12 }}>
        <Skeleton variant="post" />
      </View>
    ))}
  </View>
);

export const ExploreSkeleton: React.FC = () => {
  const items = Array.from({ length: 12 });
  return (
    <View style={{ paddingHorizontal: 0.5, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: SCREEN_WIDTH }}>
        {items.map((_, i) => {
          const modulo = i % 10;
          const isLarge = modulo === 2 || modulo === 7;
          return (
            <View
              key={i}
              style={{
                width: isLarge ? SCREEN_WIDTH / 3 * 2 : SCREEN_WIDTH / 3,
                height: isLarge ? SCREEN_WIDTH / 3 * 2 : SCREEN_WIDTH / 3,
                padding: 0.5,
              }}
            >
              <Skeleton variant="grid" width="100%" height="100%" />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export const NotificationsSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={{ marginBottom: 8 }}>
        <Skeleton variant="notification" />
      </View>
    ))}
  </View>
);

export const ProfileSkeleton: React.FC = () => (
  <View style={{ padding: 16 }}>
    <View style={{ alignItems: 'center', marginBottom: 20 }}>
      <Skeleton variant="avatar" width={80} height={80} />
      <View style={{ marginTop: 10, alignItems: 'center' }}>
        <Skeleton variant="text" width={120} height={16} style={{ marginBottom: 6 }} />
        <Skeleton variant="text" width={80} height={12} />
      </View>
    </View>
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
      {[0, 1, 2].map((i) => <Skeleton key={i} variant="rect" width={SCREEN_WIDTH / 3 - 8} height={36} borderRadius={8} />)}
    </View>
    <FeedSkeleton count={2} />
  </View>
);

const styles = StyleSheet.create({
  avatar: { width: 40, height: 40, borderRadius: 20 },
  text: { height: 12, borderRadius: 4 },
  rect: { borderRadius: 4 },
  postCard: { width: '100%', paddingBottom: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  postActions: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 14 },
  reelCard: { width: SCREEN_WIDTH / 2 - 4, margin: 2 },
  notificationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  notifLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
});