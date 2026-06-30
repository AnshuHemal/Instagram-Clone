import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function FeaturesYouCantUseScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleOpenGuidelines = () => {
    haptics.light();
    showToast({ message: 'Opening Community Standards...', type: 'info' });
    Linking.openURL('https://help.instagram.com/477434105621119/').catch(() => {
      showToast({ message: 'Could not open help link.', type: 'error' });
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Features you can't use</Text>
      </View>

      <View style={styles.content}>
        {/* Visual Badge Illustration */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(450)}
          style={styles.illustrationSection}
        >
          <View style={styles.iconContainer}>
            <View style={[styles.userIconCircle, { borderColor: isDark ? '#FFFFFF' : '#000000' }]}>
              <Feather name="user" size={40} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <View style={[styles.infoIconBadge, { borderColor: colors.background, backgroundColor: colors.background }]}>
              <View style={styles.infoInnerCircle}>
                <Text style={styles.infoText}>i</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.headingText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            You can use all Instagram features right now
          </Text>

          <Text style={[styles.subText, { color: isDark ? '#A8A8A8' : '#737373' }]}>
            Thank you for following our{' '}
            <Text onPress={handleOpenGuidelines} style={styles.linkText}>
              Community Standards
            </Text>
            .
          </Text>
        </Animated.View>

        {/* Section: What this means */}
        <Animated.View 
          entering={FadeInDown.delay(250).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.sectionHeader, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            What this means
          </Text>
          <Text style={[styles.sectionBody, { color: isDark ? '#A8A8A8' : '#737373' }]}>
            You have access to features like commenting, following, going live, and liking.
          </Text>
        </Animated.View>

        {/* Section: What you can do */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.sectionHeader, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            What you can do
          </Text>

          <Pressable
            onPress={handleOpenGuidelines}
            style={({ pressed }) => [
              styles.actionRow,
              { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} style={styles.actionIcon} />
            <Text style={[styles.actionText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Learn about our Community Standards
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#8E8E8F" />
          </Pressable>
        </Animated.View>
      </View>
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
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  headerBackBtn: {
    position: 'absolute',
    left: 12,
    bottom: 8,
    padding: 6,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 36,
  },
  illustrationSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 90,
    height: 90,
    position: 'relative',
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoInnerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.8,
    borderColor: '#D62976',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: '#D62976',
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    marginTop: -2.5,
    textAlign: 'center',
  },
  headingText: {
    fontFamily: Fonts.semiBold,
    fontSize: 21,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  subText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    textAlign: 'center',
  },
  linkText: {
    color: '#0095F6',
    fontFamily: Fonts.medium,
  },
  section: {
    width: '100%',
    marginBottom: 28,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginBottom: 10,
  },
  sectionBody: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  actionIcon: {
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16.5,
  },
});
