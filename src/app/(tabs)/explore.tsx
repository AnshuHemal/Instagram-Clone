import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, Image, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

interface ExploreItem {
  id: string;
  imageUrl: string;
  size: 'small' | 'large';
  category: string;
}

const EXPLORE_ITEMS: ExploreItem[] = [
  { id: 'e1', imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400', size: 'small', category: 'nature' },
  { id: 'e2', imageUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400', size: 'small', category: 'nature' },
  { id: 'e3', imageUrl: 'https://images.unsplash.com/photo-1472214222541-d510753a8707?w=600', size: 'large', category: 'nature' }, // large
  { id: 'e4', imageUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400', size: 'small', category: 'sunset' },
  { id: 'e5', imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400', size: 'small', category: 'nature' },
  { id: 'e6', imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', size: 'small', category: 'nature' },
  { id: 'e7', imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600', size: 'large', category: 'coding' }, // large
  { id: 'e8', imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400', size: 'small', category: 'coding' },
  { id: 'e9', imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400', size: 'small', category: 'coding' },
  { id: 'e10', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400', size: 'small', category: 'music' },
  { id: 'e11', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400', size: 'small', category: 'music' },
  { id: 'e12', imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400', size: 'small', category: 'music' },
];

export default function ExploreScreen() {
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');

  const filteredItems = EXPLORE_ITEMS.filter(item => 
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Layout calculations: We render using a Flex Wrap Container to create custom sized elements
  // Standard square size: COLUMN_WIDTH x COLUMN_WIDTH
  // Large square size: (COLUMN_WIDTH * 2) x (COLUMN_WIDTH * 2)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#262626' : '#EFEFEF' }]}>
          <Ionicons name="search-outline" size={18} color={isDark ? '#A8A8A8' : '#737373'} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={isDark ? '#A8A8A8' : '#737373'}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      {/* Explore Grid Scroll */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.gridContainer}>
          {filteredItems.map((item, index) => {
            // Customize styling dynamically based on size
            if (item.size === 'large') {
              return (
                <View key={item.id} style={[styles.largeCardContainer, { width: COLUMN_WIDTH * 2, height: COLUMN_WIDTH * 2 }]}>
                  <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
                  <View style={styles.overlayCategory}>
                    <ThemedText type="smallBold" style={styles.overlayText}>#{item.category}</ThemedText>
                  </View>
                </View>
              );
            } else {
              return (
                <View key={item.id} style={[styles.smallCardContainer, { width: COLUMN_WIDTH, height: COLUMN_WIDTH }]}>
                  <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
                  <View style={styles.overlayCategory}>
                    <ThemedText type="smallBold" style={styles.overlayText}>#{item.category}</ThemedText>
                  </View>
                </View>
              );
            }
          })}
        </View>
      </ScrollView>
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
  overlayCategory: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
});
