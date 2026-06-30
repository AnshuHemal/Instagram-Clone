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

// Nav Row – label + optional right value + chevron
interface NavRowProps {
  label: string;
  value?: string;
  isDark: boolean;
  delay: number;
  onPress?: () => void;
}

const NavRow = ({ label, value, isDark, delay, onPress }: NavRowProps) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(380)}>
    <Pressable
      onPress={() => { haptics.light(); onPress?.(); }}
      style={({ pressed }) => [
        styles.navRow,
        pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
      ]}
    >
      <Text style={[styles.navLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>{label}</Text>
      <View style={styles.navRight}>
        {value ? (
          <Text style={[styles.navValue, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{value}</Text>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={isDark ? '#6B7280' : '#9CA3AF'} />
      </View>
    </Pressable>
  </Animated.View>
);

// Switch Row
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
        <Text style={[styles.navLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>{label}</Text>
        <AnimatedSwitch value={value} onValueChange={onToggle} />
      </View>
      <Text style={[styles.rowDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{description}</Text>
    </View>
  </Animated.View>
);

export default function CommentsSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [allowGif, setAllowGif] = useState(true);
  const [allowPhoto, setAllowPhoto] = useState(true);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const toggle = (key: 'gif' | 'photo') => {
    haptics.light();
    if (key === 'gif') {
      setAllowGif((p) => {
        showToast({ message: !p ? 'GIF comments allowed' : 'GIF comments disabled', type: 'info' });
        return !p;
      });
    } else {
      setAllowPhoto((p) => {
        showToast({ message: !p ? 'Photo comments allowed' : 'Photo comments disabled', type: 'info' });
        return !p;
      });
    }
  };

  const handleComingSoon = (label: string) => {
    haptics.light();
    showToast({ message: `${label} settings coming soon!`, type: 'info' });
  };

  const borderColor = isDark ? '#2C2C2E' : '#EAEAEA';
  const sectionLabelColor = isDark ? '#FFFFFF' : '#000000';

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
          Comments
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Block comments from */}
        <Animated.View entering={FadeInDown.delay(60).duration(380)}>
          <Pressable
            onPress={() => handleComingSoon('Block comments from')}
            style={({ pressed }) => [
              styles.navRow,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
            ]}
          >
            <Text style={[styles.navLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Block comments from
            </Text>
            <View style={styles.navRight}>
              <Text style={[styles.navValue, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>0 people</Text>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#6B7280' : '#9CA3AF'} />
            </View>
          </Pressable>

          <Text style={[styles.rowDesc, { color: isDark ? '#9CA3AF' : '#6B7280', paddingHorizontal: 20, paddingBottom: 14 }]}>
            Any new comments from people you block won't be visible to anyone but them.
          </Text>
        </Animated.View>

        <View style={[styles.sectionDivider, { backgroundColor: borderColor }]} />

        {/* Who can comment */}
        <Animated.View entering={FadeInDown.delay(120).duration(380)}>
          <Text style={[styles.sectionTitle, { color: sectionLabelColor }]}>Who can comment</Text>
        </Animated.View>

        <NavRow
          delay={160}
          isDark={isDark}
          label="Posts and reels"
          value="Your followers"
          onPress={() => handleComingSoon('Posts and reels')}
        />

        <View style={[styles.rowDivider, { backgroundColor: borderColor }]} />

        <NavRow
          delay={200}
          isDark={isDark}
          label="Stories"
          onPress={() => handleComingSoon('Stories')}
        />

        <View style={[styles.sectionDivider, { backgroundColor: borderColor }]} />

        {/* Types of comments */}
        <Animated.View entering={FadeInDown.delay(240).duration(380)}>
          <Text style={[styles.sectionTitle, { color: sectionLabelColor }]}>Types of comments</Text>
        </Animated.View>

        <NavRow
          delay={280}
          isDark={isDark}
          label="Hide unwanted comments"
          value="Some"
          onPress={() => handleComingSoon('Hide unwanted comments')}
        />

        <Animated.View entering={FadeInDown.delay(300).duration(380)}>
          <Text style={[styles.rowDesc, { color: isDark ? '#9CA3AF' : '#6B7280', paddingHorizontal: 20, paddingVertical: 10 }]}>
            Instagram will automatically move comments that may be offensive or spam to the hidden comments section at the bottom of your comments.
          </Text>
        </Animated.View>

        <View style={[styles.rowDivider, { backgroundColor: borderColor }]} />

        <SwitchRow
          delay={340}
          isDark={isDark}
          label="Allow GIF comments"
          description="People will be able to comment GIFs on your posts and reels."
          value={allowGif}
          onToggle={() => toggle('gif')}
        />

        <View style={[styles.rowDivider, { backgroundColor: borderColor }]} />

        <SwitchRow
          delay={400}
          isDark={isDark}
          label="Allow photo comments"
          description="People will be able to comment photos on your posts and reels."
          value={allowPhoto}
          onToggle={() => toggle('photo')}
        />
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
    paddingTop: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  navLabel: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    flex: 1,
    letterSpacing: -0.15,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navValue: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    marginRight: 4,
  },
  rowDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    letterSpacing: -0.2,
  },
  sectionDivider: {
    height: 8,
    marginVertical: 4,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },
  switchRowWrap: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  switchRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
