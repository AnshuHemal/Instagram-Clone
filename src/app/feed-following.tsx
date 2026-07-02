import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';
import { api } from '@/services/api';
import { PostCard } from '@/components/PostCard';
import { Post } from '@/contexts/PostsContext';

export default function FeedFollowingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFollowingPosts = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await api.get('/feed/unified', {
        params: {
          limit: 20,
          type: 'following',
        },
      });

      const { data } = response.data;
      const mapped: Post[] = data.map((item: any) => ({
        ...item,
        isLiked: !!item.isLiked,
        likesCount: item.likesCount ?? 0,
        commentsCount: item.commentsCount ?? 0,
      }));

      setPosts(mapped);
    } catch (err) {
      console.error('Failed to load following posts feed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowingPosts();
  }, [fetchFollowingPosts]);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleLikeToggle = async (postId: string) => {
    const originalPosts = [...posts];
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const nextLiked = !p.isLiked;
        return {
          ...p,
          isLiked: nextLiked,
          likesCount: nextLiked ? p.likesCount + 1 : p.likesCount - 1
        };
      }
      return p;
    }));
    try {
      await api.post(`/posts/${postId}/like`);
    } catch (err) {
      console.error(err);
      setPosts(originalPosts);
    }
  };

  const handleBookmarkToggle = (_postId: string) => {
    // Handled locally in PostCard via SavedContext
  };

  const handleAddComment = async (postId: string, text: string) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, { text });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      return response.data.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const renderItem = ({ item }: { item: Post }) => {
    return (
      <PostCard
        post={item}
        onLikeToggle={handleLikeToggle}
        onBookmarkToggle={handleBookmarkToggle}
        onAddComment={handleAddComment}
      />
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={styles.emptyContainer}
      >
        <View style={[styles.emptyIconOutline, { borderColor: isDark ? '#363638' : '#DBDBDB' }]}>
          <Ionicons name="image-outline" size={44} color={isDark ? '#8E8E93' : '#737373'} />
        </View>
        <ThemedText style={styles.emptyTitle}>
          No Posts Yet
        </ThemedText>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Premium Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={15}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Following</ThemedText>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Posts List */}
      {isLoading && posts.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={posts.length === 0 ? { flex: 1 } : { paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchFollowingPosts(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    paddingRight: 12,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    flex: 1,
  },
  headerRightPlaceholder: {
    width: 26,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIconOutline: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: Fonts.medium,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 4,
  },
});
