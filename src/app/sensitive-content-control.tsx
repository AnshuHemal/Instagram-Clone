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
// CUSTOM RADIO ROW (Instagram standard)
// ─────────────────────────────────────────────
interface RadioRowProps {
  label: string;
  sublabel: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
}

const RadioRow = ({ label, sublabel, selected, onPress, isDark }: RadioRowProps) => {
  const scale = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    scale.value = withTiming(selected ? 1 : 0, { duration: 150 });
  }, [selected]);

  const innerDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const sublabelColor = isDark ? '#737373' : '#8E8E8F';
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
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={[styles.radioLabel, { color: labelColor }]}>{label}</Text>
        <Text style={[styles.radioSublabel, { color: sublabelColor }]}>{sublabel}</Text>
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
export default function SensitiveContentControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [option, setOption] = useState<'less' | 'standard' | 'more'>('standard');

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleLearnMore = () => {
    haptics.light();
    showToast({
      message: 'Sensitive content rules apply to explore page, hashtags, reels, and feeds.',
      type: 'info',
    });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
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
          Sensitive content control
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.introBlock}>
          <Text style={[styles.introText, { color: subtitleColor }]}>
            Sensitive content doesn't go against our Community Guidelines, but refers to topics some people may not want to see.
            <Text style={styles.learnMoreLink} onPress={handleLearnMore}> Learn more</Text>
          </Text>
        </Animated.View>

        <View style={styles.contentWrap}>
          <Animated.View entering={FadeInDown.delay(150).duration(300)}>
            <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>Choose how much sensitive content to see:</Text>
            <View style={styles.sectionCard}>
              <RadioRow
                label="Less"
                sublabel="You might see less sensitive content."
                selected={option === 'less'}
                onPress={() => setOption('less')}
                isDark={isDark}
              />
              <RadioRow
                label="Standard"
                sublabel="You might see some sensitive content."
                selected={option === 'standard'}
                onPress={() => setOption('standard')}
                isDark={isDark}
              />
              <RadioRow
                label="More"
                sublabel="You might see more sensitive content."
                selected={option === 'more'}
                onPress={() => setOption('more')}
                isDark={isDark}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Text style={[styles.sectionDesc, { color: descColor }]}>
              This affects search results as well as recommended content in Explore, Reels, feed and hashtag pages. This also affects comments you see on other people's posts.
            </Text>
          </Animated.View>
        </View>
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
    marginBottom: 20,
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
  contentWrap: {
    marginTop: 8,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionCard: {
    marginVertical: 4,
  },
  sectionDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  radioLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginBottom: 3,
  },
  radioSublabel: {
    fontFamily: Fonts.regular,
    fontSize: 14,
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
