import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, FlatList } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

interface FollowedAccount {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  muted: boolean;
}

export default function FromAccountsYouFollowSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'default' | 'alphabetical'>('default');

  const [accounts, setAccounts] = useState<FollowedAccount[]>([
    {
      id: '1',
      username: '_himanshi_dudani_',
      fullName: '',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      muted: false,
    },
    {
      id: '2',
      username: 'harssh_456',
      fullName: 'Harsh',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      muted: false,
    },
  ]);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleSelect = () => {
    haptics.light();
    showToast({
      message: 'Select action clicked',
      type: 'info',
    });
  };

  const toggleBell = (id: string) => {
    haptics.light();
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === id) {
          const nextMute = !acc.muted;
          showToast({
            message: nextMute
              ? `Notifications muted for ${acc.username}`
              : `Notifications enabled for ${acc.username}`,
            type: 'info',
          });
          return { ...acc, muted: nextMute };
        }
        return acc;
      })
    );
  };

  const handleSortToggle = () => {
    haptics.light();
    setSortOrder(prev => (prev === 'default' ? 'alphabetical' : 'default'));
    showToast({
      message: `Sorted by ${sortOrder === 'default' ? 'Alphabetical' : 'Default'}`,
      type: 'info',
    });
  };

  const filteredAccounts = useMemo(() => {
    let list = [...accounts];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        acc =>
          acc.username.toLowerCase().includes(query) ||
          acc.fullName.toLowerCase().includes(query)
      );
    }
    if (sortOrder === 'alphabetical') {
      list.sort((a, b) => a.username.localeCompare(b.username));
    }
    return list;
  }, [accounts, searchQuery, sortOrder]);

  const divColor = isDark ? '#262626' : '#EFEFEF';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const labelColor = isDark ? '#FFFFFF' : '#000000';

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
        <Text
          numberOfLines={1}
          style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
        >
          From accounts you ...
        </Text>
        <Pressable onPress={handleSelect} style={styles.selectBtn}>
          <Text style={styles.selectBtnText}>Select</Text>
        </Pressable>
      </View>

      {/* Search and List */}
      <View style={styles.content}>
        {/* Search Box */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#262626' : '#F2F2F7' }]}>
          <Ionicons name="search" size={18} color={isDark ? '#A8A8A8' : '#737373'} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={isDark ? '#8E8E8F' : '#8E8E8F'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: labelColor }]}
          />
        </View>

        {/* Sort Filter Row */}
        <Pressable onPress={handleSortToggle} style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: labelColor }]}>
            Sort by <Text style={{ fontFamily: Fonts.semiBold }}>{sortOrder === 'default' ? 'Default' : 'Alphabetical'}</Text>
          </Text>
          <Ionicons name="swap-vertical" size={18} color={labelColor} />
        </Pressable>

        {/* List of Accounts */}
        <FlatList
          data={filteredAccounts}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.accountItemRow}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.nameContainer}>
                <Text style={[styles.usernameText, { color: labelColor }]}>{item.username}</Text>
                {item.fullName ? (
                  <Text style={[styles.fullNameText, { color: descColor }]}>{item.fullName}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => toggleBell(item.id)} hitSlop={8} style={styles.bellBtn}>
                <Ionicons
                  name={item.muted ? 'notifications-off-outline' : 'notifications-outline'}
                  size={22}
                  color={item.muted ? '#BDBDBD' : labelColor}
                />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: descColor }]}>No accounts found</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

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
    fontSize: 20,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 10,
  },
  selectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  selectBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16.5,
    color: '#0095F6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    paddingVertical: 0,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 14,
  },
  sortLabel: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
  },
  accountItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  usernameText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  fullNameText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
  bellBtn: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyStateText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
});
