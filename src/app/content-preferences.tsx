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
// ROW COMPONENTS
// ─────────────────────────────────────────────
interface ChevronRowProps {
  label: string;
  onPress: () => void;
  isDark: boolean;
  delay: number;
}

const ChevronRow = ({ label, onPress, isDark, delay }: ChevronRowProps) => {
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <Pressable
        onPress={() => {
          haptics.light();
          onPress();
        }}
        style={({ pressed }) => [
          styles.row,
          pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9' },
        ]}
      >
        <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#8E8E8F' : '#C7C7CC'} />
      </Pressable>
    </Animated.View>
  );
};

interface SwitchRowProps {
  label: string;
  sublabel: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  isDark: boolean;
  delay: number;
}

const SwitchRow = ({ label, sublabel, value, onValueChange, isDark, delay }: SwitchRowProps) => {
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)} style={styles.switchRowContainer}>
      <View style={styles.row}>
        <Text style={[styles.rowLabel, { color: labelColor, flex: 1, paddingRight: 12 }]}>{label}</Text>
        <CustomSwitch value={value} onValueChange={onValueChange} isDark={isDark} />
      </View>
      <Text style={[styles.sublabel, { color: descColor }]}>{sublabel}</Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function ContentPreferencesScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State Management
  const [snoozeSuggested, setSnoozeSuggested] = useState(false);
  const [hideActivityBubbles, setHideActivityBubbles] = useState(false);
  const [hideInstants, setHideInstants] = useState(false);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleOptionPress = (option: string) => {
    showToast({ message: `${option} clicked`, type: 'info' });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';

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
          Content preferences
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <ChevronRow
          label="Sensitive content"
          onPress={() => router.push('/sensitive-content-control' as any)}
          isDark={isDark}
          delay={100}
        />
        <ChevronRow
          label="Political content"
          onPress={() => router.push('/political-content-control' as any)}
          isDark={isDark}
          delay={130}
        />
        <ChevronRow
          label="Interested"
          onPress={() => handleOptionPress('Interested')}
          isDark={isDark}
          delay={160}
        />
        <ChevronRow
          label="Not interested"
          onPress={() => handleOptionPress('Not interested')}
          isDark={isDark}
          delay={190}
        />
        <ChevronRow
          label="Specific words and phrases"
          onPress={() => router.push('/add-words-phrases' as any)}
          isDark={isDark}
          delay={220}
        />

        <SwitchRow
          label="Snooze suggested posts in feed"
          sublabel="Hide suggested posts in feed for 30 days."
          value={snoozeSuggested}
          onValueChange={(val) => {
            setSnoozeSuggested(val);
            showToast({
              message: val ? 'Suggested posts snoozed for 30 days' : 'Snooze cancelled',
              type: 'info',
            });
          }}
          isDark={isDark}
          delay={250}
        />

        <ChevronRow
          label="Reset suggested content"
          onPress={() => handleOptionPress('Reset suggested content')}
          isDark={isDark}
          delay={280}
        />

        <SwitchRow
          label="Hide all activity bubbles in feed and reels"
          sublabel="When this is on, you won't see like, repost or comment activity bubbles in feed and reels."
          value={hideActivityBubbles}
          onValueChange={(val) => {
            setHideActivityBubbles(val);
            showToast({
              message: val ? 'Activity bubbles hidden' : 'Activity bubbles shown',
              type: 'info',
            });
          }}
          isDark={isDark}
          delay={310}
        />

        <SwitchRow
          label="Hide instants in inbox"
          sublabel="When this is on, you won't see new instants in your inbox."
          value={hideInstants}
          onValueChange={(val) => {
            setHideInstants(val);
            showToast({
              message: val ? 'Instants hidden in inbox' : 'Instants shown in inbox',
              type: 'info',
            });
          }}
          isDark={isDark}
          delay={340}
        />
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
    paddingVertical: 10,
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
    fontSize: 16.5,
  },
  switchRowContainer: {
    paddingBottom: 12,
  },
  sublabel: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: -8,
    marginBottom: 8,
  },
});
