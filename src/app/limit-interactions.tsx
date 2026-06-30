import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────
const HeroIllustration = ({ isDark }: { isDark: boolean }) => {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withTiming(1, { duration: 1200 });
  }, [pulse]);
  const circleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.85, 1]) }],
  }));
  return (
    <Animated.View style={[styles.heroContainer, circleStyle]}>
      <View style={styles.dotCircle}>
        {Array.from({ length: 32 }).map((_, i) => {
          const rad = ((i * 360) / 32) * (Math.PI / 180);
          const r = 68;
          const dotColor =
            i < 8 ? '#FFD700' : i < 16 ? '#A855F7' : i < 24 ? '#3B82F6' : '#E5E7EB';
          return (
            <View
              key={i}
              style={[
                styles.dot,
                { left: 76 + r * Math.cos(rad) - 3, top: 76 + r * Math.sin(rad) - 3, backgroundColor: dotColor },
              ]}
            />
          );
        })}
        <View style={styles.heroCenterIcon}>
          <Ionicons name="people-outline" size={32} color={isDark ? '#FFFFFF' : '#1A1A2E'} />
        </View>
        <View style={[styles.floatingIcon, { top: 14, left: 58 }]}>
          <MaterialCommunityIcons name="navigation-variant-outline" size={20} color={isDark ? '#E5E7EB' : '#374151'} />
        </View>
        <View style={[styles.floatingIcon, { top: 56, right: 10 }]}>
          <Ionicons name="at-outline" size={20} color={isDark ? '#E5E7EB' : '#374151'} />
        </View>
        <View style={[styles.floatingIcon, { bottom: 20, left: 14 }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={isDark ? '#E5E7EB' : '#374151'} />
        </View>
        <View style={[styles.floatingIcon, { bottom: 20, right: 14 }]}>
          <Ionicons name="image-outline" size={18} color={isDark ? '#E5E7EB' : '#374151'} />
        </View>
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// SHARED BOTTOM SHEET WRAPPER
// ─────────────────────────────────────────────
const SHEET_ANIM_IN = 280;
const SHEET_ANIM_OUT = 240;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  rightLabel?: string;
  onRightPress?: () => void;
  children: React.ReactNode;
  isDark: boolean;
  insets: { bottom: number };
}

const BottomSheet = ({
  visible,
  onClose,
  title,
  rightLabel,
  onRightPress,
  children,
  isDark,
  insets,
}: BottomSheetProps) => {
  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);

  const openSheet = useCallback(() => {
    translateY.value = withTiming(0, { duration: SHEET_ANIM_IN, easing: Easing.out(Easing.cubic) });
    backdropOpacity.value = withTiming(1, { duration: SHEET_ANIM_IN });
  }, [translateY, backdropOpacity]);

  const closeSheet = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: SHEET_ANIM_OUT });
    translateY.value = withTiming(
      600,
      { duration: SHEET_ANIM_OUT, easing: Easing.in(Easing.cubic) },
      (finished) => { if (finished) runOnJS(onClose)(); }
    );
  }, [translateY, backdropOpacity, onClose]);

  useEffect(() => {
    if (visible) {
      translateY.value = 600;
      openSheet();
    } else {
      translateY.value = 600;
      backdropOpacity.value = 0;
    }
  }, [visible]);

  // Drag-to-close gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 700) {
        runOnJS(closeSheet)();
      } else {
        translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const bgColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const titleColor = isDark ? '#FFFFFF' : '#000000';
  const handleColor = isDark ? '#48484A' : '#C7C7CC';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={closeSheet}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={sheetOverlayStyles.overlay}>
          {/* Backdrop tap-to-close */}
          <TouchableWithoutFeedback onPress={closeSheet}>
            <Animated.View style={[sheetOverlayStyles.backdrop, backdropStyle]} />
          </TouchableWithoutFeedback>

          {/* Sheet — translate controlled by pan gesture */}
          <Animated.View
            style={[
              sheetOverlayStyles.sheet,
              { backgroundColor: bgColor, paddingBottom: Math.max(insets.bottom, 24) },
              sheetStyle,
            ]}
          >
            {/* ── Drag zone: only handle + header intercept the pan ── */}
            <GestureDetector gesture={panGesture}>
              <View>
                {/* Handle pill */}
                <View style={[sheetOverlayStyles.handle, { backgroundColor: handleColor }]} />

                {/* Sheet Header */}
                <View style={sheetOverlayStyles.sheetHeader}>
                  {rightLabel ? <View style={{ width: 60 }} /> : null}
                  <Text style={[sheetOverlayStyles.sheetTitle, { color: titleColor }]}>{title}</Text>
                  {rightLabel ? (
                    <Pressable onPress={onRightPress} hitSlop={10}>
                      <Text style={sheetOverlayStyles.rightLabel}>{rightLabel}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </GestureDetector>

            {/* ── Scrollable content — no gesture interception ── */}
            {children}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const sheetOverlayStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  rightLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#3897EF',
    width: 60,
    textAlign: 'right',
  },
});

