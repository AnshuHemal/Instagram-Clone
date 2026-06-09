import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Modal, Image, Animated, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { FeedHeader } from '@/components/FeedHeader';
import { StoryCircle } from '@/components/StoryCircle';
import { PostCard } from '@/components/PostCard';
import { ThemedText } from '@/components/themed-text';
import { MOCK_STORIES, Story } from '@/constants/mockData';
import { Ionicons } from '@expo/vector-icons';
import { usePosts } from '@/contexts/PostsContext';

export default function FeedScreen() {
  const { colors, isDark } = useTheme();
  const {
    posts,
    isLoading,
    isRefreshing,
    hasMore,
    cursor,
    fetchPosts,
    handleLikeToggle,
    handleAddComment,
  } = usePosts();
  
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);

  // Initial load
  useEffect(() => {
    fetchPosts(null, true);
  }, []);

  // Story Modal State
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const storyProgress = useRef(new Animated.Value(0)).current;
  const storyTimerRef = useRef<any>(null);

  const handleRefresh = () => {
    fetchPosts(null, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading && !isRefreshing && cursor) {
      fetchPosts(cursor, false);
    }
  };

  const handleBookmarkToggle = (id: string) => {
    // Bookmarks are handled locally in individual PostCards since they are not in schema
  };

  // Story Viewer Controls
  const openStory = (story: Story) => {
    setActiveStory(story);
    // Mark story as seen
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, isSeen: true } : s))
    );

    // Reset progress
    storyProgress.setValue(0);

    // Start progress animation
    Animated.timing(storyProgress, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false,
    }).start();

    // Set timer to close story
    if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    storyTimerRef.current = setTimeout(() => {
      closeStory();
    }, 4000);
  };

  const closeStory = () => {
    setActiveStory(null);
    storyProgress.setValue(0);
    if (storyTimerRef.current) {
      clearTimeout(storyTimerRef.current);
      storyTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    };
  }, []);

  // Stories Horizontal list
  const renderStoriesHeader = () => (
    <View style={[styles.storiesContainer, { borderBottomColor: colors.border }]}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={stories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.storiesList}
        renderItem={({ item }) => (
          <StoryCircle
            username={item.username}
            avatar={item.avatar}
            isSeen={item.isSeen}
            onPress={() => openStory(item)}
          />
        )}
      />
    </View>
  );

  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <FeedHeader />
      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderStoriesHeader}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLikeToggle={handleLikeToggle}
            onBookmarkToggle={handleBookmarkToggle}
            onAddComment={handleAddComment}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.text} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.feedScroll}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyFeed}>
              <ThemedText style={{ color: colors.textSecondary }}>No posts available. Be the first to create one!</ThemedText>
            </View>
          ) : null
        }
      />

      {/* Fullscreen Story Viewer Modal */}
      {activeStory && (
        <Modal visible={activeStory !== null} transparent animationType="fade">
          <View style={styles.storyOverlay}>
            {/* Top Bar Progress */}
            <View style={styles.storyHeaderContainer}>
              <View style={[styles.storyProgressBarContainer, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
                <Animated.View
                  style={[
                    styles.storyProgressBar,
                    {
                      backgroundColor: '#FFFFFF',
                      width: storyProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>

              <View style={styles.storyUserRow}>
                <Image source={{ uri: activeStory.avatar }} style={styles.storyUserAvatar} />
                <ThemedText type="smallBold" style={styles.storyUsername}>
                  {activeStory.username}
                </ThemedText>
                <Pressable onPress={closeStory} style={styles.storyCloseButton}>
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {/* Story Image */}
            <Image source={{ uri: activeStory.imageUrl }} style={styles.storyImage} />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedScroll: {
    paddingBottom: 20,
  },
  storiesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  storiesList: {
    paddingHorizontal: 15,
  },
  footerLoader: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  emptyFeed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 30,
  },
  // Story View Modal
  storyOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: '100%',
    height: '85%',
    resizeMode: 'cover',
  },
  storyHeaderContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    zIndex: 10,
    gap: 12,
  },
  storyProgressBarContainer: {
    height: 3,
    width: '100%',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  storyProgressBar: {
    height: '100%',
  },
  storyUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  storyUsername: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  storyCloseButton: {
    marginLeft: 'auto',
    padding: 5,
  },
});
