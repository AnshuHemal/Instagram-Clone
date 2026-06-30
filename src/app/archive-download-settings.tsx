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

export default function ArchiveDownloadSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Local preferences
  const [saveStoryArchive, setSaveStoryArchive] = useState(true);
  const [saveLiveArchive, setSaveLiveArchive] = useState(true);
  const [saveOriginalPhotos, setSaveOriginalPhotos] = useState(false);
  const [saveStoryGallery, setSaveStoryGallery] = useState(false);

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const handleLinkPress = (url: string, label: string) => {
    haptics.light();
    showToast({ message: `Opening ${label}...`, type: 'info' });
    Linking.openURL(url).catch(() => {
      showToast({ message: 'Could not open help link.', type: 'error' });
    });
  };

  const handleSwitchChange = (type: string, val: boolean) => {
    haptics.light();
    switch (type) {
      case 'story_archive':
        setSaveStoryArchive(val);
        showToast({ message: val ? 'Save story to archive enabled' : 'Save story to archive disabled', type: 'info' });
        break;
      case 'live_archive':
        setSaveLiveArchive(val);
        showToast({ message: val ? 'Save live to archive enabled' : 'Save live to archive disabled', type: 'info' });
        break;
      case 'original_photos':
        setSaveOriginalPhotos(val);
        showToast({ message: val ? 'Save original photos enabled' : 'Save original photos disabled', type: 'info' });
        break;
      case 'story_gallery':
        setSaveStoryGallery(val);
        showToast({ message: val ? 'Save story to gallery enabled' : 'Save story to gallery disabled', type: 'info' });
        break;
    }
  };

  const borderCol = isDark ? '#262626' : '#EAEAEA';
  const textGray = isDark ? '#A8A8A8' : '#737373';
  const sectionHeaderColor = isDark ? '#8E8E8F' : '#737373';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Archiving and downloading</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        {/* Section 1: Saving to archive */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: sectionHeaderColor }]}>
            Saving to archive
          </Text>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Save story to archive
            </Text>
            <AnimatedSwitch 
              value={saveStoryArchive} 
              onValueChange={(val) => handleSwitchChange('story_archive', val)} 
            />
          </View>
          
          <Text style={[styles.descriptionText, { color: textGray }]}>
            Automatically save photos and videos to your archive so you don't have to save them to your phone. Only you can see your archive.
          </Text>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Save live to archive
            </Text>
            <AnimatedSwitch 
              value={saveLiveArchive} 
              onValueChange={(val) => handleSwitchChange('live_archive', val)} 
            />
          </View>

          <Text style={[styles.descriptionText, { color: textGray }]}>
            Automatically save your live video to your archive. Only you can see your archive. Archived videos aren't visible unless you share them. Videos you shared publicly will be used to improve AI at Meta.{' '}
            <Text 
              onPress={() => handleLinkPress('https://help.instagram.com/477434105621119/', 'Learn more')} 
              style={styles.blueLinkTextInline}
            >
              Learn more
            </Text>
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: borderCol }]} />

        {/* Section 2: Saving to camera roll */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: sectionHeaderColor }]}>
            Saving to camera roll
          </Text>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Save original photos
            </Text>
            <AnimatedSwitch 
              value={saveOriginalPhotos} 
              onValueChange={(val) => handleSwitchChange('original_photos', val)} 
            />
          </View>

          <Text style={[styles.descriptionText, { color: textGray }]}>
            Automatically save the unedited photos and videos taken with Instagram's feed camera to your camera roll.
          </Text>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Save story to gallery
            </Text>
            <AnimatedSwitch 
              value={saveStoryGallery} 
              onValueChange={(val) => handleSwitchChange('story_gallery', val)} 
            />
          </View>

          <Text style={[styles.descriptionText, { color: textGray }]}>
            Automatically save your story to your phone's gallery.
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
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    marginBottom: 16,
  },
  blueLinkTextInline: {
    color: '#0095F6',
    fontFamily: Fonts.medium,
  },
  descriptionText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18.5,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
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
