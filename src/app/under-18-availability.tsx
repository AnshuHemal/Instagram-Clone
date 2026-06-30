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

export default function Under18AvailabilityScreen() {
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
    showToast({ message: 'Opening age appropriate guidelines...', type: 'info' });
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
        {/* Match screenshot layout truncation */}
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1} ellipsizeMode="tail">
          Availability to people under 18
        </Text>
      </View>

      <View style={styles.content}>
        {/* Illustration graphic */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(450)}
          style={styles.illustrationSection}
        >
          <View style={styles.illustrationContainer}>
            {/* Phone/Profile Mock */}
            <View style={[styles.phoneMock, { borderColor: isDark ? '#FFFFFF' : '#000000', backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
              {/* Header profile */}
              <View style={styles.profileHeader}>
                <View style={[styles.avatarCircle, { borderColor: isDark ? '#444' : '#E0E0E0' }]} />
                <View style={styles.headerLines}>
                  <View style={[styles.lineShort, { backgroundColor: isDark ? '#333' : '#EFEFEF' }]} />
                  <View style={[styles.lineShorter, { backgroundColor: isDark ? '#333' : '#EFEFEF' }]} />
                </View>
              </View>
              {/* Grid dots representing photos */}
              <View style={styles.photoGridDots}>
                <View style={[styles.gridDot, { backgroundColor: isDark ? '#333' : '#EFEFEF' }]} />
                <View style={[styles.gridDot, { backgroundColor: isDark ? '#333' : '#EFEFEF' }]} />
                <View style={[styles.gridDot, { backgroundColor: isDark ? '#333' : '#EFEFEF' }]} />
              </View>
            </View>

            {/* Eye guidelines overlay badge */}
            <View style={[styles.overlayEyeBadge, { borderColor: colors.background, backgroundColor: colors.background }]}>
              <View style={styles.eyeInnerCircle}>
                <Feather name="eye" size={17} color="#D62976" />
              </View>
            </View>
          </View>

          <Text style={[styles.headingText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Your account follows our age appropriate guidelines
          </Text>

          <Text style={[styles.subText, { color: isDark ? '#A8A8A8' : '#737373' }]}>
            Learn more about our{' '}
            <Text onPress={handleOpenGuidelines} style={styles.linkText}>
              guidelines
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

          {/* Checklist Item 1 */}
          <View style={styles.checkRow}>
            <View style={[styles.checkCircle, { borderColor: isDark ? '#FFFFFF' : '#000000' }]}>
              <Ionicons name="checkmark" size={13} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <Text style={[styles.checkText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              By default, people under 18 can see your profile, bio and content you share.
            </Text>
          </View>

          {/* Checklist Item 2 */}
          <View style={styles.checkRow}>
            <View style={[styles.checkCircle, { borderColor: isDark ? '#FFFFFF' : '#000000' }]}>
              <Ionicons name="checkmark" size={13} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <Text style={[styles.checkText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              They can follow you and see your following and follower lists.
            </Text>
          </View>

          {/* Checklist Item 3 */}
          <View style={styles.checkRow}>
            <View style={[styles.checkCircle, { borderColor: isDark ? '#FFFFFF' : '#000000' }]}>
              <Ionicons name="checkmark" size={13} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <Text style={[styles.checkText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              You can message one another.
            </Text>
          </View>
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
    paddingHorizontal: 54, // Avoid overlapping back button
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
  illustrationContainer: {
    position: 'relative',
    width: 130,
    height: 90,
    marginBottom: 28,
    alignItems: 'center',
  },
  phoneMock: {
    width: 100,
    height: 80,
    borderRadius: 8,
    borderWidth: 1.8,
    padding: 8,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    marginRight: 6,
  },
  headerLines: {
    flex: 1,
  },
  lineShort: {
    width: '70%',
    height: 3,
    borderRadius: 1.5,
    marginBottom: 3,
  },
  lineShorter: {
    width: '45%',
    height: 3,
    borderRadius: 1.5,
  },
  photoGridDots: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  gridDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  overlayEyeBadge: {
    position: 'absolute',
    bottom: -6,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeInnerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.8,
    borderColor: '#D62976',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingText: {
    fontFamily: Fonts.semiBold,
    fontSize: 21,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
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
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginBottom: 20,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
    paddingHorizontal: 2,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 1,
  },
  checkText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
  },
});
