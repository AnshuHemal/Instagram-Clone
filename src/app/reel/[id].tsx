/**
 * Reel Permalink Screen — /reel/[id]
 * Used for deep links from push notifications (LIKE_REEL, COMMENT_REEL).
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';
import { ReelItem } from '@/components/ReelItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReelPermalinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [reel, setReel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get(`/reels/${id}`);
        const data = res.data?.data ?? res.data;
        setReel({
          id: data.id,
          username: data.user?.username ?? '',
          avatar: data.user?.avatarUrl ?? '',
          imageUrl: data.thumbnailUrl ?? '',
          description: data.caption ?? '',
          likesCount: Number(data.likesCount ?? 0),
          commentsCount: Number(data.commentsCount ?? 0),
          isLiked: !!data.isLiked,
          musicName: data.audioName ?? 'Original Audio',
          views: Number(data.viewsCount ?? 0).toLocaleString(),
          hlsUrl: data.hlsUrl ?? undefined,
          durationSeconds: data.durationSeconds ? Number(data.durationSeconds) : undefined,
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleLike = async (reelId: string) => {
    setReel((prev: any) => prev ? {
      ...prev,
      isLiked: !prev.isLiked,
      likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
    } : prev);
    try { await api.post(`/reels/${reelId}/like`); } catch {}
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={12}
      >
        <Ionicons name="arrow-back" size={22} color="#FFF" />
      </Pressable>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : error || !reel ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={[styles.errorText, { color: '#FFF' }]}>Reel not found</Text>
          <Pressable onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Go Back</Text>
          </Pressable>
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={styles.reelWrapper}>
          <ReelItem
            reel={reel}
            isActive={true}
            isScreenFocused={true}
            onLikeToggle={handleLike}
            height={SCREEN_HEIGHT}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelWrapper: { flex: 1 },
  errorText: { fontFamily: Fonts.semiBold, fontSize: 16 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: '#0095F6' },
  retryText: { color: '#FFF', fontFamily: Fonts.semiBold, fontSize: 14 },
});
