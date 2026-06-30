import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
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
export default function ActivityStatusControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activityStatus, setActivityStatus] = useState(true);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleLearnMore = () => {
    haptics.light();
    showToast({
      message: 'When activity status is off, you also won\'t see others\' activity status.',
      type: 'info',
    });
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
          Activity Status
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.contentWrap}>
          {/* Switch Row */}
          <View style={styles.switchRow}>
            <View style={styles.labelCol}>
              <Text style={[styles.rowTitle, { color: labelColor }]}>Show activity status</Text>
              <Text style={[styles.rowDesc, { color: descColor }]}>
                Allow people you follow and anyone you message to see when you were last active or are currently active on Instagram apps. When this is turned off, you won't be able to see the activity status of others.
                <Text style={styles.learnMore} onPress={handleLearnMore}> Learn More</Text>
              </Text>
            </View>
            <CustomSwitch
              value={activityStatus}
              onValueChange={(val) => {
                setActivityStatus(val);
                showToast({
                  message: val ? 'Activity status is now visible' : 'Activity status hidden',
                  type: 'info',
                });
              }}
              isDark={isDark}
            />
          </View>

          {/* Footer disclaimer */}
          <Text style={[styles.disclaimerText, { color: descColor }]}>
            You can continue to use our services if active status is off.
          </Text>
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
    paddingVertical: 20,
  },
  contentWrap: {
    paddingHorizontal: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    fontSize: 13.5,
    lineHeight: 19,
  },
  learnMore: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    color: '#0095F6',
  },
  disclaimerText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
});
