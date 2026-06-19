/**
 * Hashtag Page — /hashtag/[tag]
 * Shows posts (and reels) for a specific hashtag in a 3-column grid.
 * Trending badge, post count, modern gradient header.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ErrorState } from '@/components/ErrorState';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_WIDTH - 3) / 3;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<any>);

interface HashtagInfo {
  id: string;
  tag: string;
  postCount: number;
}

interface HashtagPost {
  id: string;
  media: { mediaUrl: string; mediaType: string }[];
  likesCount: number;
  commentsCount: number;
}

export default function HashtagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [reels, setReels] = useState<any[]>([]);
  const [reelsLoading, setReelsLoading] = useState(false);

  const [hashtagInfo, setHashtagInfo] = useState<HashtagInfo | null>(null);
  const [posts, setPosts] = useState<HashtagPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });

  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [0, 1], Extrapolation.CLAMP),
  }));

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await api.get(`/hashtags/${encodeURIComponent(tag!)}`, { params: { limit: 30 } });
      const data = res.data;
      setHashtagInfo({ id: tag!, tag: tag!, postCount: data.meta?.postCount ?? 0 });
      setPosts(data.data ?? []);
      setCursor(data.meta?.nextCursor ?? null);
      setHasMore(data.meta?.hasMore ?? false);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [tag]);

  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await api.get(`/hashtags/${encodeURIComponent(tag!)}`, { params: { limit: 30, cursor } });
      const data = res.data;
      setPosts(prev => [...prev, ...(data.data ?? [])]);
      setCursor(data.meta?.nextCursor ?? null);
      setHasMore(data.meta?.hasMore ?? false);
    } catch {} finally {
      setLoadingMore(false);
    }
  };

  const loadReels = useCallback(async () => {
    if (activeTab !== 'reels') return;
    setReelsLoading(true);
    try {
      const res = await api.get('/reels', { params: { hashtag: tag, limit: 30 } });
      setReels(res.data?.data?.reels || res.data?.data || []);
    } catch {} finally {
      setReelsLoading(false);
    }
  }, [tag, activeTab]);

  useEffect(() => {
    if (activeTab === 'reels') loadReels();
  }, [activeTab, loadReels]);

  const renderItem = ({ item, index }: { item: HashtagPost; index: number }) => {
    const thumb = item.media?.[0]?.mediaUrl;
    const isVideo = item.media?.[0]?.mediaType === 'VIDEO';
    const isMulti = item.media?.length > 1;

    return (
      <Animated.View entering={FadeIn.duration(200).delay(index * 20)}>
        <Pressable
          onPress={() => {
            haptics.light();
            router.push(`/post/${item.id}` as any);
          }}
          style={styles.cell}
        >
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.cellImage} contentFit="cover" />
          ) : (
            <View style={[styles.cellImage, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]} />
          )}

          {/* Badges */}
          {isVideo && (
            <View style={styles.badge}>
              <Ionicons name="play" size={10} color="#FFF" />
            </View>
          )}
          {isMulti && !isVideo && (
            <View style={[styles.badge, styles.multiBadge]}>
              <Ionicons name="copy-outline" size={10} color="#FFF" />
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  const formattedCount = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  const hashtagHeaderComponent = (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.hashtagHeader}>
      {/* Gradient accent */}
      <LinearGradient
        colors={['#833ab4', '#fd1d1d', '#fcb045']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hashtagIcon}
      >
        <Text style={styles.hashtagIconText}>#</Text>
      </LinearGradient>

      <Text style={[styles.hashtagTitle, { color: colors.text }]}>#{tag}</Text>

      <Text style={[styles.hashtagCount, { color: colors.textSecondary }]}>
        {formattedCount(hashtagInfo?.postCount ?? posts.length)} posts
      </Text>

      {/* Trending badge */}
      {(hashtagInfo?.postCount ?? 0) > 100 && (
        <View style={styles.trendingBadge}>
          <Ionicons name="trending-up" size={12} color="#FF9500" />
          <Text style={styles.trendingLabel}>Trending</Text>
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0' }]} />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating header blur */}
      <Animated.View style={[styles.headerBlurWrap, headerBgStyle]} pointerEvents="none">
        <BlurView intensity={isDark ? 70 : 85} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Actual nav header */}
      <View style={[styles.navHeader, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.navTitle}>#{tag}</ThemedText>
        <Pressable style={styles.navBtn}>
          <Feather name="more-horizontal" size={22} color={colors.text} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : error ? (
        <ErrorState
          title={`#${tag} not found`}
          subtitle="This hashtag doesn't exist yet or couldn't be loaded."
          onRetry={load}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {/* Static hashtag header above tabs */}
          {hashtagHeaderComponent}

          {/* Posts / Reels tabs */}
          <View style={[styles.tabBar, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
            {(['posts', 'reels'] as const).map(tab => (
              <Pressable
                key={tab}
                onPress={() => { haptics.selection(); setActiveTab(tab); }}
                style={[styles.tabBtn, activeTab === tab && { borderBottomColor: colors.text, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.tabLabel, { color: activeTab === tab ? colors.text : colors.textSecondary, fontFamily: activeTab === tab ? Fonts.bold : Fonts.regular }]}>
                  {tab === 'posts' ? 'Posts' : 'Reels'}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === 'posts' ? (
            <AnimatedFlatList
              data={posts}
              keyExtractor={(item: any) => item.id}
              numColumns={3}
              renderItem={renderItem as any}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              onEndReached={loadMore}
              onEndReachedThreshold={0.4}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator size="small" color="#0095F6" style={{ paddingVertical: 20 }} />
                ) : null
              }
              ListEmptyComponent={
                <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
                  <Ionicons name="image-outline" size={48} color={isDark ? '#48484A' : '#C7C7CC'} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No posts with #{tag} yet.
                  </Text>
                </Animated.View>
              }
              columnWrapperStyle={styles.row}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            />
          ) : reelsLoading ? (
            <View style={styles.centered}><ActivityIndicator size="large" color="#0095F6" /></View>
          ) : (
            <FlatList
              data={reels}
              numColumns={3}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingTop: 2, paddingBottom: insets.bottom + 20 }}
              columnWrapperStyle={styles.row}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeIn.duration(200).delay(index * 20)}>
                  <Pressable
                    onPress={() => { haptics.light(); router.push(`/reel/${item.id}` as any); }}
                    style={styles.cell}
                  >
                    <Image source={{ uri: item.thumbnailUrl || '' }} style={styles.cellImage} contentFit="cover" />
                    <View style={styles.badge}>
                      <Ionicons name="play" size={10} color="#FFF" />
                    </View>
                  </Pressable>
                </Animated.View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="videocam-outline" size={40} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>No reels found</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  headerBlurWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 100,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    zIndex: 10,
  },
  navBtn: { padding: 8, width: 40 },
  navTitle: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 17,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  // Hashtag header section
  hashtagHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 10,
  },
  hashtagIcon: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashtagIconText: {
    fontFamily: Fonts.bold,
    fontSize: 38,
    color: '#FFF',
  },
  hashtagTitle: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  hashtagCount: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,149,0,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  trendingLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: '#FF9500',
  },
  divider: {
    height: 1,
    width: '100%',
    marginTop: 10,
  },

  // Tabs
  tabBar: { flexDirection: 'row', height: 44, borderBottomWidth: 0.5 },
  tabBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 14 },

  // Grid
  row: { gap: 1.5 },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: 'relative',
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    padding: 3,
  },
  multiBadge: {
    top: 6,
    right: 6,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    textAlign: 'center',
  },
});
