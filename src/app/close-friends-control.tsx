import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';
import { closeFriendsStore } from '@/store/close-friends-store';

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

export default function CloseFriendsControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    closeFriendsStore.getSelectedUserIds()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading suggested friends list
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleSave = () => {
    haptics.success();
    closeFriendsStore.setSelectedUserIds(selectedIds);
    showToast({
      message: 'Updated Close Friends list',
      type: 'success',
    });
    router.back();
  };

  const handleHowItWorks = () => {
    haptics.light();
    showToast({
      message: 'Only people on your Close Friends list can see your close friends stories.',
      type: 'info',
    });
  };

  const toggleSelectUser = (id: string) => {
    haptics.light();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
  };

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
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
          Close Friends
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Info Block */}
      <View style={styles.infoBlock}>
        <Text style={[styles.infoText, { color: descColor }]}>
          We don't send notifications when you edit your close friends list.{' '}
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

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Suggested</Text>
          }
          renderItem={({ item, index }) => {
            const isSelected = selectedIds.includes(item.id);
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
                    <Feather name="user" size={20} color={isDark ? '#8E8E8F' : '#737373'} />
                  </View>

                  {/* Names */}
                  <View style={styles.nameBlock}>
                    <Text style={[styles.username, { color: labelColor }]}>{item.username}</Text>
                    <Text style={[styles.fullName, { color: descColor }]}>{item.fullName}</Text>
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
      )}

      {/* Done Button Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable onPress={handleSave} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Done</Text>
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
    paddingLeft: 0,
  },
  infoBlock: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: 'center',
  },
  infoText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  blueLink: {
    color: '#3897F0',
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingTop: 6,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
  doneBtn: {
    backgroundColor: '#3897F0',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
