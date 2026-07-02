import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
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

  React.useEffect(() => {
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
export default function NotificationPreferencesScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pauseAll, setPauseAll] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [pauseUntil, setPauseUntil] = useState<Date | null>(null);

  const durationOptions = [
    { label: '15 minutes', value: 15 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '4 hours', value: 240 },
    { label: '8 hours', value: 480 },
  ];

  const handleSelectDuration = (minutes: number) => {
    haptics.light();
    const until = new Date(Date.now() + minutes * 60 * 1000);
    setPauseUntil(until);
    setPauseAll(true);
    setShowDurationModal(false);

    let durationText = `${minutes} minutes`;
    if (minutes === 60) durationText = '1 hour';
    else if (minutes > 60) durationText = `${minutes / 60} hours`;

    showToast({
      message: `Notifications paused for ${durationText}`,
      type: 'info',
    });
  };

  const handleCancelModal = () => {
    haptics.light();
    setShowDurationModal(false);
  };

  const getPauseDesc = () => {
    if (pauseAll && pauseUntil) {
      const timeStr = pauseUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `Paused until ${timeStr}`;
    }
    return 'Temporarily pause notifications';
  };

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleComingSoon = (feature: string) => {
    haptics.light();
    showToast({
      message: `${feature} configurations coming soon`,
      type: 'info',
    });
  };

  const handleSleepMode = () => {
    haptics.light();
    router.push('/sleep-mode' as any);
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const sectionTitleColor = isDark ? '#A8A8A8' : '#737373';
  const separatorBg = isDark ? '#1C1C1E' : '#F5F5F5';

  const pushOptions = [
    { id: 'posts', label: 'Posts, stories and comments' },
    { id: 'following', label: 'Following and followers' },
    { id: 'messages', label: 'Messages' },
    { id: 'calls', label: 'Calls' },
    { id: 'live', label: 'Live and reels' },
    { id: 'fundraisers', label: 'Fundraisers' },
    { id: 'from_insta', label: 'From Instagram' },
    { id: 'birthdays', label: 'Birthdays' },
    { id: 'map', label: 'Map' },
    { id: 'instants', label: 'Instants' },
    { id: 'accounts_follow', label: 'From accounts you follow' },
  ];

  const otherOptions = [
    { id: 'email', label: 'Email notifications' },
    { id: 'shopping', label: 'Shopping' },
    { id: 'voting', label: 'Voting reminders' },
  ];

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
          Notifications
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Push notifications */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
            Push notifications
          </Text>

          {/* Pause all toggle row */}
          <View style={styles.rowAlignTop}>
            <View style={styles.labelCol}>
              <Text style={[styles.rowTitle, { color: labelColor }]}>Pause all</Text>
              <Text style={[styles.rowDesc, { color: descColor }]}>
                {getPauseDesc()}
              </Text>
            </View>
            <CustomSwitch
              value={pauseAll}
              onValueChange={(val) => {
                if (val) {
                  setShowDurationModal(true);
                } else {
                  setPauseAll(false);
                  setPauseUntil(null);
                  showToast({
                    message: 'Notifications active',
                    type: 'info',
                  });
                }
              }}
              isDark={isDark}
            />
          </View>

          <View style={[styles.innerDivider, { backgroundColor: isDark ? '#262626' : '#EEEEEE' }]} />

          {/* Sleep mode row */}
          <Pressable
            onPress={handleSleepMode}
            style={({ pressed }) => [
              styles.rowAlignTop,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
            ]}
          >
            <View style={styles.labelCol}>
              <Text style={[styles.rowTitle, { color: labelColor }]}>Sleep mode</Text>
              <Text style={[styles.rowDesc, { color: descColor }]}>
                Automatically mute notifications at night or whenever you need to focus.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} style={{ marginTop: 2 }} />
          </Pressable>

          <View style={[styles.innerDivider, { backgroundColor: isDark ? '#262626' : '#EEEEEE' }]} />

          {/* Detailed Push Sub-options */}
          {pushOptions.map((item, index) => (
            <View key={item.id}>
              {index > 0 && (
                <View style={[styles.innerDivider, { backgroundColor: isDark ? '#262626' : '#EEEEEE' }]} />
              )}
              <Pressable
                onPress={() => {
                  haptics.light();
                  if (item.id === 'instants') {
                    router.push('/instants-settings' as any);
                  } else if (item.id === 'map') {
                    router.push('/map-settings' as any);
                  } else if (item.id === 'birthdays') {
                    router.push('/birthdays-settings' as any);
                  } else if (item.id === 'fundraisers') {
                    router.push('/fundraisers-settings' as any);
                  } else if (item.id === 'calls') {
                    router.push('/calls-settings' as any);
                  } else if (item.id === 'from_insta') {
                    router.push('/from-instagram-settings' as any);
                  } else if (item.id === 'accounts_follow') {
                    router.push('/accounts-follow-settings' as any);
                  } else {
                    handleComingSoon(item.label);
                  }
                }}
                style={({ pressed }) => [
                  styles.simpleRow,
                  pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
                ]}
              >
                <Text style={[styles.simpleRowLabel, { color: labelColor }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
              </Pressable>
            </View>
          ))}
        </Animated.View>

        {/* Separator block */}
        <View style={[styles.separator, { backgroundColor: separatorBg }]} />

        {/* Section 2: Other notification types */}
        <Animated.View entering={FadeInDown.delay(180).duration(300)}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
            Other notification types
          </Text>

          {otherOptions.map((item, index) => (
            <View key={item.id}>
              {index > 0 && (
                <View style={[styles.innerDivider, { backgroundColor: isDark ? '#262626' : '#EEEEEE' }]} />
              )}
              <Pressable
                onPress={() => {
                  haptics.light();
                  if (item.id === 'email') {
                    router.push('/email-notifications-settings' as any);
                  } else if (item.id === 'shopping') {
                    router.push('/shopping-settings' as any);
                  } else if (item.id === 'voting') {
                    router.push('/voting-reminders-settings' as any);
                  } else {
                    handleComingSoon(item.label);
                  }
                }}
                style={({ pressed }) => [
                  styles.simpleRow,
                  pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
                ]}
              >
                <Text style={[styles.simpleRowLabel, { color: labelColor }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
              </Pressable>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Custom Duration Selection Modal Dialog */}
      <Modal
        visible={showDurationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelModal}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={handleCancelModal}
        >
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#262626' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeaderText, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                You won't get push notifications, but you'll be able to see new notifications when you open Instagram
              </Text>
            </View>
            
            <View style={[styles.modalDivider, { backgroundColor: isDark ? '#3C3C3E' : '#EFEFEF' }]} />
            
            {durationOptions.map((opt) => (
              <View key={opt.value}>
                <Pressable
                  onPress={() => handleSelectDuration(opt.value)}
                  style={({ pressed }) => [
                    styles.modalOption,
                    pressed && { backgroundColor: isDark ? '#333333' : '#F5F5F5' }
                  ]}
                >
                  <Text style={[styles.modalOptionText, { color: isDark ? '#FFFFFF' : '#262626' }]}>
                    {opt.label}
                  </Text>
                </Pressable>
                <View style={[styles.modalDivider, { backgroundColor: isDark ? '#3C3C3E' : '#EFEFEF' }]} />
              </View>
            ))}
            
            <Pressable
              onPress={handleCancelModal}
              style={({ pressed }) => [
                styles.modalOption,
                pressed && { backgroundColor: isDark ? '#333333' : '#F5F5F5' }
              ]}
            >
              <Text style={[styles.modalOptionText, { color: isDark ? '#FFFFFF' : '#262626' }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
    paddingVertical: 14,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 10,
  },
  rowAlignTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  labelCol: {
    flex: 1,
    paddingRight: 16,
  },
  rowTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    marginBottom: 4,
  },
  rowDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },
  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  simpleRowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    flex: 1,
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  separator: {
    height: 10,
    marginVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '82%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    paddingVertical: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  modalOption: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  modalOptionText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
});
