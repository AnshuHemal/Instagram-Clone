import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolateColor,
  FadeInDown
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

export default function AccessibilityScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reduceMotion, setReduceMotion] = useState(false);

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const handleSwitchChange = (val: boolean) => {
    haptics.light();
    setReduceMotion(val);
    showToast({ 
      message: val ? 'Motion reduction enabled' : 'Motion reduction disabled', 
      type: 'info' 
    });
  };

  const handlePressOption = (routeName: string) => {
    haptics.light();
    router.push(routeName as any);
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
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Accessibility</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Reduce Motion Row */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.section}
        >
          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Reduce Motion
            </Text>
            <AnimatedSwitch 
              value={reduceMotion} 
              onValueChange={handleSwitchChange} 
            />
          </View>
          <Text style={[styles.descriptionText, { color: textGray }]}>
            Reduce the motion for the visual effects in your chats
          </Text>
        </Animated.View>

        {/* Dark Mode Row */}
        <Animated.View entering={FadeInDown.delay(180).duration(350)}>
          <Pressable 
            onPress={() => handlePressOption('/dark-mode-settings')}
            style={({ pressed }) => [
              styles.navRow,
              { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
            ]}
          >
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Dark mode
            </Text>
          </Pressable>
        </Animated.View>

        {/* Captions Row */}
        <Animated.View entering={FadeInDown.delay(260).duration(350)}>
          <Pressable 
            onPress={() => handlePressOption('/closed-captions')}
            style={({ pressed }) => [
              styles.navRow,
              { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
            ]}
          >
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Captions
            </Text>
          </Pressable>
        </Animated.View>
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
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 16,
  },
  descriptionText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18.5,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    flex: 1,
    letterSpacing: -0.15,
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
