import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

// ─────────────────────────────────────────────
// CUSTOM RADIO ROW WITH DESCRIPTION
// ─────────────────────────────────────────────
interface RadioDescRowProps {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
}

const RadioDescRow = ({ title, description, selected, onPress, isDark }: RadioDescRowProps) => {
  const scale = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    scale.value = withTiming(selected ? 1 : 0, { duration: 150 });
  }, [selected]);

  const innerDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const titleColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const outerBorderColor = selected
    ? (isDark ? '#FFFFFF' : '#000000')
    : (isDark ? '#555555' : '#C7C7CC');

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.radioRow,
        pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9' },
      ]}
    >
      <View style={styles.rowInfo}>
        <Text style={[styles.rowTitle, { color: titleColor }]}>{title}</Text>
        <Text style={[styles.rowDesc, { color: descColor }]}>{description}</Text>
      </View>
      <View style={[styles.radioOuter, { borderColor: outerBorderColor }]}>
        <Animated.View
          style={[
            styles.radioInner,
            { backgroundColor: isDark ? '#FFFFFF' : '#000000' },
            innerDotStyle,
          ]}
        />
      </View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function GroupChatAddScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [option, setOption] = useState<'everyone' | 'following'>('everyone');

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleSelectOption = (opt: 'everyone' | 'following') => {
    setOption(opt);
    const msg = opt === 'everyone'
      ? 'Everyone can add you to group chats'
      : 'Only people you follow can add you to groups';
    showToast({ message: msg, type: 'success' });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const sectionTitleColor = isDark ? '#A8A8A8' : '#737373';

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
          Who can add you to group chats
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
            Who can add you to group chats
          </Text>

          <View style={styles.card}>
            <RadioDescRow
              title="Everyone on Instagram"
              description="You can be added to group chats by everyone, except by people you've blocked."
              selected={option === 'everyone'}
              onPress={() => handleSelectOption('everyone')}
              isDark={isDark}
            />
            <RadioDescRow
              title="Only people you follow on Instagram"
              description="People you follow or have messaged before can add you to group chats."
              selected={option === 'following'}
              onPress={() => handleSelectOption('following')}
              isDark={isDark}
            />
          </View>
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
    fontSize: 18.5,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 33,
  },
  content: {
    paddingVertical: 14,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    marginVertical: 4,
  },
  radioRow: {
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
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
