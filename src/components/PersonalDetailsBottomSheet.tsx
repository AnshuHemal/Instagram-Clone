import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_OFFSCREEN = SCREEN_HEIGHT;
const DISMISS_THRESHOLD = 80;

// ─── Types ────────────────────────────────────────────────────────────────────

type SheetView = 'main' | 'birthday' | 'edit-birthday';

interface PersonalDetailsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Drum Roll Picker ─────────────────────────────────────────────────────────

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface DrumPickerProps {
  items: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  isDark: boolean;
  colors: any;
}

const DrumPicker: React.FC<DrumPickerProps> = ({ items, selectedIndex, onIndexChange, isDark, colors }) => {
  const scrollRef = useRef<ScrollView>(null);
  const [localIndex, setLocalIndex] = useState(selectedIndex);

  useEffect(() => {
    setLocalIndex(selectedIndex);
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
  }, [selectedIndex]);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    setLocalIndex(clampedIndex);
  };

  const handleScrollEnd = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    setLocalIndex(clampedIndex);
    onIndexChange(clampedIndex);
    scrollRef.current?.scrollTo({ y: clampedIndex * ITEM_HEIGHT, animated: true });
  };

  const accentColor = isDark ? '#3B82F6' : '#1D4ED8';
  const textMuted = isDark ? '#555' : '#CCC';

  return (
    <View style={[drumStyles.container, { height: PICKER_HEIGHT }]}>
      {/* Selection highlight */}
      <View
        pointerEvents="none"
        style={[
          drumStyles.selectionHighlight,
          { borderColor: isDark ? 'rgba(59,130,246,0.35)' : 'rgba(29,78,216,0.20)', backgroundColor: isDark ? 'rgba(59,130,246,0.10)' : 'rgba(29,78,216,0.06)' },
        ]}
      />
      {/* Top fade */}
      <View pointerEvents="none" style={[drumStyles.fadeTop, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]} />
      {/* Bottom fade */}
      <View pointerEvents="none" style={[drumStyles.fadeBottom, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      >
        {items.map((item, index) => {
          const isSelected = index === localIndex;
          return (
            <Pressable
              key={item}
              style={[drumStyles.item, { height: ITEM_HEIGHT }]}
              onPress={() => {
                setLocalIndex(index);
                onIndexChange(index);
                scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
              }}
            >
              <ThemedText
                style={[
                  drumStyles.itemText,
                  { color: isSelected ? accentColor : textMuted, fontFamily: isSelected ? Fonts.bold : Fonts.regular, fontSize: isSelected ? 20 : 16, opacity: isSelected ? 1 : 0.6 },
                ]}
              >
                {item}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const drumStyles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRadius: 12,
    zIndex: 1,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    zIndex: 2,
    opacity: 0.85,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    zIndex: 2,
    opacity: 0.85,
  },
});

// ─── Constants for date picker ─────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 120 }, (_, i) => String(currentYear - i));

function parseBirthday(dateString?: string): { monthIndex: number; dayIndex: number; yearIndex: number } {
  if (!dateString) {
    return { monthIndex: 0, dayIndex: 0, yearIndex: 25 };
  }
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { monthIndex: 0, dayIndex: 0, yearIndex: 25 };
    const monthIndex = d.getMonth();
    const dayIndex = d.getDate() - 1;
    const year = d.getFullYear();
    const yearIndex = YEARS.indexOf(String(year));
    return { monthIndex, dayIndex, yearIndex: yearIndex >= 0 ? yearIndex : 25 };
  } catch {
    return { monthIndex: 0, dayIndex: 0, yearIndex: 25 };
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return 'Not set';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Not set';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Not set';
  }
}

function getAge(dateString?: string): number | null {
  if (!dateString) return null;
  try {
    const birth = new Date(dateString);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export const PersonalDetailsBottomSheet: React.FC<PersonalDetailsBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { user, updateBirthday } = useAuth();
  const { showToast } = useToast();

  // Navigation state
  const [currentView, setCurrentView] = useState<SheetView>('main');
  const [isSaving, setIsSaving] = useState(false);

  // Date picker state
  const parsed = parseBirthday(user?.birthday);
  const [selectedMonth, setSelectedMonth] = useState(parsed.monthIndex);
  const [selectedDay, setSelectedDay] = useState(parsed.dayIndex);
  const [selectedYear, setSelectedYear] = useState(parsed.yearIndex);

  // Reset date picker when opening
  useEffect(() => {
    if (visible) {
      const p = parseBirthday(user?.birthday);
      setSelectedMonth(p.monthIndex);
      setSelectedDay(p.dayIndex);
      setSelectedYear(p.yearIndex);
      setCurrentView('main');
    }
  }, [visible, user?.birthday]);

  // ─── Sheet animation ──────────────────────────────────────────────────────
  const translateY = useSharedValue(SHEET_OFFSCREEN);
  const backdropOpacity = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) setShouldRender(true);
  }, [visible]);

  const openSheet = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    translateY.value = withSpring(0, { damping: 22, stiffness: 160, mass: 0.9 });
  }, []);

  const closeSheet = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 220 });
    translateY.value = withTiming(SHEET_OFFSCREEN, { duration: 240, easing: Easing.in(Easing.ease) }, (finished) => {
      if (finished) runOnJS(setShouldRender)(false);
    });
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (visible) { openSheet(); } else if (!visible && shouldRender) { closeSheet(); }
  }, [visible, shouldRender, openSheet, closeSheet]);

  const panGesture = Gesture.Pan()
    .onBegin(() => { dragStartY.value = translateY.value; })
    .onUpdate((event) => { translateY.value = Math.max(0, dragStartY.value + event.translationY); })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 700) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  // ─── Birthday save ────────────────────────────────────────────────────────
  const handleSaveBirthday = async () => {
    setIsSaving(true);
    try {
      const month = selectedMonth + 1;
      const day = selectedDay + 1;
      const year = parseInt(YEARS[selectedYear]);
      const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const success = await updateBirthday(isoDate);
      if (success) {
        showToast({ message: 'Birthday updated successfully!', type: 'success' });
        setCurrentView('birthday');
      } else {
        showToast({ message: 'Failed to update birthday. Try again.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Colors ───────────────────────────────────────────────────────────────
  const sheetBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBg = isDark ? '#262629' : '#FFFFFF';
  const borderColor = isDark ? '#2C2C2E' : '#EAEAEA';
  const textColor = colors.text;
  const textSecondaryColor = isDark ? '#8E8E93' : '#737373';
  const accentColor = '#0064E0';

  if (!shouldRender || !user) return null;

  // ─── View: Edit Birthday ──────────────────────────────────────────────────
  const renderEditBirthday = () => (
    <Animated.View
      key="edit-birthday"
      entering={SlideInRight.duration(280).springify()}
      exiting={SlideOutRight.duration(220)}
      style={StyleSheet.absoluteFill}
    >
      <View style={[styles.sheet, { backgroundColor: sheetBg, height: SCREEN_HEIGHT * 0.88, bottom: 0, left: 0, right: 0, position: 'absolute' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={() => setCurrentView('birthday')} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Edit Birthday</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Info block */}
          <View style={[editBdStyles.infoCard, { backgroundColor: isDark ? '#262629' : '#F5F5F5', borderColor }]}>
            <MaterialCommunityIcons name="cake-variant-outline" size={22} color={accentColor} style={{ marginRight: 10 }} />
            <ThemedText style={[editBdStyles.infoText, { color: textSecondaryColor }]}>
              Your birthday is used to calculate your age and is not shown publicly unless you choose to share it.
            </ThemedText>
          </View>

          {/* Picker label */}
          <ThemedText style={[editBdStyles.pickerLabel, { color: textColor }]}>Select your birthday</ThemedText>

          {/* Date picker row */}
          <View style={[editBdStyles.pickerRow, { borderColor }]}>
            {/* Month */}
            <View style={editBdStyles.pickerCol}>
              <ThemedText style={[editBdStyles.colLabel, { color: textSecondaryColor }]}>Month</ThemedText>
              <DrumPicker
                items={MONTHS}
                selectedIndex={selectedMonth}
                onIndexChange={setSelectedMonth}
                isDark={isDark}
                colors={colors}
              />
            </View>

            {/* Divider */}
            <View style={[editBdStyles.colDivider, { backgroundColor: borderColor }]} />

            {/* Day */}
            <View style={[editBdStyles.pickerCol, { flex: 0.6 }]}>
              <ThemedText style={[editBdStyles.colLabel, { color: textSecondaryColor }]}>Day</ThemedText>
              <DrumPicker
                items={DAYS}
                selectedIndex={selectedDay}
                onIndexChange={setSelectedDay}
                isDark={isDark}
                colors={colors}
              />
            </View>

            {/* Divider */}
            <View style={[editBdStyles.colDivider, { backgroundColor: borderColor }]} />

            {/* Year */}
            <View style={[editBdStyles.pickerCol, { flex: 0.85 }]}>
              <ThemedText style={[editBdStyles.colLabel, { color: textSecondaryColor }]}>Year</ThemedText>
              <DrumPicker
                items={YEARS}
                selectedIndex={selectedYear}
                onIndexChange={setSelectedYear}
                isDark={isDark}
                colors={colors}
              />
            </View>
          </View>

          {/* Selected preview */}
          <View style={[editBdStyles.previewCard, { backgroundColor: isDark ? '#262629' : '#F5F7FF', borderColor: isDark ? '#3B82F6' + '44' : '#1D4ED8' + '22' }]}>
            <ThemedText style={[editBdStyles.previewLabel, { color: textSecondaryColor }]}>Selected date</ThemedText>
            <ThemedText style={[editBdStyles.previewDate, { color: accentColor }]}>
              {`${MONTHS[selectedMonth]} ${parseInt(DAYS[selectedDay])}, ${YEARS[selectedYear]}`}
            </ThemedText>
          </View>

          {/* Save button */}
          <Pressable
            style={[editBdStyles.saveBtn, { backgroundColor: isSaving ? (isDark ? '#333' : '#CCC') : accentColor }]}
            onPress={handleSaveBirthday}
            disabled={isSaving}
          >
            {isSaving ? (
              <ThemedText style={editBdStyles.saveBtnText}>Saving...</ThemedText>
            ) : (
              <ThemedText style={editBdStyles.saveBtnText}>Save Birthday</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Animated.View>
  );

  // ─── View: Birthday Info ──────────────────────────────────────────────────
  const renderBirthdayView = () => {
    const age = getAge(user.birthday);
    const bdFormatted = formatDate(user.birthday);

    return (
      <Animated.View
        key="birthday"
        entering={SlideInRight.duration(280).springify()}
        exiting={SlideOutRight.duration(220)}
        style={StyleSheet.absoluteFill}
      >
        <View style={[styles.sheet, { backgroundColor: sheetBg, height: SCREEN_HEIGHT * 0.88, bottom: 0, left: 0, right: 0, position: 'absolute' }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <Pressable onPress={() => setCurrentView('main')} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </Pressable>
            <ThemedText style={[styles.headerTitle, { color: textColor }]}>Birthday</ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Birthday hero card */}
            <View style={[bdStyles.heroCard, { backgroundColor: isDark ? '#262629' : '#F5F7FF', borderColor: isDark ? '#3B82F644' : '#1D4ED822' }]}>
              <View style={[bdStyles.cakeIconWrapper, { backgroundColor: isDark ? '#3B82F622' : '#1D4ED811' }]}>
                <MaterialCommunityIcons name="cake-variant" size={38} color={accentColor} />
              </View>
              <ThemedText style={[bdStyles.heroDate, { color: textColor }]}>{bdFormatted}</ThemedText>
              {age !== null && (
                <ThemedText style={[bdStyles.heroAge, { color: textSecondaryColor }]}>
                  {age} years old
                </ThemedText>
              )}
            </View>

            {/* Section title */}
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>About your birthday</ThemedText>

            {/* Info cards */}
            <View style={[bdStyles.infoCard, { backgroundColor: cardBg, borderColor }]}>
              <Pressable style={bdStyles.infoRow}>
                <View style={[bdStyles.infoIconWrapper, { backgroundColor: isDark ? '#3B82F615' : '#EEF2FF' }]}>
                  <MaterialCommunityIcons name="eye-off-outline" size={20} color={accentColor} />
                </View>
                <View style={bdStyles.infoContent}>
                  <ThemedText style={[bdStyles.infoTitle, { color: textColor }]}>Birthday visibility</ThemedText>
                  <ThemedText style={[bdStyles.infoDesc, { color: textSecondaryColor }]}>
                    Your birthday is not shown on your public profile.
                  </ThemedText>
                </View>
              </Pressable>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              <Pressable style={bdStyles.infoRow}>
                <View style={[bdStyles.infoIconWrapper, { backgroundColor: isDark ? '#3B82F615' : '#EEF2FF' }]}>
                  <MaterialCommunityIcons name="shield-account-outline" size={20} color={accentColor} />
                </View>
                <View style={bdStyles.infoContent}>
                  <ThemedText style={[bdStyles.infoTitle, { color: textColor }]}>Used for safety</ThemedText>
                  <ThemedText style={[bdStyles.infoDesc, { color: textSecondaryColor }]}>
                    Your age helps us keep your account safe and show age-appropriate content.
                  </ThemedText>
                </View>
              </Pressable>
            </View>

            {/* Edit birthday row */}
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Manage</ThemedText>
            <View style={[bdStyles.editCard, { backgroundColor: cardBg, borderColor }]}>
              <Pressable
                style={bdStyles.editRow}
                onPress={() => setCurrentView('edit-birthday')}
              >
                <View style={[bdStyles.infoIconWrapper, { backgroundColor: isDark ? '#3B82F615' : '#EEF2FF' }]}>
                  <MaterialCommunityIcons name="pencil-outline" size={20} color={accentColor} />
                </View>
                <View style={bdStyles.infoContent}>
                  <ThemedText style={[bdStyles.infoTitle, { color: textColor }]}>Edit Birthday</ThemedText>
                  <ThemedText style={[bdStyles.infoDesc, { color: textSecondaryColor }]}>
                    Update your birthday date
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    );
  };

  // ─── View: Main ───────────────────────────────────────────────────────────
  const renderMain = () => (
    <Animated.View
      key="main"
      entering={currentView === 'main' ? FadeIn.duration(200) : SlideInLeft.duration(280).springify()}
      exiting={SlideOutLeft.duration(220)}
      style={StyleSheet.absoluteFill}
    >
      <View style={[styles.sheet, { backgroundColor: sheetBg, height: SCREEN_HEIGHT * 0.88, bottom: 0, left: 0, right: 0, position: 'absolute' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={26} color={textColor} />
          </Pressable>

          {/* Meta Branding */}
          <View style={styles.brandingWrapper}>
            <Image
              source={require('../../assets/images/meta.png')}
              style={[styles.metaLogoImage, isDark && { tintColor: '#FFFFFF' }]}
              resizeMode="contain"
            />
            <ThemedText style={[styles.metaText, { color: isDark ? '#FFFFFF' : '#000000' }]}>Meta</ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <ThemedText style={[styles.title, { color: textColor }]}>Profiles and personal details</ThemedText>
          <ThemedText style={[styles.description, { color: textSecondaryColor }]}>
            Review the profiles and personal details you've added to this Accounts Center. Add more profiles by adding your accounts.{' '}
            <ThemedText style={styles.linkText}>Learn more</ThemedText>
          </ThemedText>

          {/* SECTION: Profiles */}
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Profiles</ThemedText>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Pressable style={styles.cardRow}>
              <View style={styles.avatarWrapper}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: isDark ? '#3A3A3C' : '#E8E8E8' }]}>
                    <Ionicons name="person" size={24} color={isDark ? '#636366' : '#A8A8A8'} />
                  </View>
                )}
                <View style={styles.instagramBadge}>
                  <Ionicons name="logo-instagram" size={10} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.rowDetails}>
                <ThemedText style={[styles.profileName, { color: textColor }]}>{user.username}</ThemedText>
                <ThemedText style={[styles.profileSub, { color: textSecondaryColor }]}>Instagram</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <Pressable style={styles.addAccountsRow}>
              <ThemedText style={styles.addAccountsText}>Add accounts</ThemedText>
            </Pressable>
          </View>

          {/* SECTION: Personal details */}
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Personal details</ThemedText>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {/* Contact Info */}
            <Pressable style={styles.cardRow}>
              <View style={styles.rowDetails}>
                <ThemedText style={[styles.detailTitle, { color: textColor }]}>Contact info</ThemedText>
                <ThemedText style={[styles.detailValue, { color: textSecondaryColor }]}>
                  {user.email || 'No email set'}{user.phone ? ` • ${user.phone}` : ''}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            {/* Birthday */}
            <Pressable style={styles.cardRow} onPress={() => setCurrentView('birthday')}>
              <View style={styles.rowDetails}>
                <ThemedText style={[styles.detailTitle, { color: textColor }]}>Birthday</ThemedText>
                <ThemedText style={[styles.detailValue, { color: textSecondaryColor }]}>
                  {formatDate(user.birthday)}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
            </Pressable>
          </View>
        </Animated.ScrollView>
      </View>
    </Animated.View>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Modal visible={shouldRender} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Draggable sheet wrapper */}
        <GestureDetector gesture={currentView === 'main' ? panGesture : Gesture.Pan()}>
          <Animated.View style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.88, zIndex: 101 }, sheetStyle]}>
            {currentView === 'main' && renderMain()}
            {currentView === 'birthday' && renderBirthdayView()}
            {currentView === 'edit-birthday' && renderEditBirthday()}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 100,
  },
  sheet: {
    zIndex: 101,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 24,
    overflow: 'hidden',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  metaLogoImage: {
    width: 26,
    height: 26,
  },
  metaText: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    marginLeft: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    lineHeight: 28,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 16,
  },
  linkText: {
    color: '#0064E0',
    fontFamily: Fonts.semiBold,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E1306C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  rowDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  profileSub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  addAccountsRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  addAccountsText: {
    color: '#0064E0',
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  detailTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  detailValue: {
    fontSize: 13.5,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
});

// Birthday view styles
const bdStyles = StyleSheet.create({
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 4,
  },
  cakeIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroDate: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroAge: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  editCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});

// Edit birthday styles
const editBdStyles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  pickerLabel: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    height: PICKER_HEIGHT + 48,
  },
  pickerCol: {
    flex: 1,
    alignItems: 'center',
  },
  colLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingTop: 12,
    paddingBottom: 4,
  },
  colDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  previewCard: {
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  saveBtn: {
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
});
