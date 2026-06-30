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
// CUSTOM RADIO ROW (Instagram standard)
// ─────────────────────────────────────────────
interface RadioRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
}

const RadioRow = ({ label, selected, onPress, isDark }: RadioRowProps) => {
  const scale = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    scale.value = withTiming(selected ? 1 : 0, { duration: 150 });
  }, [selected]);

  const innerDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelColor = isDark ? '#FFFFFF' : '#000000';
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
      <Text style={[styles.radioLabel, { color: labelColor }]}>{label}</Text>
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
export default function StoryRepliesControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [option, setOption] = useState<'all' | 'follow' | 'none'>('all');

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleSelectOption = (opt: 'all' | 'follow' | 'none') => {
    setOption(opt);
    let msg = 'Replies allowed from everyone';
    if (opt === 'follow') msg = 'Replies allowed from followers you follow back';
    if (opt === 'none') msg = 'Story replies disabled';
    
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
          Story replies
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
            Who can reply to your stories
          </Text>

          <View style={styles.card}>
            <RadioRow
              label="Allow replies from all followers"
              selected={option === 'all'}
              onPress={() => handleSelectOption('all')}
              isDark={isDark}
            />
            <RadioRow
              label="Allow replies from followers you follow back"
              selected={option === 'follow'}
              onPress={() => handleSelectOption('follow')}
              isDark={isDark}
            />
            <RadioRow
              label="Don't allow story replies"
              selected={option === 'none'}
              onPress={() => handleSelectOption('none')}
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
    fontSize: 19.5,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 0,
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
  radioLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    flex: 1,
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
