import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';
import { storySettingsStore } from '@/store/story-settings-store';

interface UserItem {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string; // Optional image URL
}

const mockUsers: UserItem[] = [
  {
    id: '1',
    username: '_himanshi_dudani_',
  },
  {
    id: '2',
    username: 'harssh_456',
    fullName: 'Harsh',
  },
];

export default function HideStoryFromScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    storySettingsStore.getHiddenUserIds()
  );

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleSave = () => {
    haptics.medium();
    storySettingsStore.setHiddenUserIds(selectedUserIds);
    showToast({
      message: `Updated story privacy settings`,
      type: 'success',
    });
    router.back();
  };

  const toggleSelectUser = (userId: string) => {
    haptics.light();
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const searchBg = isDark ? '#1C1C1E' : '#F5F5F5';
  const searchPlaceholderColor = isDark ? '#737373' : '#8E8E8F';

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
          Hide story from
        </Text>
        <Pressable onPress={handleSave} hitSlop={12} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>

      {/* Description block */}
      <View style={styles.introBlock}>
        <Text style={[styles.introText, { color: descColor }]}>
          Hide all photos and videos you add to your story from specific people. This also hides your live videos.
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

      {/* User list */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isSelected = selectedUserIds.includes(item.id);
          return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(250)}>
              <Pressable
                onPress={() => toggleSelectUser(item.id)}
                style={({ pressed }) => [
                  styles.userRow,
                  pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
                ]}
              >
                {/* Avatar */}
                <View style={[styles.avatarWrap, { backgroundColor: isDark ? '#262626' : '#EAEAEA' }]}>
                  {item.id === '2' ? (
                    // We render a colored circles visual for Harsh, or custom street light placeholder
                    <View style={[styles.customAvatar, { backgroundColor: '#3897F0' }]}>
                      <Feather name="image" size={18} color="#FFFFFF" />
                    </View>
                  ) : (
                    <Feather name="user" size={20} color={isDark ? '#8E8E8F' : '#737373'} />
                  )}
                </View>

                {/* Names */}
                <View style={styles.nameBlock}>
                  {item.fullName && (
                    <Text style={[styles.fullName, { color: labelColor }]}>{item.fullName}</Text>
                  )}
                  <Text style={[styles.username, { color: descColor }]}>{item.username}</Text>
                </View>

                {/* Checkbox */}
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isSelected
                        ? '#3897F0'
                        : isDark ? '#555555' : '#C7C7CC',
                      backgroundColor: isSelected ? '#3897F0' : 'transparent',
                    },
                  ]}
                >
                  {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
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
    paddingLeft: 20,
  },
  doneBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  doneBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#0095F6',
  },
  introBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  introText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
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
    overflow: 'hidden',
  },
  customAvatar: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  fullName: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    marginBottom: 2,
  },
  username: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
