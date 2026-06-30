import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

interface MutedAccount {
  id: string;
  username: string;
  avatarUrl: string;
  muteStatus: string;
}

const initialMutedAccounts: MutedAccount[] = [
  {
    id: '1',
    username: 'ABCD',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
    muteStatus: 'Stories muted',
  },
  {
    id: '2',
    username: 'XYZ',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
    muteStatus: 'Stories muted',
  },
];

export default function MutedAccountsControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mutedList, setMutedList] = useState<MutedAccount[]>(initialMutedAccounts);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleUnmute = (account: MutedAccount) => {
    haptics.medium();
    setMutedList((prev) => prev.filter((item) => item.id !== account.id));
    showToast({
      message: `@${account.username} has been unmuted`,
      type: 'success',
    });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const btnBg = isDark ? '#262626' : '#EFEFEF';
  const btnPressedBg = isDark ? '#3E3E3E' : '#DFDFDF';

  const renderItem = ({ item, index }: { item: MutedAccount; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(250)}
      exiting={FadeOut.duration(200)}
      style={styles.row}
    >
      <View style={styles.rowLeft}>
        {/* Avatar */}
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        
        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.usernameText, { color: labelColor }]}>{item.username}</Text>
          <Text style={[styles.statusText, { color: descColor }]}>{item.muteStatus}</Text>
        </View>
      </View>

      {/* Unmute Button */}
      <Pressable
        onPress={() => handleUnmute(item)}
        style={({ pressed }) => [
          styles.unmuteBtn,
          { backgroundColor: pressed ? btnPressedBg : btnBg },
        ]}
      >
        <Text style={[styles.unmuteBtnText, { color: labelColor }]}>Unmute</Text>
      </Pressable>
    </Animated.View>
  );

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
          <Ionicons name="arrow-back" size={26} color={labelColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: labelColor }]}>
          Muted accounts
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* List */}
      <FlatList
        data={mutedList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.duration(300)} style={styles.emptyContainer}>
            <View style={[styles.bellCircle, { borderColor: labelColor }]}>
              <Feather name="bell-off" size={32} color={labelColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: labelColor }]}>No muted accounts</Text>
            <Text style={[styles.emptyDesc, { color: descColor }]}>
              Accounts you mute will show up here.
            </Text>
          </Animated.View>
        }
      />
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
    fontSize: 19.5,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 0,
  },
  listContainer: {
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  usernameText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    marginBottom: 2,
  },
  statusText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
  },
  unmuteBtn: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unmuteBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 180,
  },
  bellCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
  },
});
