import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

interface SearchItem {
  id: string;
  query: string;
  timestamp: string;
}

const mockSearches: SearchItem[] = [
  { id: '1', query: 'travel_photography', timestamp: '2h' },
  { id: '2', query: 'streetwear_ideas', timestamp: '1d' },
  { id: '3', query: 'instafoodie', timestamp: '3d' },
];

export default function RecentSearchesControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchHistory, setSearchHistory] = useState<SearchItem[]>(mockSearches);
  const [newSearch, setNewSearch] = useState('');

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleAddSearch = () => {
    if (!newSearch.trim()) return;
    haptics.light();
    const item: SearchItem = {
      id: Date.now().toString(),
      query: newSearch.trim(),
      timestamp: 'Just now',
    };
    setSearchHistory((prev) => [item, ...prev]);
    setNewSearch('');
    showToast({ message: `Searched for "${item.query}"`, type: 'success' });
  };

  const handleClearAll = () => {
    haptics.medium();
    setSearchHistory([]);
    showToast({ message: 'Cleared search history', type: 'success' });
  };

  const handleRemoveItem = (id: string) => {
    haptics.light();
    setSearchHistory((prev) => prev.filter((item) => item.id !== id));
    showToast({ message: 'Removed search item', type: 'success' });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const inputBg = isDark ? '#262626' : '#EFEFEF';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 6, borderBottomColor: divColor },
        ]}
      >
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Recent searches
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Search Input Box */}
      <View style={styles.searchBarContainer}>
        <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
          <Ionicons name="search" size={18} color={descColor} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={descColor}
            style={[styles.input, { color: labelColor }]}
            value={newSearch}
            onChangeText={setNewSearch}
            onSubmitEditing={handleAddSearch}
            returnKeyType="search"
          />
          {newSearch.length > 0 && (
            <Pressable onPress={() => setNewSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={descColor} />
            </Pressable>
          )}
        </View>
      </View>

      {/* History List */}
      <FlatList
        data={searchHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          searchHistory.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: labelColor }]}>Recent</Text>
              <Pressable onPress={handleClearAll}>
                <Text style={styles.clearAllBtn}>Clear all</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).duration(200)}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.searchCircle, { backgroundColor: isDark ? '#262626' : '#F5F5F5' }]}>
                  <Ionicons name="search" size={16} color={labelColor} />
                </View>
                <View style={styles.textWrap}>
                  <Text style={[styles.queryText, { color: labelColor }]}>{item.query}</Text>
                  <Text style={[styles.timestampText, { color: descColor }]}>{item.timestamp}</Text>
                </View>
              </View>

              <Pressable onPress={() => handleRemoveItem(item.id)} hitSlop={12} style={styles.removeBtn}>
                <Ionicons name="close" size={20} color={descColor} />
              </Pressable>
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: descColor }]}>Empty search</Text>
          </View>
        }
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 0,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    paddingVertical: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  clearAllBtn: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    color: '#3897F0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  queryText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    marginBottom: 2,
  },
  timestampText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
  },
  removeBtn: {
    padding: 6,
  },
  emptyContainer: {
    paddingVertical: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
});
