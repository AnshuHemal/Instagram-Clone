import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function PendingTagsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleManageSettings = () => {
    haptics.light();
    // Navigate back to the parent Tags and Mentions settings screen
    router.replace('/tags-mentions-settings' as any);
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const headlineColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';

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
          Pending tags
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.textWrap}>
          <Text style={[styles.headline, { color: headlineColor }]}>
            There are no pending tags for you to review
          </Text>
          
          <Text style={[styles.desc, { color: descColor }]}>
            If you've been tagged in a photo or reel by an account that needs your review, it will show up here for you to approve before the tag is visible on your profile.
          </Text>

          <Pressable
            onPress={handleManageSettings}
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.actionBtnText}>Manage who can tag you</Text>
          </Pressable>
        </Animated.View>
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
    paddingLeft: 0, // offset to balance spacer
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    marginTop: -60, // optical balance shift
  },
  textWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontFamily: Fonts.semiBold,
    fontSize: 23,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  desc: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  actionBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#3897EF',
  },
});
