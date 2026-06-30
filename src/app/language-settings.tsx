import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
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

export default function LanguageSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Local switch preferences
  const [translateText, setTranslateText] = useState(true);
  const [translateVoice, setTranslateVoice] = useState(false);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleOptionPress = (label: string) => {
    haptics.light();
    showToast({ message: `${label} options coming soon!`, type: 'info' });
  };

  const handleSwitchChange = (type: string, val: boolean) => {
    haptics.light();
    if (type === 'text') {
      setTranslateText(val);
      showToast({ message: val ? 'Sticker translation enabled' : 'Sticker translation disabled', type: 'info' });
    } else if (type === 'voice') {
      setTranslateVoice(val);
      showToast({ message: val ? 'Voice translation enabled' : 'Voice translation disabled', type: 'info' });
    }
  };

  const borderCol = isDark ? '#262626' : '#EAEAEA';
  const textGray = isDark ? '#A8A8A8' : '#737373';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Language and translations</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        {/* Section 1: Instagram language */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Instagram language
          </Text>

          <Pressable 
            onPress={() => handleOptionPress('Set language')} 
            style={({ pressed }) => [
              styles.navRow,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }
            ]}
          >
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Set language
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#8E8E8F" />
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: borderCol }]} />

        {/* Section 2: Reels translations */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Reels translations
          </Text>

          <Pressable 
            onPress={() => handleOptionPress('Preferred languages')} 
            style={({ pressed }) => [
              styles.navRow,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }
            ]}
          >
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Preferred languages
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#8E8E8F" />
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Translate text on reels
            </Text>
            <AnimatedSwitch 
              value={translateText} 
              onValueChange={(val) => handleSwitchChange('text', val)} 
            />
          </View>
          
          <Text style={[styles.descriptionText, { color: textGray }]}>
            See stickers and text in your preferred language when available.
          </Text>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Translate voice
            </Text>
            <AnimatedSwitch 
              value={translateVoice} 
              onValueChange={(val) => handleSwitchChange('voice', val)} 
            />
          </View>
          
          <Text style={[styles.descriptionText, { color: textGray }]}>
            Hear audio translated into your default language in the speaker's voice when available.
          </Text>
        </View>
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
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 17.5,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  descriptionText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18.5,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 4,
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
    fontSize: 16.5,
    flex: 1,
    paddingRight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 16,
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
