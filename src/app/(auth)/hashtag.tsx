import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Image, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Post, usePosts } from '@/contexts/PostsContext';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

export default function HashtagScreen() {
  const router = useRouter();
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const { colors, isDark } = useTheme();
  const { handleLikeToggle } = usePosts();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hashtagInfo, setHashtagInfo] = useState<{ tag: string; postCount: number } | null>(null);

  useEffect(() => {
    if (tag) loadHashtag();
  }, [tag]);

  const loadHashtag = async (isRef = false) => {
    if (isRef) setRefreshing(true);
    else setLoading(true);
    try {
      const [feedRes, searchRes] = await Promise.all([
        api.get(`/hashtags/${encodeURIComponent(tag || '')}`, { params: { limit: 30 } }),
        api.get('/hashtags/search', { params: { q: tag } }),
      ]);
      setItems(feedRes.data.data || []);

      const found = (searchRes.data.data || []).find((h: any) => h.tag === tag?.toLowerCase());
      if (found) setHashtagInfo(found);
      else setHashtagInfo({ tag: tag || '', postCount: feedRes.data.data?.length || 0 });
    } catch (err) {
      console.error('Failed to load hashtag:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getGridSize = (index: number) => {
    const modulo = index % 10;
    return (modulo === 2 || modulo === 7) ? 'large' : 'small';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHashtag(true)} tintColor={colors.text} />}
      >
        {/* Hashtag Info Header */}
        <Animated.View entering={FadeInDown.duration(250)} style={styles.hashtagHeader}>
          <View style={[styles.hashtagIcon, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }]}>
            <Ionicons name="pricetag" size={28} color={colors.text} />
          </View>
          <ThemedText style={[styles.hashtagTitle, { color: colors.text }]}>#{tag}</ThemedText>
          <ThemedText style={[styles.hashtagCount, { color: colors.textSecondary }]}>
            {hashtagInfo?.postCount ?? 0} posts
          </ThemedText>
        </Animated.View>

        {/* Content Grid */}
        {loading && items.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : items.length > 0 ? (
          <View style={styles.gridContainer}>
            {items.map((item: any, index: number) => {
              const size = getGridSize(index);
              const mediaUrl = item.thumbnailUrl || item.media?.[0]?.mediaUrl || '';
              const cardStyle = size === 'large'
                ? { width: COLUMN_WIDTH * 2, height: COLUMN_WIDTH * 2 }
                : { width: COLUMN_WIDTH, height: COLUMN_WIDTH };
              const isVideo = !!item.hlsUrl || item.media?.[0]?.mediaType === 'VIDEO';

              return mediaUrl ? (
                <Pressable key={item.id || index} style={[styles.gridCard, cardStyle]}>
                  <Image source={{ uri: mediaUrl }} style={styles.gridImage} />
                  {isVideo && (
                    <View style={styles.videoIndicator}>
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={styles.gridBottomOverlay}>
                    <View style={styles.gridStats}>
                      <Ionicons name="heart" size={10} color="#FFFFFF" />
                      <ThemedText style={styles.gridStatText}>
                        {Number(item.likesCount || 0).toLocaleString()}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              ) : null;
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={48} color={colors.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              No posts found for #{tag}
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Be the first to add this hashtag to a post!
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  
  // Hashtag Header
  hashtagHeader: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  hashtagIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  hashtagTitle: { fontSize: 24, fontFamily: Fonts.semiBold },
  hashtagCount: { fontSize: 14, fontFamily: Fonts.regular },

  // Grid
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  gridCard: { padding: 0.5, position: 'relative' },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  videoIndicator: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 4,
  },
  gridBottomOverlay: {
    position: 'absolute', bottom: 6, left: 6, right: 6,
  },
  gridStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gridStatText: { color: '#FFFFFF', fontSize: 11, fontFamily: Fonts.semiBold },

  // States
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  emptyContainer: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: Fonts.medium },
  emptySubtext: { fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center', paddingHorizontal: 40 },
});