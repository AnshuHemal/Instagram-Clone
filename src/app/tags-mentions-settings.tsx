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
export default function TagsMentionsSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State Management
  const [tagOption, setTagOption] = useState<'everyone' | 'follow' | 'none'>('everyone');
  const [manualApprove, setManualApprove] = useState(false);
  const [mentionOption, setMentionOption] = useState<'everyone' | 'follow' | 'none'>('everyone');
  const [boostStories, setBoostStories] = useState(true);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleReviewTags = () => {
    haptics.light();
    showToast({ message: 'No tags to review right now.', type: 'info' });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const sectionTitleColor = isDark ? '#A8A8A8' : '#737373';
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
          Tags and mentions
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Who can tag you */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>Who can tag you</Text>
          <View style={styles.sectionCard}>
            <RadioRow
              label="Allow tags from everyone"
              selected={tagOption === 'everyone'}
              onPress={() => setTagOption('everyone')}
              isDark={isDark}
            />
            <RadioRow
              label="Allow tags from people you follow"
              selected={tagOption === 'follow'}
              onPress={() => setTagOption('follow')}
              isDark={isDark}
            />
            <RadioRow
              label="Don't allow tags"
              selected={tagOption === 'none'}
              onPress={() => setTagOption('none')}
              isDark={isDark}
            />
          </View>
          <Text style={[styles.sectionDesc, { color: descColor }]}>
            Choose who can tag you in their photos and reels. When people try to tag you, they'll see if you don't allow tags from everyone. Potential spam will always be filtered.
          </Text>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#262626' : '#EEEEEE' }]} />

        {/* Section 2: How you manage tags */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>How you manage tags</Text>
          <View style={styles.sectionCard}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  Manually approve tags
                </Text>
              </View>
              <CustomSwitch
                value={manualApprove}
                onValueChange={(val) => {
                  setManualApprove(val);
                  showToast({
                    message: val ? 'Manual approval enabled' : 'Manual approval disabled',
                    type: 'info',
                  });
                }}
                isDark={isDark}
              />
            </View>

            <Pressable
              onPress={handleReviewTags}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9' },
              ]}
            >
              <View style={styles.rowInfo}>
                <Text style={[styles.rowText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  Review tags
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
            </Pressable>
          </View>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#262626' : '#EEEEEE' }]} />

        {/* Section 3: Who can @mention you */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>Who can @mention you</Text>
          <View style={styles.sectionCard}>
            <RadioRow
              label="Allow mentions from everyone"
              selected={mentionOption === 'everyone'}
              onPress={() => setMentionOption('everyone')}
              isDark={isDark}
            />
            <RadioRow
              label="Allow mentions from people you follow"
              selected={mentionOption === 'follow'}
              onPress={() => setMentionOption('follow')}
              isDark={isDark}
            />
            <RadioRow
              label="Don't allow mentions"
              selected={mentionOption === 'none'}
              onPress={() => setMentionOption('none')}
              isDark={isDark}
            />
          </View>
          <Text style={[styles.sectionDesc, { color: descColor }]}>
            Choose who can @mention you to link your profile in their stories, notes, comments, live videos, bio, and captions. When people try to @mention you, they'll see if you don't allow @mentions.
          </Text>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#262626' : '#EEEEEE' }]} />

        {/* Section 4: Boost Stories */}
        <Animated.View entering={FadeInDown.delay(250).duration(300)}>
          <View style={styles.sectionCard}>
            <View style={styles.row}>
              <View style={[styles.rowInfo, { paddingRight: 12 }]}>
                <Text style={[styles.rowText, { color: isDark ? '#FFFFFF' : '#000000', fontSize: 16, lineHeight: 22 }]}>
                  Allow people to boost stories they mention you in
                </Text>
              </View>
              <CustomSwitch
                value={boostStories}
                onValueChange={(val) => {
                  setBoostStories(val);
                  showToast({
                    message: val ? 'Allowing story boosting' : 'Disabled story boosting',
                    type: 'info',
                  });
                }}
                isDark={isDark}
              />
            </View>
          </View>
          <Text style={[styles.sectionDesc, { color: descColor, marginTop: 8 }]}>
            Boosting turns content into an ad so it can reach more people. Stories you're mentioned in, including ones that share your post and reels, can only be boosted if you have a public profile that allows mentions. These stories may also be visible for longer than 24 hours and can be seen by anyone.
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
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'none',
  },
  sectionCard: {
    marginVertical: 4,
  },
  sectionDesc: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  divider: {
    height: 8,
    marginVertical: 16,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowInfo: {
    flex: 1,
  },
  rowText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
});
