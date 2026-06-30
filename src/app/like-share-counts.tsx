import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolateColor 
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

// Custom Reanimated Switch Component
const AnimatedSwitch = ({ value, onValueChange }: { value: boolean; onValueChange: (val: boolean) => void }) => {
  const { isDark } = useTheme();
  const translateX = useSharedValue(value ? 20 : 0);
  
  useEffect(() => {
    translateX.value = withTiming(value ? 20 : 0, { duration: 200 });
  }, [value, translateX]);

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedTrackStyle = useAnimatedStyle(() => {
    const activeColor = '#0095F6'; // Blue active
    const inactiveColor = isDark ? '#3A3A3C' : '#EAEAEA';
    
    const backgroundColor = interpolateColor(
      translateX.value,
      [0, 20],
      [inactiveColor, activeColor]
    );

    return { backgroundColor };
  });

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.switchTrack, animatedTrackStyle]}>
        <Animated.View style={[styles.switchThumb, animatedThumbStyle]} />
      </Animated.View>
    </Pressable>
  );
};

export default function LikeShareCountsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [hideCounts, setHideCounts] = useState(false);

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const handleLinkPress = () => {
    haptics.light();
    showToast({ message: 'Opening Help Center...', type: 'info' });
    Linking.openURL('https://help.instagram.com/477434105621119/').catch(() => {
      showToast({ message: 'Could not open help link.', type: 'error' });
    });
  };

  const handleSwitchChange = (val: boolean) => {
    haptics.light();
    setHideCounts(val);
    showToast({ 
      message: val ? 'Like and share counts hidden' : 'Like and share counts visible', 
      type: 'info' 
    });
  };

  const textGray = isDark ? '#A8A8A8' : '#737373';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Like and share counts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Switch option */}
        <View style={styles.switchRow}>
          <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Hide like and share counts
          </Text>
          <AnimatedSwitch 
            value={hideCounts} 
            onValueChange={handleSwitchChange} 
          />
        </View>

        {/* Description caption */}
        <Text style={[styles.descriptionText, { color: textGray }]}>
          On Instagram, the number of likes and shares on posts and reels from other accounts will be hidden. You can hide the number of likes and shares on your own posts and reels by going to Advanced settings before sharing.{' '}
          <Text onPress={handleLinkPress} style={styles.blueLinkInline}>
            Learn more
          </Text>
        </Text>
      </ScrollView>
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
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    flex: 1,
    paddingRight: 16,
    letterSpacing: -0.15,
  },
  descriptionText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18.5,
    paddingHorizontal: 4,
  },
  blueLinkInline: {
    color: '#0095F6',
    fontFamily: Fonts.medium,
  },
  // Switch styling
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 3,
  },
});
