import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';
import { storySettingsStore } from '@/store/story-settings-store';

export default function StoryLiveLocationScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [hiddenCount, setHiddenCount] = useState(storySettingsStore.getHiddenCount());

  useEffect(() => {
    return storySettingsStore.subscribe(() => {
      setHiddenCount(storySettingsStore.getHiddenCount());
    });
  }, []);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleHideStory = () => {
    haptics.light();
    router.push('/hide-story-from' as any);
  };

  const handleLocationSharing = () => {
    haptics.light();
    router.push('/location-sharing-control' as any);
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const valueColor = isDark ? '#A8A8A8' : '#737373';

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
          Story, live and location
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.content}>
        {/* Row 1: Hide story and live from */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Pressable
            onPress={handleHideStory}
            style={({ pressed }) => [
              styles.row,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
            ]}
          >
            <View style={styles.rowInfo}>
              <Text style={[styles.rowTitle, { color: labelColor }]}>Hide story and live from</Text>
              <Text style={[styles.rowDesc, { color: descColor }]}>
                Hide your story and live videos from specific people.
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: valueColor }]}>{hiddenCount}</Text>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
            </View>
          </Pressable>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#1C1C1E' : '#EEEEEE' }]} />

        {/* Row 2: Location sharing */}
        <Animated.View entering={FadeInDown.delay(160).duration(300)}>
          <Pressable
            onPress={handleLocationSharing}
            style={({ pressed }) => [
              styles.row,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
            ]}
          >
            <View style={styles.rowInfo}>
              <Text style={[styles.rowTitle, { color: labelColor }]}>Location sharing</Text>
              <Text style={[styles.rowDesc, { color: descColor }]}>
                Instagram map
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
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
    paddingLeft: 0,
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
  rowInfo: {
    flex: 1,
    paddingRight: 16,
  },
  rowTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginBottom: 4,
  },
  rowDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    marginRight: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});
