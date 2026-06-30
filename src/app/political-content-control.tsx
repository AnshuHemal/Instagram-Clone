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
export default function PoliticalContentControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [suggestPolitical, setSuggestPolitical] = useState(false);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleLearnMore = () => {
    haptics.light();
    showToast({
      message: 'Political content controls allow you to limit posts about elections or governments.',
      type: 'info',
    });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const subtitleColor = isDark ? '#737373' : '#262626';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const sectionTitleColor = isDark ? '#A8A8A8' : '#262626';

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
          Political content
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Paragraph */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.introBlock}>
          <Text style={[styles.introText, { color: subtitleColor }]}>
            Political content often refers to governments, elections or social topics that affect many people.
            <Text style={styles.learnMoreLink} onPress={handleLearnMore}> Learn more</Text>
          </Text>
        </Animated.View>

        {/* Section 1: What you see from accounts you follow */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
            What you see from accounts you follow
          </Text>
          <Text style={[styles.sectionDesc, { color: descColor }]}>
            Political content from accounts you follow will be shown in your feed like any other content they share.
          </Text>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }]} />

        {/* Section 2: What you see from accounts you don't follow */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
            What you see from accounts you don't follow
          </Text>
          
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: labelColor }]}>Suggest political content</Text>
            <CustomSwitch
              value={suggestPolitical}
              onValueChange={(val) => {
                setSuggestPolitical(val);
                showToast({
                  message: val ? 'Political content suggestions turned on' : 'Political content suggestions limited',
                  type: 'info',
                });
              }}
              isDark={isDark}
            />
          </View>

          <Text style={[styles.sectionDesc, { color: descColor, marginTop: 4 }]}>
            You can choose whether political content will be suggested to you like any other content. If this isn't selected, we won't suggest political content when we recognize it.
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
  scroll: {
    paddingVertical: 14,
  },
  introBlock: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  introText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
  },
  learnMoreLink: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: '#3897EF',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 15.5,
    marginBottom: 8,
  },
  sectionDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 6,
  },
  switchLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    flex: 1,
    paddingRight: 12,
  },
});
