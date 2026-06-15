import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, Image, Dimensions, RefreshControl, ActivityIndicator, Modal, FlatList, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Post, usePosts } from '@/contexts/PostsContext';
import { api } from '@/services/api';
import { PostCard } from '@/components/PostCard';
import { ExploreSkeleton } from '@/components/Skeleton';
import { useRouter } from 'expo-router';
import { followService } from '@/services/follow';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

export default function ExploreScreen() {
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const router = useRouter();
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'posts'>('accounts');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { handleLikeToggle, handleAddComment } = usePosts();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
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
    } else {
      setUserResults([]);
      setPostResults([]);
    }
  }, [debouncedSearch]);

  const handleFollowToggle = async (targetId: string) => {
    setUserResults((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, isFollowing: !u.isFollowing } : u))
    );

    try {
      const match = userResults.find((u) => u.id === targetId);
      if (match) {
        if (match.isFollowing) {
          await followService.unfollowUser(targetId);
        } else {
          await followService.followUser(targetId);
        }
      }
    } catch (err) {
      console.error('Failed to toggle follow in search results:', err);
      setUserResults((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, isFollowing: !u.isFollowing } : u))
      );
    }
  };

  const loadExplorePosts = async (isRef = false) => {
    if (isRef) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await api.get('/posts/feed', {
        params: {
          limit: 30,
        },
      });
      setPosts(response.data.data || []);
    } catch (err) {
      console.error('Failed to load explore posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExplorePosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const term = search.toLowerCase();
    const captionMatches = post.caption?.toLowerCase().includes(term);
    const usernameMatches = post.user?.username.toLowerCase().includes(term);
    const locationMatches = post.location?.toLowerCase().includes(term);
    return captionMatches || usernameMatches || locationMatches;
  });

  const getGridItemSize = (index: number): 'large' | 'small' => {
    // 0, 1 small. 2 large. 3, 4, 5, 6 small. 7 large. 8, 9 small.
    const modulo = index % 10;
    if (modulo === 2 || modulo === 7) {
      return 'large';
    }
    return 'small';
  };

  const onExploreLikeToggle = async (postId: string) => {
    await handleLikeToggle(postId);
    
    // Sync local explore state
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1
        };
      }
      return p;
    }));
    
    // Sync active modal details
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => {
        if (!prev) return null;
        const isLiked = !prev.isLiked;
        return {
          ...prev,
          isLiked,
          likesCount: isLiked ? prev.likesCount + 1 : prev.likesCount - 1
        };
      });
    }
  };

  const onExploreCommentAdd = async (postId: string, text: string) => {
    const comment = await handleAddComment(postId, text);
    
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          commentsCount: p.commentsCount + 1
        };
      }
      return p;
    }));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          commentsCount: prev.commentsCount + 1
        };
      });
    }

    return comment;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#262626' : '#EFEFEF' }]}>
          <Ionicons name="search-outline" size={18} color={isDark ? '#A8A8A8' : '#737373'} style={styles.searchIcon} />
          <TextInput
            placeholder="Search posts, users or location"
            placeholderTextColor={isDark ? '#A8A8A8' : '#737373'}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={16} color={isDark ? '#A8A8A8' : '#737373'} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Search active view or public explore feed */}
      {search.trim().length > 0 ? (
        <View style={{ flex: 1 }}>
          {/* Segment/Tabs bar */}
          <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'accounts' && [styles.activeTab, { borderBottomColor: colors.primary }]
              ]}
              onPress={() => setActiveTab('accounts')}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  { color: activeTab === 'accounts' ? colors.text : colors.textSecondary },
                  activeTab === 'accounts' && { fontWeight: 'bold' }
                ]}
              >
                Accounts
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'posts' && [styles.activeTab, { borderBottomColor: colors.primary }]
              ]}
              onPress={() => setActiveTab('posts')}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  { color: activeTab === 'posts' ? colors.text : colors.textSecondary },
                  activeTab === 'posts' && { fontWeight: 'bold' }
                ]}
              >
                Posts
              </ThemedText>
            </Pressable>
          </View>

          {/* Search Result view */}
          {searchLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : activeTab === 'accounts' ? (
            <FlatList
              data={userResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.userItem}
                  onPress={() => {
                    router.push({ pathname: '/profile', params: { userId: item.id } });
                  }}
                >
                  <Image
                    source={{ uri: item.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.userTextColumn}>
                    <View style={styles.usernameRow}>
                      <ThemedText type="smallBold" style={{ color: colors.text }}>
                        {item.username}
                      </ThemedText>
                      {item.isVerified && (
                        <Ionicons name="checkmark-circle" size={13} color="#0095F6" style={{ marginLeft: 3 }} />
                      )}
                    </View>
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>
                      {item.displayName || item.username}
                    </ThemedText>
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
                    <Text
                      style={[
                        styles.followBtnText,
                        { color: item.isFollowing ? colors.text : '#FFFFFF' },
                      ]}
                    >
                      {item.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText style={{ color: colors.textSecondary }}>No accounts found matching search.</ThemedText>
                </View>
              }
            />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.gridContainer}>
                {postResults.map((post, index) => {
                  const size = getGridItemSize(index);
                  const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null;
                  const imageUrl = firstMedia?.mediaUrl || 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400';
                  const isVideo = firstMedia?.mediaType === 'VIDEO';

                  const cardStyle = size === 'large'
                    ? [styles.largeCardContainer, { width: COLUMN_WIDTH * 2, height: COLUMN_WIDTH * 2 }]
                    : [styles.smallCardContainer, { width: COLUMN_WIDTH, height: COLUMN_WIDTH }];

                  return (
                    <Pressable
                      key={post.id}
                      onPress={() => setSelectedPost(post)}
                      style={cardStyle}
                    >
                      <Image source={{ uri: imageUrl }} style={styles.gridImage} />
                      
                      <View style={styles.indicatorsOverlay}>
                        {isVideo && (
                          <Ionicons name="play" size={14} color="#FFFFFF" style={styles.indicatorIcon} />
                        )}
                        {post.media.length > 1 && (
                          <Ionicons name="copy" size={12} color="#FFFFFF" style={styles.indicatorIcon} />
                        )}
                      </View>
                      
                      {post.caption ? (
                        <View style={styles.overlayCategory}>
                          <ThemedText type="smallBold" numberOfLines={1} style={styles.overlayText}>
                            {post.caption}
                          </ThemedText>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
              {postResults.length === 0 && (
                <View style={styles.emptyContainer}>
                  <ThemedText style={{ color: colors.textSecondary }}>No posts found matching search.</ThemedText>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      ) : (
        /* Default Explore Grid Scroll */
        loading && posts.length === 0 ? (
          <ExploreSkeleton />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadExplorePosts(true)} tintColor={colors.text} />
            }
          >
            <View style={styles.gridContainer}>
              {posts.map((post, index) => {
                const size = getGridItemSize(index);
                const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null;
                const imageUrl = firstMedia?.mediaUrl || 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400';
                const isVideo = firstMedia?.mediaType === 'VIDEO';

                const cardStyle = size === 'large'
                  ? [styles.largeCardContainer, { width: COLUMN_WIDTH * 2, height: COLUMN_WIDTH * 2 }]
                  : [styles.smallCardContainer, { width: COLUMN_WIDTH, height: COLUMN_WIDTH }];

                return (
                  <Pressable
                    key={post.id}
                    onPress={() => setSelectedPost(post)}
                    style={cardStyle}
                  >
                    <Image source={{ uri: imageUrl }} style={styles.gridImage} />
                    
                    {/* Indicators overlay */}
                    <View style={styles.indicatorsOverlay}>
                      {isVideo && (
                        <Ionicons name="play" size={14} color="#FFFFFF" style={styles.indicatorIcon} />
                      )}
                      {post.media.length > 1 && (
                        <Ionicons name="copy" size={12} color="#FFFFFF" style={styles.indicatorIcon} />
                      )}
                    </View>
                    
                    {post.caption ? (
                      <View style={styles.overlayCategory}>
                        <ThemedText type="smallBold" numberOfLines={1} style={styles.overlayText}>
                          {post.caption}
                        </ThemedText>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            {posts.length === 0 && !loading && (
              <View style={styles.emptyContainer}>
                <ThemedText style={{ color: colors.textSecondary }}>No posts available.</ThemedText>
              </View>
            )}
          </ScrollView>
        )
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <Modal visible={selectedPost !== null} animationType="slide" transparent={false} onRequestClose={() => setSelectedPost(null)}>
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setSelectedPost(null)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <ThemedText type="subtitle" style={styles.modalTitle}>Explore</ThemedText>
              <View style={{ width: 40 }} />
            </View>
            
            {/* Detail Scroll */}
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
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  smallCardContainer: {
    padding: 1,
    position: 'relative',
  },
  largeCardContainer: {
    padding: 1,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  indicatorsOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  indicatorIcon: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  overlayCategory: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 5,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  clearSearchButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    height: 44,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'transparent',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userTextColumn: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
