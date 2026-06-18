import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
  Text,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useReels } from '@/contexts/ReelsContext';
import { ReelItem } from '@/components/ReelItem';
import { Fonts } from '@/constants/theme';
import { useSharedValue } from 'react-native-reanimated';
import { GradientPullRefresh } from '@/components/GradientPullRefresh';


export default function ReelsScreen({ isTabActive = true }: { isTabActive?: boolean }) {
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
        <View style={styles.reelsHeader} pointerEvents="box-none">
          <Text style={styles.reelsTitle}>Reels</Text>
          <Pressable style={styles.cameraButton} hitSlop={12}>
            <Ionicons name="camera-outline" size={26} color="#FFFFFF" />
          </Pressable>
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
    fontFamily: Fonts.bold,
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
    // Subtle gradient fade so text is readable over the reel
    backgroundColor: 'transparent',
  },
  reelsTitle: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 22,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cameraButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
