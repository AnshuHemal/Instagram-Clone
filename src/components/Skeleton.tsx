import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = 4,
  style,
}) => {
  const { isDark } = useTheme();
  const translateX = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 200,
        duration: 1200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const baseColor = isDark ? '#1C1C1E' : '#F0F0F0';
  const shineColor = isDark ? '#2C2C2E' : '#E5E5E5';

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX }] },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'transparent',
            'transparent',
            shineColor,
            'transparent',
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
    overflow: 'hidden',
  },
});

// ─── Feed Skeleton ────────────────────────────────────────────────────────────

export const FeedSkeleton = ({ showStories = true }: { showStories?: boolean }) => {
  const { isDark } = useTheme();

  return (
    <View style={[stylesFeed.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
      {/* Stories row skeleton */}
      {showStories && (
        <View style={stylesFeed.storiesRow}>
          {[...Array(7)].map((_, i) => (
            <View key={i} style={stylesFeed.storyItem}>
              <Skeleton width={66} height={66} borderRadius={33} />
              <Skeleton width={40} height={10} borderRadius={5} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      )}

      {/* Post skeleton 1 */}
      <PostSkeleton />

      {/* Post skeleton 2 */}
      <PostSkeleton />
    </View>
  );
};

const PostSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <View style={[stylesFeed.postCard, { borderBottomColor: isDark ? '#262626' : '#EFEFEF' }]}>
      {/* Header */}
      <View style={stylesFeed.postHeader}>
        <View style={stylesFeed.postHeaderLeft}>
          <Skeleton width={34} height={34} borderRadius={17} />
          <View style={stylesFeed.postHeaderText}>
            <Skeleton width={90} height={12} borderRadius={6} />
            <Skeleton width={60} height={10} borderRadius={5} style={{ marginTop: 4 }} />
          </View>
        </View>
        <Skeleton width={20} height={20} borderRadius={10} />
      </View>

      {/* Image */}
      <Skeleton width="100%" height={400} borderRadius={0} />

      {/* Actions */}
      <View style={stylesFeed.postActions}>
        <View style={stylesFeed.postActionsLeft}>
          <Skeleton width={26} height={26} borderRadius={13} />
          <Skeleton width={26} height={26} borderRadius={13} />
          <Skeleton width={26} height={26} borderRadius={13} />
        </View>
        <Skeleton width={26} height={26} borderRadius={13} />
      </View>

      {/* Likes */}
      <Skeleton width={80} height={12} borderRadius={6} style={{ marginHorizontal: 14, marginBottom: 6 }} />

      {/* Caption */}
      <View style={stylesFeed.postCaption}>
        <Skeleton width={70} height={12} borderRadius={6} />
        <Skeleton width="85%" height={12} borderRadius={6} style={{ marginTop: 4 }} />
        <Skeleton width="60%" height={12} borderRadius={6} style={{ marginTop: 4 }} />
      </View>

      {/* Comments */}
      <Skeleton width={100} height={11} borderRadius={5} style={{ marginHorizontal: 14, marginTop: 6 }} />
      <Skeleton width={60} height={10} borderRadius={5} style={{ marginHorizontal: 14, marginTop: 4, marginBottom: 12 }} />
    </View>
  );
};

const stylesFeed = StyleSheet.create({
  container: {
    flex: 1,
  },
  storiesRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 15,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  postCard: {
    borderBottomWidth: 0.5,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postHeaderText: {
    gap: 2,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  postActionsLeft: {
    flexDirection: 'row',
    gap: 14,
  },
  postCaption: {
    paddingHorizontal: 14,
    marginTop: 8,
  },
});

// ─── Profile Skeleton ─────────────────────────────────────────────────────────

export const ProfileSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <View style={[stylesProfile.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
      {/* Header */}
      <View style={stylesProfile.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={120} height={18} borderRadius={9} />
        <View style={stylesProfile.headerRight}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>
      </View>

      {/* Profile Info */}
      <View style={stylesProfile.profileInfo}>
        <Skeleton width={86} height={86} borderRadius={43} />
        <View style={stylesProfile.statsRow}>
          <View style={stylesProfile.statBox}>
            <Skeleton width={36} height={18} borderRadius={9} />
            <Skeleton width={40} height={12} borderRadius={6} style={{ marginTop: 4 }} />
          </View>
          <View style={stylesProfile.statBox}>
            <Skeleton width={36} height={18} borderRadius={9} />
            <Skeleton width={50} height={12} borderRadius={6} style={{ marginTop: 4 }} />
          </View>
          <View style={stylesProfile.statBox}>
            <Skeleton width={36} height={18} borderRadius={9} />
            <Skeleton width={50} height={12} borderRadius={6} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>

      {/* Bio */}
      <View style={stylesProfile.bioBlock}>
        <Skeleton width={100} height={14} borderRadius={7} />
        <Skeleton width="90%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
        <Skeleton width="70%" height={12} borderRadius={6} style={{ marginTop: 4 }} />
      </View>

      {/* Action Buttons */}
      <View style={stylesProfile.actionRow}>
        <Skeleton width="45%" height={34} borderRadius={10} />
        <Skeleton width="45%" height={34} borderRadius={10} />
        <Skeleton width={36} height={34} borderRadius={10} />
      </View>

      {/* Tabs */}
      <View style={stylesProfile.tabsRow}>
        <Skeleton width={30} height={22} borderRadius={4} />
        <Skeleton width={30} height={22} borderRadius={4} />
        <Skeleton width={30} height={22} borderRadius={4} />
      </View>

      {/* Grid */}
      <View style={stylesProfile.grid}>
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} width={GRID_SIZE} height={GRID_SIZE} borderRadius={0} />
        ))}
      </View>
    </View>
  );
};

const GRID_SIZE = (require('react-native').Dimensions.get('window').width) / 3;

const stylesProfile = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 20,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  statBox: {
    alignItems: 'center',
  },
  bioBlock: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    height: 44,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

// ─── Explore Skeleton ─────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = require('react-native').Dimensions;
const GRID_ITEM_SIZE = SCREEN_WIDTH / 3;

export const ExploreSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <View style={[stylesExplore.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
      {/* Search bar skeleton */}
      <View style={stylesExplore.searchRow}>
        <Skeleton width="100%" height={36} borderRadius={10} />
      </View>

      {/* Grid skeleton */}
      <View style={stylesExplore.grid}>
        {[...Array(12)].map((_, i) => {
          const modulo = i % 10;
          const isLarge = modulo === 2 || modulo === 7;
          return (
            <Skeleton
              key={i}
              width={isLarge ? GRID_ITEM_SIZE * 2 : GRID_ITEM_SIZE}
              height={isLarge ? GRID_ITEM_SIZE * 2 : GRID_ITEM_SIZE}
              borderRadius={0}
            />
          );
        })}
      </View>
    </View>
  );
};

const stylesExplore = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
