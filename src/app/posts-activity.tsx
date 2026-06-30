import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function PostsActivityScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
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
          Posts
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Empty State Layout */}
      <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.content}>
        <View style={styles.emptyWrap}>
          <LinearGradient
            colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
            style={styles.gradientCircle}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={[styles.innerCircle, { backgroundColor: colors.background }]}>
              <Text style={styles.exclamationMark}>!</Text>
            </View>
          </LinearGradient>

          <Text style={[styles.emptyTitle, { color: labelColor }]}>
            You haven't posted anything
          </Text>
          <Text style={[styles.emptyDesc, { color: descColor }]}>
            When you create a post, it'll show up here.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  gradientCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2.5,
    marginBottom: 24,
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exclamationMark: {
    fontSize: 48,
    fontFamily: Fonts.regular,
    color: '#FF3B30',
    textAlign: 'center',
    lineHeight: 52,
  },
  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  emptyDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
  },
});
