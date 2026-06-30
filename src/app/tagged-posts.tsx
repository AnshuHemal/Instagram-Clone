import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function TaggedPostsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleMenu = () => {
    haptics.light();
    showToast({ message: 'Options clicked', type: 'info' });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const headlineColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const innerBgColor = colors.background;

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
          Tagged
        </Text>
        <Pressable onPress={handleMenu} hitSlop={12} style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.illustrationWrap}>
          {/* Instagram gradient circle */}
          <LinearGradient
            colors={['#CA1D7E', '#E35157', '#F2703F', '#F99F4C']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientCircle}
          >
            <View style={[styles.innerCircle, { backgroundColor: innerBgColor }]}>
              <Text style={[styles.exclamationMark, { color: isDark ? '#FFFFFF' : '#000000' }]}>!</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.textWrap}>
          <Text style={[styles.headline, { color: headlineColor }]}>
            You haven't been tagged
          </Text>
          <Text style={[styles.desc, { color: descColor }]}>
            When you're tagged in a photo or reel, it'll show up here.
          </Text>
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
  },
  menuBtn: {
    padding: 6,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: -80, // slightly offset up for optical balance
  },
  illustrationWrap: {
    marginBottom: 28,
  },
  gradientCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exclamationMark: {
    fontFamily: Fonts.regular,
    fontSize: 48,
    lineHeight: 52,
    textAlign: 'center',
  },
  textWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  desc: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 20,
  },
});
