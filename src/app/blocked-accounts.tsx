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
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
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
      <View style={[styles.row, { borderBottomColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
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
          style={[styles.unblockBtn, { borderColor: isDark ? '#3A3A3C' : '#DBDBDB' }]}
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

  useEffect(() => { fetchBlocked(); }, [fetchBlocked]);

  const handleUnblock = async (id: string) => {
    try {
      await blockService.unblockUser(id);
      setBlocked(prev => prev.filter(u => u.id !== id));
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}>
        <View style={[styles.header, { borderBottomColor: isDark ? '#2C2C2E' : '#F0F0F0' }]}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Blocked Accounts</ThemedText>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.centered}>
          <ActivityIndicator size="large" color="#0095F6" />
        </Animated.View>
      ) : blocked.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
            <Ionicons name="person-remove-outline" size={44} color={isDark ? '#555' : '#BDBDBD'} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>
            No blocked accounts
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            People you block won't be able to find your profile or see your posts.
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 40 }]}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.duration(250)}>
              <Text style={[styles.listNote, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
                {blocked.length} blocked {blocked.length === 1 ? 'account' : 'accounts'}
              </Text>
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
          ItemSeparatorComponent={() => null}
          style={[styles.flatList, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 8, width: 40 },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  flatList: { flex: 1, marginTop: 16, borderRadius: 18, marginHorizontal: 16 },
  list: { paddingTop: 8 },
  listNote: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
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
