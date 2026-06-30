import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function ReviewTagsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handlePressOption = (option: string) => {
    haptics.light();
    showToast({ message: `${option} clicked`, type: 'info' });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const iconColor = isDark ? '#FFFFFF' : '#000000';

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
          Tags
        </Text>
      </View>

      <View style={styles.content}>
        {/* Row 1: Tagged */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Pressable
            onPress={() => { haptics.light(); router.push('/tagged-posts' as any); }}
            style={({ pressed }) => [
              styles.row,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9' },
            ]}
          >
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons
                name="account-box-outline"
                size={24}
                color={iconColor}
                style={styles.icon}
              />
              <Text style={[styles.rowLabel, { color: labelColor }]}>Tagged</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#8E8E8F' : '#C7C7CC'} />
          </Pressable>
        </Animated.View>

        {/* Row 2: Pending tags */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)}>
          <Pressable
            onPress={() => { haptics.light(); router.push('/pending-tags' as any); }}
            style={({ pressed }) => [
              styles.row,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9' },
            ]}
          >
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons
                name="eye-outline"
                size={24}
                color={iconColor}
                style={styles.icon}
              />
              <Text style={[styles.rowLabel, { color: labelColor }]}>Pending tags</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#8E8E8F' : '#C7C7CC'} />
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
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 12,
    bottom: 8,
    padding: 6,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    letterSpacing: -0.4,
  },
  content: {
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 16,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
  },
});
