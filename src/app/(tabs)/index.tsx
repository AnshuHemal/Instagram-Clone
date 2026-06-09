import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Modal, Image, Animated, Pressable, ActivityIndicator, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { FeedHeader } from '@/components/FeedHeader';
import { StoryCircle } from '@/components/StoryCircle';
import { PostCard } from '@/components/PostCard';
import { ThemedText } from '@/components/themed-text';
import { MOCK_STORIES, Story } from '@/constants/mockData';
import { Ionicons } from '@expo/vector-icons';
import { usePosts } from '@/contexts/PostsContext';
import * as SecureStore from 'expo-secure-store';
import ReAnimated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Fonts } from '@/constants/theme';

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
  const [showTutorial, setShowTutorial] = useState(false);

  // Initial load
  useEffect(() => {
    fetchPosts(null, true);

    const checkTutorial = async () => {
      try {
        const val = await SecureStore.getItemAsync('tutorialShown');
        if (!val) {
          setShowTutorial(true);
        }
      } catch (err) {
        console.error('Failed to read tutorial viewed state:', err);
      }
    };
    checkTutorial();
  }, []);

  const handleCloseTutorial = async () => {
    setShowTutorial(false);
    try {
      await SecureStore.setItemAsync('tutorialShown', 'true');
    } catch (err) {
      console.error('Failed to write tutorial viewed state:', err);
    }
  };

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

      {/* Tutorial Modal */}
      {showTutorial && (
        <Modal transparent visible={showTutorial} animationType="none" onRequestClose={handleCloseTutorial}>
          <View style={styles.tutorialOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseTutorial}>
              <ReAnimated.View 
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
              />
            </Pressable>

            <ReAnimated.View 
              entering={SlideInDown.duration(350)}
              exiting={SlideOutDown.duration(250)}
              style={[
                styles.tutorialCard,
                { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }
              ]}
            >
              <Image 
                source={require('@/assets/images/navigation_tutorial.png')} 
                style={styles.tutorialImage}
                resizeMode="contain"
              />

              <Text style={[styles.tutorialTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Swipe to easily access Reels and messages
              </Text>

              <Text style={[styles.tutorialSubtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                We\'ve simplified our navigation to help you find and enjoy your favorite parts of Instagram.
              </Text>

              <Pressable style={styles.tutorialButton} onPress={handleCloseTutorial}>
                <Text style={styles.tutorialButtonText}>Got it</Text>
              </Pressable>
            </ReAnimated.View>
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
  // Tutorial Modal styles
  tutorialOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  tutorialCard: {
    width: '100%',
    borderRadius: 36,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  tutorialImage: {
    width: '80%',
    height: 160,
    marginBottom: 20,
  },
  tutorialTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  tutorialSubtitle: {
    fontSize: 14.5,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  tutorialButton: {
    backgroundColor: '#0064E0', // standard brand blue
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 15.5,
  },
});
