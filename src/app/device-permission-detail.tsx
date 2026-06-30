import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

interface PermissionConfig {
  title: string;
  isLocation: boolean;
  
  // Location specific fields
  locationCurrentTitle?: string;
  locationCurrentDesc?: string;
  locationSubtext?: string;
  locationOtherTitle?: string;
  locationOtherDesc?: string;

  // General permission fields
  currentStatus?: string;
  currentDesc?: string;
  otherOption?: string;
  otherDesc?: string;

  howWeUseText: string;
  howWeUseUrl: string;
  buttonLabel: string;
}

export default function DevicePermissionDetailScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const permissionId = params.id || 'camera';

  const configs: Record<string, PermissionConfig> = {
    camera: {
      title: 'Camera',
      isLocation: false,
      currentStatus: 'Not allowed',
      currentDesc: "Instagram is not allowed to access this device's camera.",
      otherOption: 'Allowed',
      otherDesc: "Instagram is allowed to access this device's camera.",
      howWeUseText: "How we use your device's camera",
      howWeUseUrl: 'https://help.instagram.com/477434105621119/',
      buttonLabel: 'Update device settings',
    },
    contacts: {
      title: 'Contacts',
      isLocation: false,
      currentStatus: 'Allowed',
      currentDesc: "Instagram is allowed to access this device's contacts.",
      otherOption: 'Not allowed',
      otherDesc: "Instagram is not allowed to access this device's contacts.",
      howWeUseText: "How we use your device's contacts",
      howWeUseUrl: 'https://help.instagram.com/477434105621119/',
      buttonLabel: 'Update device settings',
    },
    location: {
      title: 'Location Services',
      isLocation: true,
      locationCurrentTitle: 'Your device settings',
      locationCurrentDesc: "You don't allow location access and we won't receive location information from Location Services. We'll still use things like your activity on our products and information about the network you connect your device to, including your IP address, to estimate your general location.",
      locationSubtext: 'Turn on Location Services to allow Instagram to access your location.',
      locationOtherTitle: 'If you choose to allow location access',
      locationOtherDesc: 'We may receive information about your precise location through things like: your GPS location, Bluetooth, and Wi-Fi connections.',
      howWeUseText: "How we use your device's location",
      howWeUseUrl: 'https://help.instagram.com/477434105621119/',
      buttonLabel: 'Turn on Location Services',
    },
    microphone: {
      title: 'Microphone',
      isLocation: false,
      currentStatus: 'Not allowed',
      currentDesc: "Instagram is not allowed to access this device's microphone.",
      otherOption: 'Allowed',
      otherDesc: "Instagram is allowed to access this device's microphone.",
      howWeUseText: "How we use your device's microphone",
      howWeUseUrl: 'https://help.instagram.com/477434105621119/',
      buttonLabel: 'Update device settings',
    },
    notifications: {
      title: 'Notifications',
      isLocation: false,
      currentStatus: 'Allowed',
      currentDesc: 'Instagram is allowed to deliver push notifications to this device.',
      otherOption: 'Not allowed',
      otherDesc: 'Instagram is not allowed to deliver push notifications to this device.',
      howWeUseText: "How we use your device's notifications",
      howWeUseUrl: 'https://help.instagram.com/477434105621119/',
      buttonLabel: 'Update device settings',
    },
    photos: {
      title: 'Photos and videos',
      isLocation: false,
      currentStatus: 'Allowed · All',
      currentDesc: 'Instagram is allowed to access all photos and videos on this device.',
      otherOption: 'Not allowed',
      otherDesc: 'Instagram is not allowed to access photos and videos on this device.',
      howWeUseText: "How we use your device's photos and videos",
      howWeUseUrl: 'https://help.instagram.com/477434105621119/',
      buttonLabel: 'Update device settings',
    },
  };

  const config = configs[permissionId] || configs.camera;

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleLinkPress = () => {
    haptics.light();
    showToast({ message: 'Opening Help Center...', type: 'info' });
    Linking.openURL(config.howWeUseUrl).catch(() => {
      showToast({ message: 'Could not open help link.', type: 'error' });
    });
  };

  const handleOpenSettings = () => {
    haptics.success();
    showToast({ message: 'Redirecting to device settings...', type: 'info' });
    Linking.openSettings().catch(() => {
      showToast({ message: 'Could not open system settings.', type: 'error' });
    });
  };

  const textGray = isDark ? '#A8A8A8' : '#737373';
  const labelGray = isDark ? '#8E8E8F' : '#666666';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>{config.title}</Text>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {config.isLocation ? (
          // Location Specific Layout
          <View style={styles.contentSection}>
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <Text style={[styles.subHeader, { color: labelGray }]}>{config.locationCurrentTitle}</Text>
              <Text style={[styles.bodyText, { color: isDark ? '#FFFFFF' : '#000000', marginBottom: 12 }]}>
                {config.locationCurrentDesc}
              </Text>
              <Text style={[styles.bodyText, { color: textGray, marginBottom: 24 }]}>
                {config.locationSubtext}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(180).duration(400)}>
              <Text style={[styles.subHeader, { color: labelGray }]}>{config.locationOtherTitle}</Text>
              <Text style={[styles.bodyText, { color: isDark ? '#FFFFFF' : '#000000', marginBottom: 24 }]}>
                {config.locationOtherDesc}
              </Text>
            </Animated.View>
          </View>
        ) : (
          // General Permission Layout
          <View style={styles.contentSection}>
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <Text style={[styles.subHeader, { color: labelGray }]}>Your device is set to</Text>
              <Text style={[styles.statusLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>{config.currentStatus}</Text>
              <Text style={[styles.bodyText, { color: textGray, marginBottom: 24 }]}>
                {config.currentDesc}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(180).duration(400)}>
              <Text style={[styles.subHeader, { color: labelGray }]}>Other option</Text>
              <Text style={[styles.statusLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>{config.otherOption}</Text>
              <Text style={[styles.bodyText, { color: textGray, marginBottom: 24 }]}>
                {config.otherDesc}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(240).duration(400)}>
              <Text style={[styles.bodyText, { color: textGray, marginBottom: 24 }]}>
                To update your permissions go to your device settings.
              </Text>
            </Animated.View>
          </View>
        )}

        {/* Dynamic Help Center Link */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Pressable onPress={handleLinkPress} style={styles.linkButton}>
            <Text style={styles.linkText}>{config.howWeUseText}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Floating Bottom Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom === 0 ? 72 : insets.bottom + 16 }]}>
        <Pressable 
          onPress={handleOpenSettings}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && { opacity: 0.85 }
          ]}
        >
          <Text style={styles.actionButtonText}>{config.buttonLabel}</Text>
        </Pressable>
      </View>
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
    paddingHorizontal: 20,
    paddingBottom: 100, // Leave room for absolute footer
  },
  contentSection: {
    marginBottom: 8,
  },
  subHeader: {
    fontFamily: Fonts.medium,
    fontSize: 14.5,
    marginBottom: 10,
    textTransform: 'none',
  },
  statusLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    marginBottom: 6,
  },
  bodyText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20.5,
  },
  linkButton: {
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  linkText: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    color: '#0095F6',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: '#3897EF',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
