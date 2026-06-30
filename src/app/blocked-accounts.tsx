/**
 * Blocked Accounts Screen — /blocked-accounts
 * Shows all users the current user has blocked with Unblock functionality.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeIn,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { blockService, BlockedUser } from '@/services/block';
import { haptics } from '@/utils/haptics';
import { Fonts } from '@/constants/theme';

// ─── Blocked User Row ─────────────────────────────────────────────────────────

const BlockedUserRow = ({
  item,
  onUnblock,
  isDark,
  colors,
  delay,
}: {
  item: BlockedUser;
  onUnblock: (id: string) => void;
  isDark: boolean;
  colors: any;
  delay: number;
}) => {
  const [loading, setLoading] = useState(false);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleUnblock = () => {
    haptics.medium();
    Alert.alert(
      `Unblock @${item.username}?`,
      'They will be able to see your posts and find your profile again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            scale.value = withSpring(0.95, { damping: 10 }, () => {
              scale.value = withSpring(1);
            });
            await onUnblock(item.id);
            setLoading(false);
          },
        },
      ],
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(delay).springify()}
      layout={Layout.springify()}
      style={animStyle}
    >
      <View style={[styles.row, { borderBottomColor: isDark ? '#262626' : '#EEEEEE' }]}>
        <Image
          source={{ uri: item.avatarUrl || 'https://ui-avatars.com/api/?name=U&size=80' }}
          style={styles.avatar}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={200}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: colors.text, fontFamily: Fonts.semiBold }]}>
            {item.username}
          </Text>
          {item.displayName ? (
            <Text style={[styles.displayName, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
              {item.displayName}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={handleUnblock}
          disabled={loading}
          style={[styles.unblockBtn, { borderColor: isDark ? '#262626' : '#DBDBDB' }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={[styles.unblockText, { color: colors.text, fontFamily: Fonts.semiBold }]}>
              Unblock
            </Text>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BlockedAccountsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blockService.getBlockedUsers();
      if (res.success) setBlocked(res.data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const handleUnblock = async (id: string) => {
    try {
      await blockService.unblockUser(id);
      setBlocked((prev) => prev.filter((u) => u.id !== id));
      showToast({ message: 'User unblocked successfully', type: 'success' });
    } catch {}
  };

  const handleAddBlock = () => {
    haptics.light();
    showToast({ message: 'Select a user to block', type: 'info' });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: divColor }]}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Blocked accounts
          </Text>
          <Pressable onPress={handleAddBlock} style={styles.headerBtn} hitSlop={10}>
            <Ionicons name="add" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </View>
      </SafeAreaView>

      {loading ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.centered}>
          <ActivityIndicator size="large" color="#0095F6" />
        </Animated.View>
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 40 }]}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.duration(250)}>
              {/* Suggestion Row */}
              <Pressable
                onPress={() => {
                  haptics.light();
                  router.push('/blocked-suggestions' as any);
                }}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
                ]}
              >
                <View style={styles.suggestionInfo}>
                  <Text style={[styles.suggestionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    You may want to block
                  </Text>
                  <Text style={[styles.suggestionDesc, { color: isDark ? '#737373' : '#8E8E8F' }]}>
                    Based on your Account Center
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
              </Pressable>

              <View style={[styles.blockSeparator, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }]} />

              {blocked.length > 0 ? (
                <Text style={[styles.listNote, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                  {blocked.length} blocked {blocked.length === 1 ? 'account' : 'accounts'}
                </Text>
              ) : (
                <View style={styles.emptyContainer}>
                  <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }]}>
                    <Ionicons name="person-remove-outline" size={44} color={isDark ? '#555555' : '#BDBDBD'} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                    No blocked accounts
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                    People you block won't be able to find your profile or see your posts.
                  </Text>
                </View>
              )}
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <BlockedUserRow
              item={item}
              onUnblock={handleUnblock}
              isDark={isDark}
              colors={colors}
              delay={index * 50}
            />
          )}
          style={styles.flatList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 6, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 0,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  flatList: { flex: 1 },
  list: { paddingTop: 0 },
  listNote: {
    fontSize: 13.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  suggestionInfo: {
    flex: 1,
    paddingRight: 16,
  },
  suggestionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginBottom: 4,
  },
  suggestionDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
  },
  blockSeparator: {
    height: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  userInfo: { flex: 1, gap: 2 },
  username: { fontSize: 14 },
  displayName: { fontSize: 12 },
  unblockBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockText: { fontSize: 13 },
});
