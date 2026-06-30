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
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function SecurityAlertsControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [deviceAlerts, setDeviceAlerts] = useState(false);
  const [contactAlerts, setContactAlerts] = useState(false);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleLearnMore = () => {
    haptics.light();
    showToast({
      message: 'End-to-end encryption keys verify your conversations remain private.',
      type: 'info',
    });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const sectionHeaderColor = isDark ? '#A8A8A8' : '#737373';

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
          Security alerts
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionHeaderColor }]}>
            Manage security alerts
          </Text>

          <View style={styles.card}>
            {/* Device alerts */}
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: labelColor }]}>Your devices or keys change</Text>
              <CustomSwitch
                value={deviceAlerts}
                onValueChange={(val) => {
                  setDeviceAlerts(val);
                  showToast({
                    message: val ? 'Device security alerts active' : 'Device security alerts muted',
                    type: 'info',
                  });
                }}
                isDark={isDark}
              />
            </View>

            <View style={[styles.innerDivider, { backgroundColor: isDark ? '#1C1C1E' : '#EEEEEE' }]} />

            {/* Contact alerts */}
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: labelColor }]}>Contacts' devices or keys change</Text>
              <CustomSwitch
                value={contactAlerts}
                onValueChange={(val) => {
                  setContactAlerts(val);
                  showToast({
                    message: val ? 'Contact security alerts active' : 'Contact security alerts muted',
                    type: 'info',
                  });
                }}
                isDark={isDark}
              />
            </View>
          </View>

          <Text style={[styles.footerText, { color: descColor }]}>
            Show alerts when you or your contacts log in on a new device or change keys. Alerts for contacts will appear in your chat with them.
            <Text style={styles.learnMore} onPress={handleLearnMore}> Learn more</Text>
          </Text>
        </Animated.View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 0,
  },
  scroll: {
    paddingVertical: 20,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    flex: 1,
    paddingRight: 16,
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  footerText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  learnMore: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    color: '#0095F6',
  },
});
