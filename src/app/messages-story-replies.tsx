import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function MessagesStoryRepliesScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handlePressOption = (optionName: string) => {
    haptics.light();
    showToast({
      message: `"${optionName}" settings are coming soon.`,
      type: 'info',
    });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const sectionTitleColor = isDark ? '#A8A8A8' : '#737373';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const separatorBg = isDark ? '#1C1C1E' : '#F8F9FA';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

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
          Messages and story replies
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
            How people can reach you
          </Text>

          <View style={styles.sectionCard}>
            <Pressable
              onPress={() => { haptics.light(); router.push('/message-requests-settings' as any); }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
              ]}
            >
              <Text style={[styles.rowLabel, { color: labelColor }]}>Message requests</Text>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
            </Pressable>

            <View style={[styles.innerDivider, { backgroundColor: isDark ? '#1C1C1E' : '#EEEEEE' }]} />

            <Pressable
              onPress={() => { haptics.light(); router.push('/story-replies-control' as any); }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
              ]}
            >
              <Text style={[styles.rowLabel, { color: labelColor }]}>Story replies</Text>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
            </Pressable>
          </View>
        </Animated.View>

        <View style={[styles.blockSeparator, { backgroundColor: separatorBg }]} />

        <Animated.View entering={FadeInDown.delay(180).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
            Who can see you're online
          </Text>

          <View style={styles.sectionCard}>
            <Pressable
              onPress={() => { haptics.light(); router.push('/activity-status-control' as any); }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
              ]}
            >
              <Text style={[styles.rowLabel, { color: labelColor }]}>Show activity status</Text>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
            </Pressable>

            <View style={[styles.innerDivider, { backgroundColor: isDark ? '#1C1C1E' : '#EEEEEE' }]} />

            <Pressable
              onPress={() => { haptics.light(); router.push('/read-receipts-control' as any); }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
              ]}
            >
              <Text style={[styles.rowLabel, { color: labelColor }]}>Show read receipts</Text>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
            </Pressable>
          </View>
        </Animated.View>

        <View style={[styles.blockSeparator, { backgroundColor: separatorBg }]} />

        <Animated.View entering={FadeInDown.delay(260).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
            End-to-end encryption
          </Text>

          <View style={styles.sectionCard}>
            <Pressable
              onPress={() => { haptics.light(); router.push('/security-alerts-control' as any); }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
              ]}
            >
              <Text style={[styles.rowLabel, { color: labelColor }]}>Security alerts</Text>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
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
  scroll: {
    paddingVertical: 14,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    textTransform: 'none',
  },
  sectionCard: {
    marginVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    flex: 1,
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  blockSeparator: {
    height: 10,
    marginVertical: 16,
  },
});
