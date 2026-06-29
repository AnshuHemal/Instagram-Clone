/**
 * Sleep Mode Screen — /sleep-mode
 * Layout matches the official Instagram "Sleep mode" configuration screen.
 * Shows sleep schedule toggle, custom scrollable wheel time picker (using snappy FlatLists),
 * blue pill-shaped Choose Days checklist selector, sentence-formatted day descriptions,
 * custom modern animated Switch toggle (Reanimated), and secure store persistence.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Custom Animated Switch component (iOS-style Modern design) ──────────────

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  isDark: boolean;
}

function CustomSwitch({ value, onValueChange, isDark }: CustomSwitchProps) {
  // Translate offset of thumb circle (width of track: 50, thumb: 24, padding: 3)
  // translateX moves from 0 to (50 - 24 - 6 = 20)
  const translateX = useSharedValue(value ? 20 : 0);

  useEffect(() => {
    translateX.value = withTiming(value ? 20 : 0, { duration: 150 });
  }, [value]);

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onValueChange(!value);
      }}
      style={[
        styles.switchTrack,
        {
          backgroundColor: value
            ? '#3897F0' // Modern vibrant blue
            : (isDark ? '#262626' : '#0F1419'), // Modern black/charcoal when inactive
        }
      ]}
    >
      <Animated.View style={[styles.switchThumb, thumbAnimatedStyle]} />
    </Pressable>
  );
}

// ─── Custom ScrollPicker Wheel Subcomponent ───────────────────────────────────

interface ScrollPickerProps<T> {
  data: T[];
  selectedValue: T;
  onValueChange: (val: T) => void;
  isDark: boolean;
}

function ScrollPicker<T extends string | number>({
  data,
  selectedValue,
  onValueChange,
  isDark,
}: ScrollPickerProps<T>) {
  const ITEM_HEIGHT = 42;
  const listRef = useRef<FlatList>(null);
  
  // Pad array with empty strings for spacing margins top/bottom
  const paddedData = useMemo(() => ['', ...data, ''], [data]);

  const handleScrollEnd = (e: any) => {
    const yOffset = e.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    const selectedItem = data[index];
    if (selectedItem !== undefined && selectedItem !== selectedValue) {
      onValueChange(selectedItem);
    }
  };

  useEffect(() => {
    const targetIndex = data.indexOf(selectedValue);
    if (targetIndex !== -1) {
      // Scroll to active index on mount/change
      setTimeout(() => {
        listRef.current?.scrollToOffset({
          offset: targetIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 60);
    }
  }, [selectedValue, data]);

  return (
    <View style={{ height: ITEM_HEIGHT * 3, width: 54, overflow: 'hidden' }}>
      <FlatList
        ref={listRef}
        data={paddedData}
        keyExtractor={(item, index) => `${item}-${index}`}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        renderItem={({ item }) => {
          if (item === '') {
            return <View style={{ height: ITEM_HEIGHT }} />;
          }
          const isSelected = item === selectedValue;
          return (
            <Pressable
              onPress={() => {
                const itemIdx = data.indexOf(item as T);
                if (itemIdx !== -1) {
                  listRef.current?.scrollToOffset({
                    offset: itemIdx * ITEM_HEIGHT,
                    animated: true,
                  });
                  onValueChange(item as T);
                }
              }}
              style={{
                height: ITEM_HEIGHT,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: isSelected ? 18 : 15,
                  fontFamily: isSelected ? Fonts.semiBold : Fonts.regular,
                  color: isSelected
                    ? (isDark ? '#FFFFFF' : '#000000')
                    : (isDark ? '#555555' : '#CCCCCC'),
                }}
              >
                {typeof item === 'number' ? String(item).padStart(2, '0') : item}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SleepModeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sleepMode, setSleepMode] = useState(false);
  const [startTime, setStartTime] = useState('12:00AM');
  const [endTime, setEndTime] = useState('12:00AM');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Default all active

  // Custom Time Picker Modal States
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  
  // Temporal picker wheel selections
  const [tempHour, setTempHour] = useState(12);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempAmPm, setTempAmPm] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    // Load current setting values
    const loadSleepMode = async () => {
      try {
        const storedVal = await SecureStore.getItemAsync('sleepMode');
        if (storedVal) setSleepMode(storedVal === 'true');

        const storedStart = await SecureStore.getItemAsync('sleepStart');
        if (storedStart) setStartTime(storedStart);

        const storedEnd = await SecureStore.getItemAsync('sleepEnd');
        if (storedEnd) setEndTime(storedEnd);

        const storedDays = await SecureStore.getItemAsync('sleepDays');
        if (storedDays) {
          setSelectedDays(JSON.parse(storedDays));
        }
      } catch (e) {
        console.warn('Failed to load sleep settings:', e);
      }
    };
    loadSleepMode();
  }, []);

  const handleSave = async () => {
    haptics.success();
    try {
      await SecureStore.setItemAsync('sleepMode', String(sleepMode));
      await SecureStore.setItemAsync('sleepStart', startTime);
      await SecureStore.setItemAsync('sleepEnd', endTime);
      await SecureStore.setItemAsync('sleepDays', JSON.stringify(selectedDays));
    } catch (e) {
      console.warn('Failed to save sleep settings:', e);
    }
    router.back();
  };

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const toggleDay = (idx: number) => {
    if (!sleepMode) return; // Do nothing if sleep mode is off
    haptics.light();
    if (selectedDays.includes(idx)) {
      setSelectedDays(selectedDays.filter(d => d !== idx));
    } else {
      setSelectedDays([...selectedDays, idx].sort());
    }
  };

  // Helper to parse time string
  const parseTimeStr = (str: string) => {
    try {
      const ampm = (str.endsWith('PM') ? 'PM' : 'AM') as 'AM' | 'PM';
      const cleanStr = str.replace('AM', '').replace('PM', '');
      const [h, m] = cleanStr.split(':');
      return {
        hour: parseInt(h, 10) || 12,
        minute: parseInt(m, 10) || 0,
        ampm,
      };
    } catch {
      return { hour: 12, minute: 0, ampm: 'AM' as const };
    }
  };

  // Open the custom time picker wheel modal
  const openTimePicker = (target: 'start' | 'end') => {
    if (!sleepMode) return; // Do nothing if sleep mode is off
    setPickerTarget(target);
    const parsed = parseTimeStr(target === 'start' ? startTime : endTime);
    setTempHour(parsed.hour);
    setTempMinute(parsed.minute);
    setTempAmPm(parsed.ampm);
    setShowTimePicker(true);
  };

  // Confirm custom time picker selection
  const confirmTimeSelection = () => {
    haptics.success();
    const padMin = String(tempMinute).padStart(2, '0');
    const formatted = `${tempHour}:${padMin}${tempAmPm}`;
    if (pickerTarget === 'start') {
      setStartTime(formatted);
    } else {
      setEndTime(formatted);
    }
    setShowTimePicker(false);
  };

  // Compile active days description text sentence format
  const getDaysDesc = () => {
    if (!sleepMode) return 'Sleep mode is off.';
    if (selectedDays.length === 0) return 'Sleep mode is on, but no days are chosen.';
    if (selectedDays.length === 7) return `Sleep mode is on Sunday, Monday, Tuesday, Wednesday, Thursday, Friday and Saturday.`;

    // Format day lists (e.g. Sunday, Monday and Tuesday)
    const activeDayNames = selectedDays.map(d => DAYS_FULL[d]);
    if (activeDayNames.length === 1) {
      return `Sleep mode is on ${activeDayNames[0]}.`;
    }
    
    const allButLast = activeDayNames.slice(0, -1).join(', ');
    const last = activeDayNames[activeDayNames.length - 1];
    return `Sleep mode is on ${allButLast} and ${last}.`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header (Left-aligned title) */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Sleep mode</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        
        {/* Toggle Switch Row */}
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Sleep mode</Text>
          <CustomSwitch
            value={sleepMode}
            onValueChange={setSleepMode}
            isDark={isDark}
          />
        </View>

        {/* Subtext description */}
        <Text style={[styles.description, { color: isDark ? '#A8A8A8' : '#737373' }]}>
          Your notifications will be muted during the times you choose. People will see that you're in sleep mode.
        </Text>

        {/* Time settings (Start & End) */}
        <View style={styles.timeSection}>
          {/* Start Time Row */}
          <View style={styles.timeRow}>
            <Text style={[styles.timeLabel, { color: isDark ? '#FFFFFF' : '#000000', opacity: sleepMode ? 1 : 0.4 }]}>
              Start time
            </Text>
            <Pressable
              disabled={!sleepMode}
              onPress={() => openTimePicker('start')}
              style={[
                styles.timePill,
                {
                  backgroundColor: isDark ? '#262626' : '#F2F2F7',
                  opacity: sleepMode ? 1 : 0.4,
                }
              ]}
            >
              <Text style={[styles.timePillText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {startTime}
              </Text>
            </Pressable>
          </View>

          {/* End Time Row */}
          <View style={styles.timeRow}>
            <Text style={[styles.timeLabel, { color: isDark ? '#FFFFFF' : '#000000', opacity: sleepMode ? 1 : 0.4 }]}>
              End time
            </Text>
            <Pressable
              disabled={!sleepMode}
              onPress={() => openTimePicker('end')}
              style={[
                styles.timePill,
                {
                  backgroundColor: isDark ? '#262626' : '#F2F2F7',
                  opacity: sleepMode ? 1 : 0.4,
                }
              ]}
            >
              <Text style={[styles.timePillText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {endTime}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Days selector block */}
        <View style={styles.daysSection}>
          <Text style={[styles.daysTitle, { color: isDark ? '#FFFFFF' : '#000000', opacity: sleepMode ? 1 : 0.4 }]}>
            Choose days
          </Text>
          <View style={styles.daysRow}>
            {DAYS_SHORT.map((day, idx) => {
              const isSelected = selectedDays.includes(idx);
              return (
                <Pressable
                  key={idx}
                  disabled={!sleepMode}
                  onPress={() => toggleDay(idx)}
                  style={({ pressed }) => [
                    styles.dayBox,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(0, 149, 246, 0.15)' : '#E8F4FE')
                        : (isDark ? '#262626' : '#F2F2F7'),
                      opacity: sleepMode ? (pressed ? 0.7 : 1) : 0.4,
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isSelected && sleepMode
                          ? '#0095F6'
                          : (isDark ? '#FFFFFF' : '#000000'),
                      }
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.daysDesc, { color: isDark ? '#A8A8A8' : '#737373' }]}>
            {getDaysDesc()}
          </Text>
        </View>

        {/* Save button */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.8 : 1,
            }
          ]}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>

      </ScrollView>

      {/* ────────────────────────────────────────────────────────────────────────
          CUSTOM WHEEL-STYLE TIME PICKER DIALOG (MATCHING REFERENCED IMAGE)
      ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.wheelWrapper}>
              
              {/* Absolute divider lines behind scroll values */}
              <View style={[styles.activeIndicatorLine, { top: 42, backgroundColor: isDark ? '#444444' : '#EFEFEF' }]} />
              <View style={[styles.activeIndicatorLine, { bottom: 42, backgroundColor: isDark ? '#444444' : '#EFEFEF' }]} />

              {/* 1. Hours FlatList Column */}
              <ScrollPicker
                data={Array.from({ length: 12 }, (_, i) => i + 1)}
                selectedValue={tempHour}
                onValueChange={setTempHour}
                isDark={isDark}
              />

              {/* Colon separator */}
              <View style={styles.wheelSeparator}>
                <Text style={[styles.wheelSeparatorText, { color: isDark ? '#FFFFFF' : '#000000' }]}>:</Text>
              </View>

              {/* 2. Minutes FlatList Column */}
              <ScrollPicker
                data={Array.from({ length: 60 }, (_, i) => i)}
                selectedValue={tempMinute}
                onValueChange={setTempMinute}
                isDark={isDark}
              />

              {/* 3. AM/PM FlatList Column */}
              <ScrollPicker
                data={['AM', 'PM']}
                selectedValue={tempAmPm}
                onValueChange={setTempAmPm}
                isDark={isDark}
              />

            </View>

            {/* Bottom Actions Row */}
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setShowTimePicker(false)} style={styles.dialogBtn}>
                <Text style={styles.dialogBtnText}>CANCEL</Text>
              </Pressable>
              <Pressable onPress={confirmTimeSelection} style={styles.dialogBtn}>
                <Text style={styles.dialogBtnText}>OK</Text>
              </Pressable>
            </View>

          </View>
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
  },
  headerBackBtn: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 21,
    marginLeft: 12,
    letterSpacing: -0.4,
  },
  body: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  timeSection: {
    width: '100%',
    paddingBottom: 24,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  timePillText: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
  },
  daysSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  daysTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16.5,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  daysDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },
  saveBtn: {
    marginHorizontal: 16,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 16,
  },

  // Custom switch styling parameters
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: {
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

  // Custom Dialog Picker Overlay & Card
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogCard: {
    width: SCREEN_WIDTH * 0.76,
    borderRadius: 8,
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  wheelWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
    position: 'relative',
  },
  activeIndicatorLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.2,
    zIndex: 5,
  },
  wheelSeparator: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  wheelSeparatorText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  dialogBtn: {
    padding: 8,
  },
  dialogBtnText: {
    color: '#008080', // greenish-teal color matching image
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
});
