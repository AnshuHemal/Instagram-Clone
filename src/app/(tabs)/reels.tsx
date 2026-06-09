import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, RefreshControl, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useReels } from '@/contexts/ReelsContext';
import { ReelItem } from '@/components/ReelItem';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

export default function ReelsScreen() {
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

  // Prefetch or refresh the reels list if not loaded yet
  useEffect(() => {
    if (reels.length === 0) {
      fetchReels(null, true);
    }
  }, []);

  const handleRefresh = () => {
    fetchReels(null, true);
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
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>No reels found</ThemedText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {isFocused && <StatusBar style="light" />}
      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReelItem
            reel={item}
            isActive={item.id === activeId}
            isScreenFocused={isFocused}
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF']}
          />
        }
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
  emptyText: {
    color: '#A8A8A8',
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
});
