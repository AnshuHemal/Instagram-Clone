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

export default function BrowserSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Local switch preferences
  const [enhancedBrowsing, setEnhancedBrowsing] = useState(false);
  const [autofillContact, setAutofillContact] = useState(false);
  const [autofillPayment, setAutofillPayment] = useState(false);
  const [safeBrowsing, setSafeBrowsing] = useState(true);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleClearCookies = () => {
    haptics.success();
    showToast({ message: 'Cookies and cache cleared successfully', type: 'success' });
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
      case 'enhanced':
        setEnhancedBrowsing(val);
        showToast({ message: val ? 'Enhanced browsing enabled' : 'Enhanced browsing disabled', type: 'info' });
        break;
      case 'contact':
        setAutofillContact(val);
        showToast({ message: val ? 'Contact autofill enabled' : 'Contact autofill disabled', type: 'info' });
        break;
      case 'payment':
        setAutofillPayment(val);
        showToast({ message: val ? 'Payment autofill enabled' : 'Payment autofill disabled', type: 'info' });
        break;
      case 'safe':
        setSafeBrowsing(val);
        showToast({ message: val ? 'Safe website browsing enabled' : 'Safe website browsing disabled', type: 'info' });
        break;
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
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Browser settings</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        {/* Section 1: Browsing data */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Browsing data
          </Text>

          <Pressable onPress={handleClearCookies} style={styles.blueLinkRow}>
            <Text style={styles.blueLinkText}>Clear cookies and cache</Text>
          </Pressable>
          
          <Text style={[styles.descriptionText, { color: textGray }]}>
            Clear cookies, cache and storage data from the websites you've visited while using Instagram.
          </Text>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Enhanced browsing
            </Text>
            <AnimatedSwitch 
              value={enhancedBrowsing} 
              onValueChange={(val) => handleSwitchChange('enhanced', val)} 
            />
          </View>

          <Text style={[styles.descriptionText, { color: textGray }]}>
            Show link history, shopping recommendations, and other helpful features by using info from websites you browse. Meta may also use information from these features to improve your ads.{' '}
            <Text 
              onPress={() => handleLinkPress('https://help.instagram.com/581076167354181', 'About enhanced browsing')} 
              style={styles.blueLinkTextInline}
            >
              About enhanced browsing
            </Text>
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: borderCol }]} />

        {/* Section 2: Autofill */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Autofill
          </Text>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Autofill contact forms
            </Text>
            <AnimatedSwitch 
              value={autofillContact} 
              onValueChange={(val) => handleSwitchChange('contact', val)} 
            />
          </View>

          <Pressable 
            onPress={() => handleLinkPress('https://help.instagram.com/', 'Add contact info')} 
            style={styles.blueLinkRow}
          >
            <Text style={styles.blueLinkText}>Add contact info</Text>
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Autofill payment forms
            </Text>
            <AnimatedSwitch 
              value={autofillPayment} 
              onValueChange={(val) => handleSwitchChange('payment', val)} 
            />
          </View>

          <Pressable 
            onPress={() => handleLinkPress('https://help.instagram.com/', 'Add payment info')} 
            style={styles.blueLinkRow}
          >
            <Text style={styles.blueLinkText}>Add payment info</Text>
          </Pressable>

          <Text style={[styles.descriptionText, { color: textGray }]}>
            Quickly fill in forms with your saved contact and payment info. Your autofill activity is used to improve ads and other parts of your Instagram experience.{' '}
            <Text 
              onPress={() => handleLinkPress('https://help.instagram.com/477434105621119/', 'Learn more')} 
              style={styles.blueLinkTextInline}
            >
              Learn more
            </Text>
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: borderCol }]} />

        {/* Section 3: Security */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Security
          </Text>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Safe website browsing
            </Text>
            <AnimatedSwitch 
              value={safeBrowsing} 
              onValueChange={(val) => handleSwitchChange('safe', val)} 
            />
          </View>

          <Text style={[styles.descriptionText, { color: textGray }]}>
            Turn on safe website browsing to get warnings when potentially unsafe sites may be trying to steal private information.{' '}
            <Text 
              onPress={() => handleLinkPress('https://help.instagram.com/477434105621119/', 'Learn more')} 
              style={styles.blueLinkTextInline}
            >
              Learn more
            </Text>
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
  blueLinkRow: {
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  blueLinkText: {
    color: '#0095F6',
    fontFamily: Fonts.regular,
    fontSize: 16.5,
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
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
