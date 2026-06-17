import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, Image, Dimensions, RefreshControl, ActivityIndicator, Modal, FlatList, Text, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInRight, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Post, usePosts } from '@/contexts/PostsContext';
import { api } from '@/services/api';
import { PostCard } from '@/components/PostCard';
import { ExploreSkeleton } from '@/components/Skeleton';
import { useRouter } from 'expo-router';
import { followService } from '@/services/follow';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

const SEARCH_HISTORY_KEY = 'explore_search_history';

export default function ExploreScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const router = useRouter();
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'posts'>('accounts');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { handleLikeToggle, handleAddComment } = usePosts();
  const inputRef = useRef<TextInput>(null);

  // Load search history
  useEffect(() => {
    loadSearchHistory();
    loadTrending();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const stored = await SecureStore.getItemAsync(SEARCH_HISTORY_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch {}
  };

  const saveSearchHistory = async (query: string) => {
    const updated = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(updated);
    try {
      await SecureStore.setItemAsync(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearSearchHistory = async () => {
    setSearchHistory([]);
    try {
      await SecureStore.deleteItemAsync(SEARCH_HISTORY_KEY);
    } catch {}
  };

  const loadTrending = async (isRef = false) => {
    if (isRef) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await api.get('/feed/explore', { params: { limit: 30 } });
      setTrending(response.data.data || []);
    } catch (err) {
      console.error('Failed to load trending content:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const performSearch = async (query: string) => {
    const term = query.trim();
    if (!term) {
      setUserResults([]);
      setPostResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const [usersRes, postsRes] = await Promise.all([
        api.get('/auth/users/search', { params: { q: term } }),
        api.get('/posts/search', { params: { q: term } }),
      ]);
      setUserResults(usersRes.data.data || []);
      setPostResults(postsRes.data.data || []);
    } catch (err) {
      console.error('Failed to perform search:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedSearch.trim()) {
      performSearch(debouncedSearch);
      setShowHistory(false);
    } else {
      setUserResults([]);
      setPostResults([]);
    }
  }, [debouncedSearch]);

  const handleSubmitSearch = () => {
    if (search.trim()) {
      saveSearchHistory(search.trim());
      inputRef.current?.blur();
    }
  };

  const handleHistoryTap = (query: string) => {
    setSearch(query);
    setDebouncedSearch(query);
    performSearch(query);
    setShowHistory(false);
  };

  const handleFollowToggle = async (targetId: string) => {
    const match = userResults.find((u) => u.id === targetId);
    const willFollow = match ? !match.isFollowing : true;
    
    setUserResults((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, isFollowing: willFollow } : u))
    );
    try {
      if (willFollow) {
        await followService.followUser(targetId);
        haptics.onFollow();
      } else {
        await followService.unfollowUser(targetId);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      setUserResults((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, isFollowing: !willFollow } : u))
      );
    }
  };

  const getGridItemSize = (index: number): 'large' | 'small' => {
    const modulo = index % 10;
    return (modulo === 2 || modulo === 7) ? 'large' : 'small';
  };

  const onExploreCommentAdd = async (postId: string, text: string) => {
    const comment = await handleAddComment(postId, text);
    setTrending(prev => prev.map(p => {
      if (p.id === postId) return { ...p, commentsCount: p.commentsCount + 1 };
      return p;
    }));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev: any) => {
        if (!prev) return null;
        return { ...prev, commentsCount: prev.commentsCount + 1 };
      });
    }
    return comment;
  };

  const onExploreLikeToggle = async (postId: string) => {
    await handleLikeToggle(postId);
    setTrending(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        return { ...p, isLiked, likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1 };
      }
      return p;
    }));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev: any) => {
        if (!prev) return null;
        const isLiked = !prev.isLiked;
        return { ...prev, isLiked, likesCount: isLiked ? prev.likesCount + 1 : prev.likesCount - 1 };
      });
    }
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <Animated.View entering={FadeInRight.duration(200)}>
      <Pressable
        style={styles.userItem}
        onPress={() => router.push({ pathname: '/(tabs)/profile', params: { userId: item.id } })}
      >
        <Image
          source={{ uri: item.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }}
          style={styles.userAvatar}
        />
        <View style={styles.userTextColumn}>
          <View style={styles.usernameRow}>
            <ThemedText type="smallBold" style={{ color: colors.text }}>{item.username}</ThemedText>
            {item.isVerified && <Ionicons name="checkmark-circle" size={13} color="#0095F6" style={{ marginLeft: 3 }} />}
          </View>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>{item.displayName || item.username}</ThemedText>
        </View>
        <Pressable
          onPress={() => handleFollowToggle(item.id)}
          style={[
            styles.followBtn,
            item.isFollowing
              ? { backgroundColor: 'transparent', borderWidth: 0.8, borderColor: colors.border }
              : { backgroundColor: '#0095F6' },
          ]}
        >
          <Text style={[styles.followBtnText, { color: item.isFollowing ? colors.text : '#FFFFFF' }]}>
            {item.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );

  const renderGridItem = (item: any, index: number) => {
    const size = getGridItemSize(index);
    const mediaUrl = item.thumbnailUrl || item.media?.[0]?.mediaUrl || 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400';
    const isVideo = !!item.hlsUrl || item.media?.[0]?.mediaType === 'VIDEO';
    const cardStyle = size === 'large'
      ? { width: COLUMN_WIDTH * 2, height: COLUMN_WIDTH * 2 }
      : { width: COLUMN_WIDTH, height: COLUMN_WIDTH };

    return (
      <Pressable key={item.id || index} onPress={() => setSelectedPost(item)} style={[styles.gridCard, cardStyle]}>
        <Image source={{ uri: mediaUrl }} style={styles.gridImage} />
        <View style={styles.indicatorsOverlay}>
          {isVideo && <Ionicons name="play" size={14} color="#FFFFFF" style={styles.indicatorIcon} />}
          {item.media && item.media.length > 1 && <Ionicons name="copy" size={12} color="#FFFFFF" style={styles.indicatorIcon} />}
        </View>
        <View style={styles.gridBottomOverlay}>
          <View style={styles.gridStats}>
            <Ionicons name="heart" size={10} color="#FFFFFF" />
            <Text style={styles.gridStatText}>{Number(item.likesCount || 0).toLocaleString()}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const isSearchActive = search.trim().length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#262626' : '#EFEFEF' }]}>
          <Ionicons name="search-outline" size={18} color={isDark ? '#A8A8A8' : '#737373'} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            placeholder="Search Instagram"
            placeholderTextColor={isDark ? '#A8A8A8' : '#737373'}
            value={search}
            onChangeText={(v) => { setSearch(v); setShowHistory(true); }}
            onFocus={() => setShowHistory(true)}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.text }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => { setSearch(''); setShowHistory(false); }} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={18} color={isDark ? '#A8A8A8' : '#737373'} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Search History (when focused but no query) */}
      {showHistory && !isSearchActive && searchHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <ThemedText style={[styles.historyTitle, { color: colors.text }]}>Recent</ThemedText>
            <Pressable onPress={clearSearchHistory}>
              <ThemedText style={styles.clearHistoryText}>Clear All</ThemedText>
            </Pressable>
          </View>
          {searchHistory.map((query) => (
            <Pressable key={query} onPress={() => handleHistoryTap(query)} style={styles.historyItem}>
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <ThemedText style={[styles.historyText, { color: colors.text }]} numberOfLines={1}>{query}</ThemedText>
              <Pressable onPress={() => setSearchHistory(prev => prev.filter(h => h !== query))} hitSlop={8}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}

      {/* Search Results */}
      {isSearchActive ? (
        <View style={{ flex: 1 }}>
          <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
            <Pressable
              style={[styles.tab, activeTab === 'accounts' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('accounts')}
            >
              <ThemedText style={[styles.tabText, { color: activeTab === 'accounts' ? colors.text : colors.textSecondary }]}>
                Accounts
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'posts' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('posts')}
            >
              <ThemedText style={[styles.tabText, { color: activeTab === 'posts' ? colors.text : colors.textSecondary }]}>
                Posts
              </ThemedText>
            </Pressable>
          </View>

          {searchLoading ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="small" color={colors.primary} /></View>
          ) : activeTab === 'accounts' ? (
            <FlatList
              data={userResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={renderUserItem}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="person-outline" size={40} color={colors.textSecondary} />
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No accounts found</ThemedText>
                </View>
              }
            />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.gridContainer}>
                {postResults.map((post, index) => renderGridItem(post, index))}
              </View>
              {postResults.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No posts found</ThemedText>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      ) : (
        /* Explore Grid with Trending Content */
        loading && trending.length === 0 ? (
          <ExploreSkeleton />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTrending(true)} tintColor={colors.text} />}
          >
            {/* Section Header */}
            <Animated.View entering={FadeInDown.duration(250)} style={styles.sectionHeader}>
              <View>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Trending</ThemedText>
                <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Popular content from the Instagram community
                </ThemedText>
              </View>
            </Animated.View>

            {/* Trending Grid */}
            <View style={styles.gridContainer}>
              {trending.map((item, index) => renderGridItem(item, index))}
            </View>

            {trending.length === 0 && !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="compass-outline" size={48} color={colors.textSecondary} />
                <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No trending content yet</ThemedText>
              </View>
            )}
          </ScrollView>
        )
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <Modal visible={true} animationType="slide" transparent={false} onRequestClose={() => setSelectedPost(null)}>
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setSelectedPost(null)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <ThemedText type="subtitle" style={styles.modalTitle}>Explore</ThemedText>
              <View style={{ width: 40 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <PostCard
                post={selectedPost}
                onLikeToggle={onExploreLikeToggle}
                onBookmarkToggle={() => {}}
                onAddComment={onExploreCommentAdd}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { paddingHorizontal: 15, paddingVertical: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 40, borderRadius: 12, paddingHorizontal: 14 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, padding: 0, fontFamily: Fonts.regular },
  clearSearchButton: { padding: 4 },
  scrollContent: { paddingBottom: 100 },
  
  // History
  historyContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyTitle: { fontSize: 16, fontFamily: Fonts.bold },
  clearHistoryText: { color: '#0095F6', fontSize: 14, fontFamily: Fonts.medium },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  historyText: { flex: 1, fontSize: 15, fontFamily: Fonts.regular },

  // Section
  sectionHeader: { paddingHorizontal: 15, paddingTop: 8, paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: Fonts.bold },
  sectionSubtitle: { fontSize: 13, fontFamily: Fonts.regular, marginTop: 2 },

  // Grid
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  gridCard: { padding: 0.5, position: 'relative' },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  indicatorsOverlay: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', gap: 4 },
  indicatorIcon: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 4, overflow: 'hidden' },
  gridBottomOverlay: { position: 'absolute', bottom: 6, left: 6, right: 6 },
  gridStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gridStatText: { color: '#FFFFFF', fontSize: 11, fontFamily: Fonts.bold },

  // Tabs
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 0.5, height: 44 },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 14, fontFamily: Fonts.medium },

  // Loading & Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },

  // User search results
  listContent: { paddingHorizontal: 16, paddingVertical: 8 },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  userAvatar: { width: 44, height: 44, borderRadius: 22 },
  userTextColumn: { flex: 1, justifyContent: 'center' },
  usernameRow: { flexDirection: 'row', alignItems: 'center' },
  followBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  followBtnText: { fontSize: 12, fontFamily: Fonts.bold },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 0.5 },
  backButton: { padding: 5 },
  modalTitle: { fontFamily: Fonts.bold },
});