// ─────────────────────────────────────────────
// WHAT TO LIMIT SHEET
// ─────────────────────────────────────────────
interface WhatOptions {
  some: boolean;
  most: boolean;
}

interface WhatToLimitSheetProps {
  visible: boolean;
  onClose: () => void;
  selected: WhatOptions;
  onSelect: (key: keyof WhatOptions) => void;
  isDark: boolean;
  insets: { bottom: number };
}

const CheckboxRow = ({
  label,
  description,
  checked,
  onPress,
  isDark,
}: {
  label: string;
  description: string;
  checked: boolean;
  onPress: () => void;
  isDark: boolean;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      checkboxStyles.row,
      pressed && { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
    ]}
  >
    <View style={checkboxStyles.textWrap}>
      <Text style={[checkboxStyles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>{label}</Text>
      <Text style={[checkboxStyles.desc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{description}</Text>
    </View>
    <View
      style={[
        checkboxStyles.checkbox,
        checked
          ? { backgroundColor: '#3897EF', borderColor: '#3897EF' }
          : { backgroundColor: 'transparent', borderColor: isDark ? '#6B7280' : '#C7C7CC' },
      ]}
    >
      {checked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
    </View>
  </Pressable>
);

const checkboxStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  textWrap: { flex: 1, paddingRight: 16 },
  label: { fontFamily: Fonts.semiBold, fontSize: 15.5, marginBottom: 4, letterSpacing: -0.1 },
  desc: { fontFamily: Fonts.regular, fontSize: 13.5, lineHeight: 18 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});

const WhatToLimitSheet = ({
  visible, onClose, selected, onSelect, isDark, insets,
}: WhatToLimitSheetProps) => (
  <BottomSheet visible={visible} onClose={onClose} title="What to limit" isDark={isDark} insets={insets}>
    <View style={{ marginBottom: 12 }}>
      <CheckboxRow
        isDark={isDark}
        label="Some interactions"
        description="New comments on your content and chats from accounts you limit will be hidden."
        checked={selected.some}
        onPress={() => { haptics.light(); onSelect('some'); }}
      />
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#2C2C2E' : '#EAEAEA', marginHorizontal: 20 }} />
      <CheckboxRow
        isDark={isDark}
        label="Most interactions"
        description="Tags, mentions, story replies and content remixing will be turned off. New comments on your content and chats will also be hidden."
        checked={selected.most}
        onPress={() => { haptics.light(); onSelect('most'); }}
      />
    </View>
  </BottomSheet>
);

// ─────────────────────────────────────────────
// CUSTOM SWITCH (matches account-privacy / sleep-mode / all other screens)
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
// WHO TO LIMIT SHEET
// ─────────────────────────────────────────────
interface WhoToLimitSheetProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  insets: { bottom: number };
}

const WhoToLimitSheet = ({ visible, onClose, isDark, insets }: WhoToLimitSheetProps) => {
  const [closeFriends, setCloseFriends] = useState(false);
  const [recentFollowers, setRecentFollowers] = useState(true);
  const [nonFollowers, setNonFollowers] = useState(true);

  const divColor = isDark ? '#2C2C2E' : '#EAEAEA';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#9CA3AF' : '#6B7280';

  const rows = [
    {
      label: 'Everyone but your Close Friends',
      desc: 'There are 0 accounts on your Close Friends list.',
      link: 'Edit your list.',
      value: closeFriends,
      onToggle: () => { haptics.light(); setCloseFriends((p) => !p); },
    },
    {
      label: 'Recent followers',
      desc: 'Accounts that started following you in the past week or after you turn this on',
      link: null,
      value: recentFollowers,
      onToggle: () => { haptics.light(); setRecentFollowers((p) => !p); },
    },
    {
      label: "Accounts that don't follow you",
      desc: null,
      link: null,
      value: nonFollowers,
      onToggle: () => { haptics.light(); setNonFollowers((p) => !p); },
    },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Who to limit" isDark={isDark} insets={insets}>
      <View style={{ marginBottom: 12 }}>
        {rows.map((row, idx) => (
          <React.Fragment key={row.label}>
            {idx > 0 && (
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: divColor, marginHorizontal: 20 }} />
            )}
            <View style={whoStyles.row}>
              <View style={whoStyles.textWrap}>
                <Text style={[whoStyles.label, { color: labelColor }]}>{row.label}</Text>
                {row.desc && (
                  <Text style={[whoStyles.desc, { color: descColor }]}>
                    {row.desc}
                    {row.link ? (
                      <Text style={whoStyles.link}> {row.link}</Text>
                    ) : null}
                  </Text>
                )}
              </View>
              <CustomSwitch
                value={row.value}
                onValueChange={row.onToggle}
                isDark={isDark}
              />
            </View>
          </React.Fragment>
        ))}
      </View>
    </BottomSheet>
  );
};

const whoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  textWrap: { flex: 1, paddingRight: 16 },
  label: { fontFamily: Fonts.regular, fontSize: 16, marginBottom: 3, letterSpacing: -0.15 },
  desc: { fontFamily: Fonts.regular, fontSize: 13.5, lineHeight: 18 },
  link: { color: '#3897EF', fontFamily: Fonts.regular, fontSize: 13.5 },
});

