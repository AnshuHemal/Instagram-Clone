import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
  Text,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useReels } from '@/contexts/ReelsContext';
import { ReelItem } from '@/components/ReelItem';
import { Fonts } from '@/constants/theme';
import { useSharedValue } from 'react-native-reanimated';
import { GradientPullRefresh } from '@/components/GradientPullRefresh';


export default function ReelsScreen({ isTabActive = true }: { isTabActive?: boolean }) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    reels,
    isLoading,
    isRefreshing,
    hasMore,
    cursor,
    activeId,
    setActiveId,
    prewarmedPlayer,
    players,
    fetchReels,
    handleLikeToggle,
  } = useReels();

  const [isFocused, setIsFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );
  
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabHeight = Platform.OS === 'ios'
    ? 50 + insets.bottom
    : 60 + (insets.bottom > 0 ? insets.bottom - 5 : 8);
  const flatListRef = useRef<FlatList>(null);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveId(viewableItems[0].item.id);
    }
  }).current;

  const scrollY = useSharedValue(0);

  // Prefetch or refresh the reels list if not loaded yet
  useEffect(() => {
    if (reels.length === 0) {
      fetchReels(null, true);
    }
  }, []);

  const handleRefresh = async () => {
    await fetchReels(null, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading && cursor) {
      fetchReels(cursor, false);
    }
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading || isRefreshing) return null;
    return (
      <View style={[styles.emptyContainer, { height: windowHeight }]}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="film-outline" size={40} color="rgba(255,255,255,0.5)" />
        </View>
        <Text style={styles.emptyTitle}>No Reels Yet</Text>
        <Text style={styles.emptySubtitle}>
          Reels from people you follow will appear here.
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <GradientPullRefresh
        scrollY={scrollY}
        onRefresh={async () => {
          await fetchReels(null, true);
        }}
      >
        <FlatList
          ref={flatListRef}
          data={reels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReelItem
              reel={item}
              isActive={item.id === activeId}
              isScreenFocused={isFocused && isTabActive}
              onLikeToggle={handleLikeToggle}
              height={windowHeight}
              preloadedPlayer={players[item.id] || null}
              bottomOffset={tabHeight}
            />
          )}
          pagingEnabled={true}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          style={styles.list}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: windowHeight,
            offset: windowHeight * index,
            index,
          })}
        />
      </GradientPullRefresh>

      {/* ── Floating Reels Header (Instagram-style) ── */}
      {reels.length > 0 && (
        <View style={[styles.reelsHeader, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
          <View style={styles.headerLeftSpace}>
            <Pressable onPress={() => router.push('/create')} style={styles.addButton} hitSlop={8}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </Pressable>
          </View>
          
          <View style={styles.headerTabsContainer}>
            <Pressable onPress={() => {}} style={styles.headerTabButton}>
              <Text style={styles.reelsTitleActive}>Reels</Text>
            </Pressable>
            
            <Pressable onPress={() => {}} style={styles.friendsTabWrapper}>
              <Text style={styles.reelsTitleInactive}>Friends</Text>
              {/* Overlapping Friend Facepile */}
              <View style={styles.facepileContainer}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }} style={[styles.facepileAvatar, { zIndex: 3 }]} />
                <Image source={{ uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100' }} style={[styles.facepileAvatar, { zIndex: 2, marginLeft: -8 }]} />
                <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }} style={[styles.facepileAvatar, { zIndex: 1, marginLeft: -8 }]} />
              </View>
            </Pressable>
          </View>

          <View style={styles.headerRightSpace} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  footerLoader: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  emptyContainer: {
    flex: 1,
    height: 500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#A8A8A8',
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#A8A8A8',
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  // ── Floating Reels header ──
  reelsHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,   // Below status bar
    paddingBottom: 14,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  headerLeftSpace: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerRightSpace: {
    width: 48,
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flex: 1,
  },
  headerTabButton: {
    paddingVertical: 4,
  },
  friendsTabWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  reelsTitleActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reelsTitleInactive: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  facepileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  facepileAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
});
