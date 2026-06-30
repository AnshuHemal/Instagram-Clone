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
// CUSTOM SWITCH (Instagram Blue style)
// ─────────────────────────────────────────────
interface CustomSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  isDark: boolean;
}

function CustomSwitch({ value, onValueChange, isDark }: CustomSwitchProps) {
  const translateX = useSharedValue(value ? 20 : 0);

  useEffect(() => {
    translateX.value = withTiming(value ? 20 : 0, { duration: 150 });
  }, [value]);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onValueChange(!value);
      }}
      style={[
        switchStyles.track,
        {
          backgroundColor: value
            ? '#3897F0'
            : isDark ? '#262626' : '#EFEFEF',
        },
      ]}
    >
      <Animated.View style={[switchStyles.thumb, thumbAnimatedStyle]} />
    </Pressable>
  );
}

const switchStyles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function ShowReadReceiptsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [readReceipts, setReadReceipts] = useState(true);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
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
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Show read receipts
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.switchRow}>
          <View style={styles.labelCol}>
            <Text style={[styles.rowTitle, { color: labelColor }]}>Read receipts</Text>
            <Text style={[styles.rowDesc, { color: descColor }]}>
              Others can see when you've read their messages.
            </Text>
          </View>
          <CustomSwitch
            value={readReceipts}
            onValueChange={(val) => {
              setReadReceipts(val);
              showToast({
                message: val ? 'Read receipts enabled' : 'Read receipts disabled',
                type: 'info',
              });
            }}
            isDark={isDark}
          />
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
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  labelCol: {
    flex: 1,
    paddingRight: 16,
  },
  rowTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16.5,
    marginBottom: 8,
  },
  rowDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
});
