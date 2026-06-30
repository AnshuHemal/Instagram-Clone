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

export default function DataUsageSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Local preferences
  const [dataSaver, setDataSaver] = useState(false);
  const [uploadHighest, setUploadHighest] = useState(false);

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const handleHighResMediaPress = () => {
    if (!dataSaver) return; // Disabled row
    haptics.light();
    showToast({ message: 'High resolution media options coming soon!', type: 'info' });
  };

  const handleSwitchChange = (type: string, val: boolean) => {
    haptics.light();
    if (type === 'saver') {
      setDataSaver(val);
      showToast({ message: val ? 'Data saver enabled' : 'Data saver disabled', type: 'info' });
    } else if (type === 'highest') {
      setUploadHighest(val);
      showToast({ message: val ? 'Upload at highest quality enabled' : 'Upload at highest quality disabled', type: 'info' });
    }
  };

  const borderCol = isDark ? '#262626' : '#EAEAEA';
  const textGray = isDark ? '#A8A8A8' : '#737373';
  const disabledColor = isDark ? '#555555' : '#C7C7CC';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Cellular data settings</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        {/* Section 1: Use less data */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Use less data
          </Text>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Data saver
            </Text>
            <AnimatedSwitch 
              value={dataSaver} 
              onValueChange={(val) => handleSwitchChange('saver', val)} 
            />
          </View>
          
          <Text style={[styles.descriptionText, { color: textGray }]}>
            When data saver is turned on, videos won't load in advance to help you use less data.
          </Text>

          <Pressable 
            onPress={handleHighResMediaPress} 
            disabled={!dataSaver}
            style={({ pressed }) => [
              styles.disabledRow,
              pressed && dataSaver && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }
            ]}
          >
            <Text style={[
              styles.rowLabel, 
              { color: dataSaver ? (isDark ? '#FFFFFF' : '#000000') : disabledColor }
            ]}>
              High resolution media
            </Text>
            <Text style={[
              styles.valueText, 
              { color: dataSaver ? (isDark ? '#A8A8A8' : '#737373') : disabledColor }
            ]}>
              Wi-Fi only
            </Text>
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: borderCol }]} />

        {/* Section 2: Media upload quality */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Media upload quality
          </Text>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Upload at highest quality
            </Text>
            <AnimatedSwitch 
              value={uploadHighest} 
              onValueChange={(val) => handleSwitchChange('highest', val)} 
            />
          </View>

          <Text style={[styles.descriptionText, { color: textGray }]}>
            Always upload the highest quality photos and videos, even if uploading takes longer. When this is off, we'll automatically adjust upload quality to fit network conditions.
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
    fontFamily: Fonts.bold,
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
  disabledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    flex: 1,
    paddingRight: 16,
  },
  valueText: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
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
