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
  interpolateColor,
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

// Animated Switch
const AnimatedSwitch = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) => {
  const { isDark } = useTheme();
  const translateX = useSharedValue(value ? 20 : 0);

  useEffect(() => {
    translateX.value = withTiming(value ? 20 : 0, { duration: 200 });
  }, [value, translateX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const trackStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      translateX.value,
      [0, 20],
      [isDark ? '#3A3A3C' : '#EAEAEA', '#000000']
    );
    return { backgroundColor: bg };
  });

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.switchTrack, trackStyle]}>
        <Animated.View style={[styles.switchThumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
};

interface SwitchRowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  isDark: boolean;
  delay: number;
}

const SwitchRow = ({ label, description, value, onToggle, isDark, delay }: SwitchRowProps) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(380)}>
    <View style={styles.switchRowWrap}>
      <View style={styles.switchRowTop}>
        <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>{label}</Text>
        <AnimatedSwitch value={value} onValueChange={onToggle} />
      </View>
      <Text style={[styles.rowDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{description}</Text>
    </View>
  </Animated.View>
);

export default function SharingSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [storiesMentioned, setStoriesMentioned] = useState(false);
  const [storyShares, setStoryShares] = useState(true);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const toggle = (key: 'storiesMentioned' | 'storyShares') => {
    haptics.light();
    if (key === 'storiesMentioned') {
      setStoriesMentioned((p) => {
        showToast({ message: !p ? 'Stories they\'re mentioned in enabled' : 'Stories they\'re mentioned in disabled', type: 'info' });
        return !p;
      });
    } else {
      setStoryShares((p) => {
        showToast({ message: !p ? 'Story shares enabled' : 'Story shares disabled', type: 'info' });
        return !p;
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
            borderBottomColor: isDark ? '#262626' : '#DBDBDB',
          },
        ]}
      >
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Sharing
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section label */}
        <Animated.View entering={FadeInDown.delay(60).duration(380)}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            What people can share on Instagram
          </Text>
        </Animated.View>

        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <SwitchRow
            delay={120}
            isDark={isDark}
            label="Stories they're mentioned in"
            description="Allow people you mention in a story to share it with their audience for an additional 24 hours."
            value={storiesMentioned}
            onToggle={() => toggle('storiesMentioned')}
          />

          <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#EAEAEA' }]} />

          <SwitchRow
            delay={200}
            isDark={isDark}
            label="Story shares"
            description="When this is on, people can send your stories in messages."
            value={storyShares}
            onToggle={() => toggle('storyShares')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    paddingTop: 20,
  },
  sectionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    paddingHorizontal: 20,
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  card: {
    paddingHorizontal: 20,
  },
  switchRowWrap: {
    paddingVertical: 16,
  },
  switchRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    flex: 1,
    paddingRight: 12,
    letterSpacing: -0.15,
  },
  rowDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 4,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
  },
});
