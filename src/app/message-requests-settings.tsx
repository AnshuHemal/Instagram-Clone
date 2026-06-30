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
export default function MessageRequestsSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [hideRequests, setHideRequests] = useState(false);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleLearnMore = () => {
    haptics.light();
    showToast({
      message: 'Choose if you want requests delivered to your main list or request folder.',
      type: 'info',
    });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const sectionTitleColor = isDark ? '#A8A8A8' : '#737373';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const valueColor = isDark ? '#A8A8A8' : '#737373';
  const separatorBg = isDark ? '#1C1C1E' : '#F8F9FA';

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
          Message requests
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.introBlock}>
          <Text style={[styles.introText, { color: descColor }]}>
            When someone who you don't follow or haven't chatted with before sends you a message, you receive it as a message request.
          </Text>
          <Pressable onPress={handleLearnMore} style={styles.learnLink}>
            <Text style={styles.learnLinkText}>Learn more about who can message you</Text>
          </Pressable>
        </Animated.View>

        {/* Section 1: Who can send you message requests */}
        <Animated.View entering={FadeInDown.delay(160).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
            Who can send you message requests
          </Text>

          <View style={styles.sectionCard}>
            <Pressable
              onPress={() => { haptics.light(); router.push('/message-deliver-followers' as any); }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
              ]}
            >
              <Text style={[styles.rowLabel, { color: labelColor }]}>Your followers on Instagram</Text>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: valueColor }]}>Requests</Text>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
              </View>
            </Pressable>

            <View style={[styles.innerDivider, { backgroundColor: isDark ? '#1C1C1E' : '#EEEEEE' }]} />

            <Pressable
              onPress={() => { haptics.light(); router.push('/message-deliver-others' as any); }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
              ]}
            >
              <Text style={[styles.rowLabel, { color: labelColor }]}>Others on Instagram</Text>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: valueColor }]}>Requests</Text>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* Section Separator */}
        <View style={[styles.blockSeparator, { backgroundColor: separatorBg }]} />

        {/* Section 2: Group chats */}
        <Animated.View entering={FadeInDown.delay(220).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
            Group chats
          </Text>

          <View style={styles.sectionCard}>
            <Pressable
              onPress={() => { haptics.light(); router.push('/group-chat-add' as any); }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
              ]}
            >
              <Text style={[styles.rowLabel, { color: labelColor }]}>Who can add you to group chats</Text>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
            </Pressable>
          </View>

          <Pressable onPress={handleLearnMore} style={[styles.learnLink, { paddingHorizontal: 16, marginTop: 12 }]}>
            <Text style={styles.learnLinkText}>Learn more about who can message you</Text>
          </Pressable>
        </Animated.View>

        {/* Section Separator */}
        <View style={[styles.blockSeparator, { backgroundColor: separatorBg }]} />

        {/* Section 3: Types of message requests */}
        <Animated.View entering={FadeInDown.delay(280).duration(300)} style={styles.toggleSection}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor, paddingHorizontal: 0 }]}>
            Types of message requests
          </Text>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelCol}>
              <Text style={[styles.switchTitle, { color: labelColor }]}>Hide unwanted message requests</Text>
              <Text style={[styles.switchDesc, { color: descColor }]}>
                Message requests that may be offensive, spam or scams will be moved to the Hidden requests folder. We'll also filter notifications for these messages.
              </Text>
            </View>
            <CustomSwitch
              value={hideRequests}
              onValueChange={(val) => {
                setHideRequests(val);
                showToast({
                  message: val ? 'Offensive requests will be hidden' : 'No requests will be hidden automatically',
                  type: 'info',
                });
              }}
              isDark={isDark}
            />
          </View>
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
    paddingVertical: 14,
  },
  introBlock: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  introText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  learnLink: {
    alignSelf: 'flex-start',
  },
  learnLinkText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#0095F6',
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    textTransform: 'none',
  },
  sectionCard: {
    marginVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    marginRight: 6,
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  blockSeparator: {
    height: 10,
    marginVertical: 16,
  },
  toggleSection: {
    paddingHorizontal: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  switchLabelCol: {
    flex: 1,
    paddingRight: 16,
  },
  switchTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16.5,
    marginBottom: 8,
  },
  switchDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
  },
});
