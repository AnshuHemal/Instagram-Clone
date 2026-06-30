import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';
import { favoritesStore } from '@/store/favorites-store';

interface UserItem {
  id: string;
  username: string;
  fullName: string;
}

const mockUsers: UserItem[] = [
  {
    id: '1',
    username: '_himanshi_dudani_',
    fullName: '_himanshi_dudani_',
  },
  {
    id: '2',
    username: 'harssh_456',
    fullName: 'Harsh',
  },
];

export default function FavoritesControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    favoritesStore.getSelectedUserIds()
  );

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleSave = () => {
    haptics.success();
    favoritesStore.setSelectedUserIds(selectedIds);
    showToast({
      message: 'Favorites updated successfully',
      type: 'success',
    });
    router.back();
  };

  const handleHowItWorks = () => {
    haptics.light();
    showToast({
      message: 'Favorites posts appear higher in your home feed.',
      type: 'info',
    });
  };

  const handleAddBtn = () => {
    haptics.light();
    showToast({ message: 'Search for accounts to add to Favorites', type: 'info' });
  };

  const handleRemoveAll = () => {
    haptics.medium();
    setSelectedIds([]);
    showToast({ message: 'Removed all suggested favorites', type: 'success' });
  };

  const toggleRemoveUser = (id: string) => {
    haptics.light();
    setSelectedIds((prev) => prev.filter((userId) => userId !== id));
  };

  const filteredUsers = mockUsers
    .filter((u) => selectedIds.includes(u.id))
    .filter(
      (u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const searchBg = isDark ? '#1C1C1E' : '#F5F5F5';
  const searchPlaceholderColor = isDark ? '#737373' : '#8E8E8F';
  const bannerBg = isDark ? '#1C1C1E' : '#F2F2F7';
  const removeBtnBg = isDark ? '#262626' : '#EFEFEF';

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
          Favorites
        </Text>
        <Pressable onPress={handleAddBtn} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="add" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
      </View>

      {/* Info Banner block */}
      <View style={[styles.infoBanner, { backgroundColor: bannerBg }]}>
        <Text style={[styles.bannerText, { color: labelColor }]}>
          Posts from your favorites are shown higher in feed. We don't send notifications when you edit your favorites.{' '}
          <Text style={styles.blueLink} onPress={handleHowItWorks}>
            How it works.
          </Text>
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: searchBg }]}>
          <Feather name="search" size={18} color={searchPlaceholderColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: labelColor }]}
            placeholder="Search"
            placeholderTextColor={searchPlaceholderColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Section Header Row */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: labelColor }]}>Favorites</Text>
        {selectedIds.length > 0 && (
          <Pressable onPress={handleRemoveAll}>
            <Text style={styles.removeAllText}>Remove all</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          selectedIds.length > 0 ? (
            <Text style={[styles.suggestedNote, { color: descColor }]}>
              To get started, you can confirm these suggested favorites based on your activity on Instagram.
            </Text>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: descColor }]}>No favorites added yet.</Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(250)}>
            <View style={styles.userRow}>
              {/* Avatar */}
              <View style={[styles.avatarWrap, { backgroundColor: isDark ? '#262626' : '#EAEAEA' }]}>
                <Feather name="user" size={20} color={isDark ? '#8E8E8F' : '#737373'} />
              </View>

              {/* Names */}
              <View style={styles.nameBlock}>
                <Text style={[styles.username, { color: labelColor }]}>{item.username}</Text>
                <Text style={[styles.fullName, { color: descColor }]}>{item.fullName}</Text>
              </View>

              {/* Remove button */}
              <Pressable
                onPress={() => toggleRemoveUser(item.id)}
                style={({ pressed }) => [
                  styles.removeBtn,
                  { backgroundColor: removeBtnBg },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.removeBtnText, { color: labelColor }]}>Remove</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      />

      {/* Footer Confirm Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable onPress={handleSave} style={styles.confirmBtn}>
          <Text style={styles.confirmBtnText}>Confirm favorites</Text>
        </Pressable>
      </View>
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
    paddingLeft: 20,
  },
  infoBanner: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  bannerText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
  },
  blueLink: {
    color: '#0095F6',
    fontFamily: Fonts.semiBold,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    paddingVertical: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16.5,
  },
  removeAllText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    color: '#0095F6',
  },
  suggestedNote: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  listContainer: {
    paddingTop: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  nameBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    marginBottom: 2,
  },
  fullName: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
  },
  removeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  confirmBtn: {
    backgroundColor: '#3897F0',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
