import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';
import { api } from '@/services/api';
import { PostCard } from '@/components/PostCard';
import { favoritesStore } from '@/store/favorites-store';
import { Post } from '@/contexts/PostsContext';

export default function FeedFavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [favoritesList, setFavoritesList] = useState<string[]>(
    favoritesStore.getSelectedUserIds()
  );

  // Subscribe to favorites changes
  useEffect(() => {
    const unsubscribe = favoritesStore.subscribe(() => {
      setFavoritesList(favoritesStore.getSelectedUserIds());
    });
    return () => unsubscribe();
  }, []);

  const fetchFavoritesPosts = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Query Following Feed
      const response = await api.get('/feed/unified', {
        params: {
          limit: 30, // Get a larger set to filter client-side
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

      // Filter by favorites
      const favIds = favoritesStore.getSelectedUserIds();
      const filtered = mapped.filter(
        (post) => favIds.includes(post.userId) || favIds.includes(post.user?.id)
      );

      setPosts(filtered);
    } catch (err) {
      console.error('Failed to load favorites feed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [favoritesList]);

  useEffect(() => {
    fetchFavoritesPosts();
  }, [fetchFavoritesPosts, favoritesList]);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleManageFavorites = () => {
    haptics.light();
    router.push('/favorites-control');
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
        {/* Modern styled vector illustration representation */}
        <View style={styles.illustrationWrapper}>
          {/* Background circles/shapes */}
          <View style={[styles.illusCircle, { backgroundColor: isDark ? '#262626' : '#FAFAFA' }]} />
          
          {/* Angled Card 1 - Ticket shape */}
          <View style={[styles.illusCard1, { backgroundColor: '#FF8A00' }]}>
            <Ionicons name="card" size={24} color="#FFF" />
          </View>

          {/* Angled Card 2 - Main Post card shape */}
          <View style={[styles.illusCard2, { backgroundColor: '#FF5E97' }]}>
            <Feather name="image" size={32} color="#FFF" />
          </View>

          {/* Angled Cup/Pitcher shape */}
          <View style={[styles.illusCup, { backgroundColor: '#C837AB' }]}>
            <View style={styles.illusCupHandle} />
          </View>

          {/* Golden overlay star */}
          <View style={styles.illusStar}>
            <FontAwesome name="star" size={40} color="#FFB800" />
          </View>

          {/* Ball outline */}
          <View style={[styles.illusBall, { borderColor: isDark ? '#FFF' : '#333' }]}>
            <Ionicons name="football-outline" size={20} color={isDark ? '#FFF' : '#333'} />
          </View>
        </View>

        <ThemedText style={styles.emptyTitle}>
          Choose the accounts you can't miss out on
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#737373' }]}>
          Add accounts to your favorites to see their posts here, starting with the most recent posts.
        </ThemedText>

        <TouchableOpacity
          onPress={handleManageFavorites}
          style={styles.addFavBtn}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.addFavText}>Add favorites</ThemedText>
        </TouchableOpacity>
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
        <ThemedText style={styles.headerTitle}>Favorites</ThemedText>
        
        {/* Right side favorites list/bullets icon with stars overlay */}
        <Pressable onPress={handleManageFavorites} style={styles.rightBtn} hitSlop={15}>
          <View style={styles.listIconContainer}>
            <Feather name="list" size={24} color={colors.text} />
            <View style={[styles.listStarOverlay, { backgroundColor: colors.background }]}>
              <FontAwesome name="star" size={10} color={colors.text} />
            </View>
          </View>
        </Pressable>
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
              onRefresh={() => fetchFavoritesPosts(true)}
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
  rightBtn: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listIconContainer: {
    position: 'relative',
    padding: 2,
  },
  listStarOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    borderRadius: 6,
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 36,
    paddingBottom: 60,
  },
  illustrationWrapper: {
    width: 220,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  illusCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'absolute',
  },
  illusCard1: {
    width: 80,
    height: 48,
    borderRadius: 8,
    position: 'absolute',
    left: 20,
    top: 55,
    transform: [{ rotate: '-18deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  illusCard2: {
    width: 110,
    height: 75,
    borderRadius: 12,
    position: 'absolute',
    right: 25,
    top: 40,
    transform: [{ rotate: '8deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  illusCup: {
    width: 44,
    height: 60,
    borderRadius: 6,
    position: 'absolute',
    top: 30,
    left: 95,
    transform: [{ rotate: '5deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  illusCupHandle: {
    width: 14,
    height: 30,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#C837AB',
    position: 'absolute',
    left: -11,
    top: 15,
  },
  illusStar: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    transform: [{ scale: 1.15 }],
  },
  illusBall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 30,
    top: 25,
  },
  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addFavBtn: {
    backgroundColor: '#3797EF',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  addFavText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#FFF',
  },
});
