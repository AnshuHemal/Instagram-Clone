import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Text,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TILE_WIDTH = 118;
const TILE_HEIGHT = 200;

export interface TrendingReel {
  id: string;
  caption?: string;
  thumbnailUrl?: string;
  feedThumbnail?: string;
  viewsCount: string;
  likesCount: string;
  author?: {
    id: string;
    username: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
}

interface TrendingReelTileProps {
  reel: TrendingReel;
  index: number;
  onPress: () => void;
}

const TrendingReelTile: React.FC<TrendingReelTileProps> = ({ reel, index, onPress }) => {
  const formattedViews = formatCount(parseInt(reel.viewsCount || '0', 10));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 60).duration(320).springify()}
      style={styles.tile}
    >
      <Pressable
        onPress={() => { haptics.light(); onPress(); }}
        android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        style={styles.tileInner}
      >
        {/* Thumbnail */}
        <Image
          source={{ uri: reel.feedThumbnail || reel.thumbnailUrl || '' }}
          style={styles.thumbnail}
          contentFit="cover"
        />

        {/* Gradient overlay — top fade for play icon */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
          style={styles.gradient}
          start={{ x: 0.5, y: 0.2 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Play icon badge */}
        <View style={styles.playBadge}>
          <Ionicons name="play" size={9} color="#FFFFFF" />
        </View>

        {/* Views count */}
        <View style={styles.viewsRow}>
          <Ionicons name="play" size={11} color="rgba(255,255,255,0.9)" />
          <Text style={styles.viewsText}>{formattedViews}</Text>
        </View>

        {/* Creator avatar */}
        {reel.author && (
          <View style={styles.creatorRow}>
            <Image
              source={{ uri: reel.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(reel.author.username)}&size=40&bold=true` }}
              style={styles.creatorAvatar}
              contentFit="cover"
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface TrendingReelsCarouselProps {
  reels: TrendingReel[];
  onSeeAll: () => void;
}

export const TrendingReelsCarousel: React.FC<TrendingReelsCarouselProps> = React.memo(({
  reels,
  onSeeAll,
}) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  if (!reels || reels.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(420).springify()}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>
            Trending Reels
          </Text>
        </View>
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={[styles.seeAllText, { fontFamily: Fonts.semiBold }]}>See all</Text>
        </Pressable>
      </View>

      {/* Tiles Carousel */}
      <FlatList
        horizontal
        data={reels}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <TrendingReelTile
            reel={item}
            index={index}
            onPress={() => router.push('/(tabs)/reels')}
          />
        )}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fireEmoji: {
    fontSize: 17,
  },
  headerTitle: {
    fontSize: 15,
  },
  seeAllText: {
    fontSize: 13,
    color: '#0095F6',
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tile: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tileInner: {
    flex: 1,
  },
  thumbnail: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    backgroundColor: '#1A1A1A',
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  playBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    padding: 4,
  },
  viewsRow: {
    position: 'absolute',
    bottom: 8,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  creatorRow: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  creatorAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#333',
  },
});