// ─────────────────────────────────────────────
// SET REMINDER SHEET — scroll picker
// ─────────────────────────────────────────────
const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 3;                          // items shown at once
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 168
const NUMBERS = ['1', '2', '3', '4'];
const UNITS = ['day', 'week'];

const ScrollPicker = ({
  items,
  selected,
  onSelect,
  isDark,
}: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
  isDark: boolean;
}) => {
  const flatRef = useRef<FlatList<string>>(null);
  const scrollY = useSharedValue(0);
  const selectedIdx = items.indexOf(selected);

  // Pad items so first and last sit centred
  const data = ['', ...items, ''];

  useEffect(() => {
    // Scroll to initial selection after mount
    const timer = setTimeout(() => {
      flatRef.current?.scrollToOffset({
        offset: selectedIdx * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleMomentumEnd = (e: any) => {
    const rawIdx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, rawIdx));
    onSelect(items[clamped]);
    haptics.light();
    // Snap precisely
    flatRef.current?.scrollToOffset({ offset: clamped * ITEM_HEIGHT, animated: true });
  };

  const handleScrollEnd = (e: any) => {
    const rawIdx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, rawIdx));
    onSelect(items[clamped]);
  };

  const selColor = isDark ? '#FFFFFF' : '#000000';
  const dimColor = isDark ? '#48484A' : '#C7C7CC';
  const lineColor = isDark ? '#3A3A3C' : '#D1D1D6';
  const fadeColor = isDark ? '#1C1C1E' : '#F2F2F7';

  return (
    <View style={pickerStyles.pickerWrap}>
      {/* Selection highlight lines */}
      <View style={[pickerStyles.selLine, pickerStyles.lineTop, { backgroundColor: lineColor }]} />
      <View style={[pickerStyles.selLine, pickerStyles.lineBottom, { backgroundColor: lineColor }]} />

      <FlatList
        ref={flatRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleScrollEnd}
        renderItem={({ item, index }) => {
          const isSelected = item === selected;
          const isEmpty = item === '';
          return (
            <Pressable
              style={pickerStyles.pickerItem}
              onPress={() => {
                if (isEmpty) return;
                const realIdx = index - 1;
                onSelect(item);
                flatRef.current?.scrollToOffset({
                  offset: realIdx * ITEM_HEIGHT,
                  animated: true,
                });
                haptics.light();
              }}
            >
              <Text
                style={[
                  pickerStyles.pickerText,
                  {
                    color: isSelected ? selColor : dimColor,
                    fontFamily: isSelected ? Fonts.semiBold : Fonts.regular,
                    fontSize: isSelected ? 24 : 20,
                  },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Top fade */}
      <View
        style={[pickerStyles.fade, pickerStyles.fadeTop]}
        pointerEvents="none"
      >
        {[0.9, 0.7, 0.5, 0.2, 0].map((opacity, i) => (
          <View
            key={i}
            style={{ flex: 1, backgroundColor: fadeColor, opacity }}
          />
        ))}
      </View>

      {/* Bottom fade */}
      <View
        style={[pickerStyles.fade, pickerStyles.fadeBottom]}
        pointerEvents="none"
      >
        {[0, 0.2, 0.5, 0.7, 0.9].map((opacity, i) => (
          <View
            key={i}
            style={{ flex: 1, backgroundColor: fadeColor, opacity }}
          />
        ))}
      </View>
    </View>
  );
};

const pickerStyles = StyleSheet.create({
  pickerWrap: {
    width: 130,
    height: PICKER_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: {
    letterSpacing: -0.3,
  },
  selLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: StyleSheet.hairlineWidth * 1.5,
    zIndex: 3,
  },
  lineTop: { top: ITEM_HEIGHT },
  lineBottom: { top: ITEM_HEIGHT * 2 },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    zIndex: 2,
    flexDirection: 'column',
  },
  fadeTop: { top: 0 },
  fadeBottom: { bottom: 0 },
});

interface ReminderSheetProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  insets: { bottom: number };
  onDone: (label: string) => void;
}

const SetReminderSheet = ({ visible, onClose, isDark, insets, onDone }: ReminderSheetProps) => {
  const [number, setNumber] = useState('1');
  const [unit, setUnit] = useState('week');

  const bgColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const pickerBg = isDark ? '#2C2C2E' : '#F2F2F7';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Set reminder"
      rightLabel="Done"
      onRightPress={() => {
        haptics.medium();
        const num = Number(number);
        const plural = num > 1 ? 's' : '';
        onDone(`In ${number} ${unit}${plural}`);
        onClose();
      }}
      isDark={isDark}
      insets={insets}
    >
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={[reminderStyles.desc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          We'll check in to see if you want to turn this tool off, or if you want to add more time.
        </Text>

        {/* Picker area */}
        <View style={[reminderStyles.pickerArea, { backgroundColor: pickerBg }]}>
          {/* Column labels */}
          <View style={reminderStyles.labelsRow}>
            <Text style={[reminderStyles.colLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>number</Text>
            <Text style={[reminderStyles.colLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>period</Text>
          </View>

          <View style={reminderStyles.pickerRow}>
            <ScrollPicker
              items={NUMBERS}
              selected={number}
              onSelect={setNumber}
              isDark={isDark}
            />
            <ScrollPicker
              items={UNITS}
              selected={unit}
              onSelect={setUnit}
              isDark={isDark}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
};

const reminderStyles = StyleSheet.create({
  desc: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    marginBottom: 20,
  },
  pickerArea: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  colLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    width: 120,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

// ─────────────────────────────────────────────
// INFO ROW (tappable)
// ─────────────────────────────────────────────
interface InfoRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isDark: boolean;
  delay: number;
  onPress: () => void;
}

const InfoRow = ({ icon, title, subtitle, isDark, delay, onPress }: InfoRowProps) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.infoRow,
        pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
      ]}
    >
      <View style={styles.infoIconWrap}>{icon}</View>
      <View style={styles.infoTextWrap}>
        <Text style={[styles.infoTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>{title}</Text>
        <Text style={[styles.infoSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
    </Pressable>
  </Animated.View>
);

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function LimitInteractionsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isOn, setIsOn] = useState(false);
  const [whatSelected, setWhatSelected] = useState<WhatOptions>({ some: false, most: true });
  const [reminderLabel, setReminderLabel] = useState('In 1 week');

  const [showWhatSheet, setShowWhatSheet] = useState(false);
  const [showWhoSheet, setShowWhoSheet] = useState(false);
  const [showReminderSheet, setShowReminderSheet] = useState(false);

  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  const handleBack = () => { haptics.light(); router.back(); };

  const handleToggle = () => {
    buttonScale.value = withSpring(0.96, { damping: 12 }, () => {
      buttonScale.value = withSpring(1, { damping: 12 });
    });
    haptics.medium();
    setIsOn((prev) => {
      const next = !prev;
      showToast({ message: next ? 'Limit interactions turned on' : 'Limit interactions turned off', type: next ? 'success' : 'info' });
      return next;
    });
  };

  let whatSubtitle = 'None selected';
  if (whatSelected.most) {
    whatSubtitle = 'Most interactions, including comments, messages, story replies, tags and mentions';
  } else if (whatSelected.some) {
    whatSubtitle = 'New comments and chats from limited accounts will be hidden';
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' },
        ]}
      >
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Limit interactions
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <HeroIllustration isDark={isDark} />

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.headlineBlock}>
          <Text style={[styles.headline, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Limit interactions from people who are bothering you
          </Text>
          <Text style={[styles.headlineDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Temporarily limit people's ability to interact with you through messages, comments, tagging and more.
          </Text>
        </Animated.View>

        <View style={styles.rowsContainer}>
          <View style={[styles.rowsDivider, { backgroundColor: isDark ? '#2C2C2E' : '#EAEAEA' }]} />

          <InfoRow
            delay={160}
            isDark={isDark}
            icon={<Ionicons name="chatbubble-ellipses-outline" size={22} color={isDark ? '#AAAAAA' : '#6B7280'} />}
            title="What will be limited"
            subtitle={whatSubtitle}
            onPress={() => { haptics.light(); setShowWhatSheet(true); }}
          />

          <View style={[styles.rowsDivider, { backgroundColor: isDark ? '#2C2C2E' : '#EAEAEA' }]} />

          <InfoRow
            delay={220}
            isDark={isDark}
            icon={<Ionicons name="person-outline" size={22} color={isDark ? '#AAAAAA' : '#6B7280'} />}
            title="Who will be limited"
            subtitle="Recent followers and accounts that don't follow you"
            onPress={() => { haptics.light(); setShowWhoSheet(true); }}
          />

          <View style={[styles.rowsDivider, { backgroundColor: isDark ? '#2C2C2E' : '#EAEAEA' }]} />

          <InfoRow
            delay={280}
            isDark={isDark}
            icon={<Ionicons name="alarm-outline" size={22} color={isDark ? '#AAAAAA' : '#6B7280'} />}
            title="When we'll remind you to turn this off"
            subtitle={reminderLabel}
            onPress={() => { haptics.light(); setShowReminderSheet(true); }}
          />

          <View style={[styles.rowsDivider, { backgroundColor: isDark ? '#2C2C2E' : '#EAEAEA' }]} />
        </View>
      </ScrollView>

      {/* Floating Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom === 0 ? 32 : insets.bottom + 12,
            borderTopColor: isDark ? '#2C2C2E' : '#F0F0F0',
          },
        ]}
      >
        <Animated.View style={[buttonStyle, { alignSelf: 'stretch' }]}>
          <Pressable
            onPress={handleToggle}
            style={[styles.actionButton, { backgroundColor: isOn ? '#EF4444' : '#3897EF' }]}
          >
            <Text style={styles.actionButtonText}>{isOn ? 'Turn off' : 'Turn on'}</Text>
          </Pressable>
        </Animated.View>
        <Text style={[styles.footerNote, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
          We won't let people know you've turned this on.
        </Text>
      </View>

      {/* Bottom Sheets */}
      <WhatToLimitSheet
        visible={showWhatSheet}
        onClose={() => setShowWhatSheet(false)}
        selected={whatSelected}
        onSelect={(key) => {
          setWhatSelected((prev) => ({ ...prev, [key]: !prev[key] }));
        }}
        isDark={isDark}
        insets={insets}
      />
      <WhoToLimitSheet
        visible={showWhoSheet}
        onClose={() => setShowWhoSheet(false)}
        isDark={isDark}
        insets={insets}
      />
      <SetReminderSheet
        visible={showReminderSheet}
        onClose={() => setShowReminderSheet(false)}
        isDark={isDark}
        insets={insets}
        onDone={(label) => setReminderLabel(label)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  backBtn: { position: 'absolute', left: 12, bottom: 8, padding: 6, zIndex: 10 },
  headerTitle: { fontFamily: Fonts.semiBold, fontSize: 19.5, letterSpacing: -0.4 },
  scroll: { paddingTop: 8 },
  heroContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28 },
  dotCircle: { width: 152, height: 152, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, position: 'absolute' },
  heroCenterIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  floatingIcon: { position: 'absolute' },
  headlineBlock: { paddingHorizontal: 20, paddingBottom: 24 },
  headline: { fontFamily: Fonts.semiBold, fontSize: 22, lineHeight: 30, letterSpacing: -0.4, marginBottom: 10 },
  headlineDesc: { fontFamily: Fonts.regular, fontSize: 14.5, lineHeight: 20 },
  rowsContainer: {},
  rowsDivider: { height: StyleSheet.hairlineWidth },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  infoIconWrap: { width: 32, alignItems: 'center', marginRight: 14 },
  infoTextWrap: { flex: 1, marginRight: 8 },
  infoTitle: { fontFamily: Fonts.regular, fontSize: 15.5, marginBottom: 3, letterSpacing: -0.1 },
  infoSubtitle: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 17 },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: { fontFamily: Fonts.semiBold, fontSize: 16, color: '#FFFFFF', letterSpacing: -0.2 },
  footerNote: { fontFamily: Fonts.regular, fontSize: 13, textAlign: 'center' },
});
