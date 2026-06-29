/**
 * Time Management Screen — /time-management
 * Rebuilt to match the modern Instagram "Time management" dashboard layout.
 * Includes interactive weekly average chart (with entry animations), detailed time descriptions,
 * info modal, daily limit configuration picker, and sleep mode scheduler.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  SlideInDown,
  SlideOutDown,
  FadeIn,
} from 'react-native-reanimated';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TimeManagementScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen Options States
  const [dailyLimit, setDailyLimit] = useState<'Off' | '15m' | '30m' | '45m' | '1h' | '2h'>('Off');
  const [sleepMode, setSleepMode] = useState(false);
  const [sleepStart, setSleepStart] = useState('12:00AM');
  const [sleepEnd, setSleepEnd] = useState('12:00AM');

  // Modal Visibility States
  const [showInfo, setShowInfo] = useState(false);

  // Tooltip Interactive State
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  // Bar Chart Height Animation Scale
  const animScale = useSharedValue(0);

  // Fetch updated settings from SecureStore on focus
  const loadSettings = async () => {
    try {
      const storedLimit = await SecureStore.getItemAsync('dailyLimit');
      if (storedLimit) setDailyLimit(storedLimit as any);

      const storedSleep = await SecureStore.getItemAsync('sleepMode');
      if (storedSleep) setSleepMode(storedSleep === 'true');

      const storedStart = await SecureStore.getItemAsync('sleepStart');
      if (storedStart) setSleepStart(storedStart);

      const storedEnd = await SecureStore.getItemAsync('sleepEnd');
      if (storedEnd) setSleepEnd(storedEnd);
    } catch (e) {
      console.warn('Failed to load screen time settings:', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  useEffect(() => {
    // Trigger animation of chart bars on mount
    animScale.value = 0;
    animScale.value = withTiming(1, { duration: 1000 });
  }, []);

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  // Helper to compile style of chart bars dynamically
  const getAnimatedBarProps = (targetHeightPct: number) => {
    return useAnimatedStyle(() => {
      return {
        height: `${targetHeightPct * animScale.value}%`,
      };
    });
  };

  // Format minutes helper for tooltip display
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  // Mock screen time stats
  const chartData = [
    { day: 'Tue', val: 12, target: 12 },
    { day: 'Wed', val: 68, target: 45 },
    { day: 'Thu', val: 2, target: 2 },
    { day: 'Fri', val: 80, target: 52 },
    { day: 'Sat', val: 149, target: 95 }, // 149 mins is exactly 2h 29m
    { day: 'Sun', val: 68, target: 45 },
    { day: 'Today', val: 5, target: 5, bold: true },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Time management</Text>
        <Pressable onPress={() => { haptics.light(); setShowInfo(true); }} hitSlop={12} style={styles.headerInfoBtn}>
          <Feather name="info" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        
        {/* ─── DAILY AVERAGE SUMMARY ─── */}
        <View style={styles.summaryContainer}>
          <Text style={[styles.averageLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>58m</Text>
          <Text style={[styles.averageSubtitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Daily average</Text>
          <Text style={[styles.averageDescription, { color: isDark ? '#A8A8A8' : '#737373' }]}>
            Average time you spent per day using Instagram on this device in the last week. Learn more about{' '}
            <Text
              style={styles.linkText}
              onPress={() => Alert.alert('Balancing Time', 'Tips for balanced device usage: set boundaries, utilize sleep reminders, and schedule screen-free blocks.')}
            >
              balancing your time online
            </Text>
            .
          </Text>
        </View>

        {/* ─── VISUAL BAR CHART ─── */}
        <View style={styles.chartOuterContainer}>
          <View style={styles.chartWrapper}>
            {chartData.map((item, idx) => (
              <View key={item.day} style={styles.chartCol}>
                <Pressable
                  onPressIn={() => {
                    haptics.light();
                    setSelectedBar(idx);
                  }}
                  onPressOut={() => {
                    setSelectedBar(null);
                  }}
                  style={styles.chartTrack}
                >
                  {selectedBar === idx && (
                    <Animated.View
                      entering={FadeIn.duration(150)}
                      style={[
                        styles.tooltipContainer,
                        {
                          backgroundColor: isDark ? '#262626' : '#FFFFFF',
                          borderColor: isDark ? '#3A3A3C' : '#EFEFEF',
                          bottom: 110 * (item.target / 100) + 6, // dynamic float spacing above the bar
                        }
                      ]}
                    >
                      <Text style={[styles.tooltipText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        {formatTime(item.val)}
                      </Text>
                    </Animated.View>
                  )}
                  <Animated.View
                    style={[
                      styles.chartFill,
                      getAnimatedBarProps(item.target),
                    ]}
                  />
                </Pressable>
                <Text style={[styles.chartDay, item.bold && styles.chartDayBold, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {item.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Divider Band */}
        <View style={[styles.separatorBand, { backgroundColor: isDark ? '#121212' : '#F2F2F7' }]} />

        {/* ─── OPTIONS LIST ─── */}
        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>Manage your time</Text>
          
          <View style={styles.sectionItems}>
            {/* Row 1: Daily limit */}
            <Pressable
              onPress={() => {
                haptics.light();
                router.push('/daily-limit' as any);
              }}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? (isDark ? '#1A1A1A' : '#F5F5F5') : 'transparent' }
              ]}
            >
              <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Daily limit</Text>
              <Text style={[styles.rowValue, { color: isDark ? '#A8A8A8' : '#8E8E8F' }]}>
                {dailyLimit === 'Off' ? 'Off' : dailyLimit}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#8E8E8F" style={{ marginLeft: 6 }} />
            </Pressable>

            {/* Row 2: Sleep mode */}
            <Pressable
              onPress={() => {
                haptics.light();
                router.push('/sleep-mode' as any);
              }}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? (isDark ? '#1A1A1A' : '#F5F5F5') : 'transparent' }
              ]}
            >
              <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Sleep mode</Text>
              <Text style={[styles.rowValue, { color: isDark ? '#A8A8A8' : '#8E8E8F' }]}>
                {sleepMode ? `${sleepStart} - ${sleepEnd}` : 'Off'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#8E8E8F" style={{ marginLeft: 6 }} />
            </Pressable>
          </View>
        </View>

      </ScrollView>

      {/* ────────────────────────────────────────────────────────────────────────
          DETAIL OVERLAY PICKERS (MODAL SHEETS)
      ──────────────────────────────────────────────────────────────────────── */}

      {/* 1. Info Sheet */}
      <Modal visible={showInfo} animationType="slide" transparent={true} onRequestClose={() => setShowInfo(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.dismissOverlay} onPress={() => setShowInfo(false)} />
          <Animated.View entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown} style={[styles.sheetContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={[styles.grabber, { backgroundColor: isDark ? '#3A3A3C' : '#E0E0E0' }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>How screen time is tracked</Text>
              <Pressable onPress={() => setShowInfo(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </Pressable>
            </View>
            <View style={styles.sheetBody}>
              <Text style={[styles.infoParagraph, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                This dashboard tracks the time you spend actively using the Instagram app on this specific device.
              </Text>
              <Text style={[styles.infoParagraph, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                Background activity, multitasking screens, or notification interactions are not included in this count.
              </Text>
              <Pressable onPress={() => setShowInfo(false)} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.actionBtnText}>Got it</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
    position: 'relative',
  },
  headerBackBtn: {
    position: 'absolute',
    left: 12,
    bottom: 8,
    padding: 6,
    zIndex: 10,
  },
  headerInfoBtn: {
    position: 'absolute',
    right: 12,
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

  // Summary Container
  summaryContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'flex-start',
  },
  averageLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 48,
    lineHeight: 52,
    marginBottom: 4,
  },
  averageSubtitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    marginBottom: 12,
  },
  averageDescription: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
  },
  linkText: {
    color: '#0095F6',
    fontFamily: Fonts.medium,
  },

  // Chart Container
  chartOuterContainer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  chartCol: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 48) / 7,
    position: 'relative',
  },
  tooltipContainer: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  tooltipText: {
    fontSize: 12.5,
    fontFamily: Fonts.semiBold,
  },
  chartTrack: {
    height: 110,
    width: ((SCREEN_WIDTH - 48) / 7) - 6,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartFill: {
    width: '100%',
    backgroundColor: '#D300C5', // Instagram neon magenta color
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  chartDay: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  chartDayBold: {
    fontFamily: Fonts.semiBold,
  },

  // Divider Band
  separatorBand: {
    height: 8,
    width: '100%',
  },

  // Options List Section
  optionsSection: {
    paddingTop: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  sectionItems: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 14,
  },
  rowLabel: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16.5,
  },
  rowValue: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
  },

  // Modal Sheet Components
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    maxHeight: SCREEN_HEIGHT * 0.85,
    width: '100%',
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
  },
  sheetTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 17.5,
  },
  closeBtn: {
    padding: 4,
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  infoParagraph: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 15.5,
  },

  // Picker Grid style
  pickerGrid: {
    gap: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  pickerRowText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15.5,
  },

  // Sleep scheduling toggle & picker
  sleepToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
    marginBottom: 16,
  },
  sleepToggleLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15.5,
    marginBottom: 4,
  },
  sleepToggleDesc: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    lineHeight: 17,
  },
  timeSettingsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timePickerBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    marginBottom: 4,
  },
  timePickerVal: {
    fontFamily: Fonts.semiBold,
    fontSize: 15.5,
  },
});
