import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Modal,
  Image,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
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

const { width: SCREEN_W, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_OFFSCREEN = SCREEN_HEIGHT;
const DISMISS_THRESHOLD = 80;
const SLIDE_SPRING = { damping: 28, stiffness: 240, mass: 0.8 };

// ─── Types ────────────────────────────────────────────────────────────────────

type SheetView =
  | 'main'
  | 'birthday'
  | 'edit-birthday'
  | 'contact-info'
  | 'email-detail'
  | 'email-visibility';

interface PersonalDetailsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Drum Roll Picker ─────────────────────────────────────────────────────────

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
// padding = 2 items top + 2 items bottom so the first/last item can center
const PADDING_VERTICAL = ITEM_HEIGHT * 2;

interface DrumPickerProps {
  items: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  isDark: boolean;
  label: string;
}

const DrumPicker: React.FC<DrumPickerProps> = ({
  items,
  selectedIndex,
  onIndexChange,
  isDark,
  label,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const currentIndex = useRef(selectedIndex);
  const isMounted = useRef(false);

  const accentColor = '#3B82F6';
  const textSelected = isDark ? '#FFFFFF' : '#111827';
  const textUnselected = isDark ? '#4B5563' : '#9CA3AF';
  const highlightBg = isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)';
  const highlightBorder = isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.3)';

  // Scroll to initial index after layout
  const handleLayout = () => {
    if (!isMounted.current) {
      isMounted.current = true;
      const y = selectedIndex * ITEM_HEIGHT;
      scrollRef.current?.scrollTo({ y, animated: false });
      currentIndex.current = selectedIndex;
    }
  };

  // When parent resets selectedIndex (e.g. sheet reopened)
  useEffect(() => {
    if (isMounted.current) {
      currentIndex.current = selectedIndex;
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }
  }, [selectedIndex]);

  const snapToIndex = (rawY: number) => {
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(rawY / ITEM_HEIGHT)));
    if (idx !== currentIndex.current) {
      currentIndex.current = idx;
      onIndexChange(idx);
    }
    // Snap the scroll position to the exact multiple
    scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={drumStyles.wrapper}>
      {/* Column label */}
      <ThemedText style={[drumStyles.colLabel, { color: textUnselected }]}>{label}</ThemedText>

      {/* Picker body */}
      <View style={[drumStyles.container, { height: PICKER_HEIGHT }]}>
        {/* Selection highlight band */}
        <View
          pointerEvents="none"
          style={[
            drumStyles.highlight,
            {
              top: ITEM_HEIGHT * 2,
              backgroundColor: highlightBg,
              borderColor: highlightBorder,
            },
          ]}
        />


        {/*
          nestedScrollEnabled is critical for Android.
        */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          scrollEventThrottle={1}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate={Platform.OS === 'android' ? 0.985 : 'fast'}
          onLayout={handleLayout}
          onMomentumScrollEnd={(e) => snapToIndex(e.nativeEvent.contentOffset.y)}
          onScrollEndDrag={(e) => snapToIndex(e.nativeEvent.contentOffset.y)}
          contentContainerStyle={{ paddingVertical: PADDING_VERTICAL }}
        >
          {items.map((item, index) => {
            const distance = Math.abs(index - (currentIndex.current ?? selectedIndex));
            const isSelected = distance === 0;
            const opacity = isSelected ? 1 : 0.85;
            const fontSize = isSelected ? 19 : 15;
            const fontFamily = isSelected ? Fonts.semiBold : Fonts.regular;
            const color = isSelected ? textSelected : textUnselected;

            return (
              <Pressable
                key={`${item}-${index}`}
                style={[drumStyles.item, { height: ITEM_HEIGHT }]}
                onPress={() => {
                  currentIndex.current = index;
                  onIndexChange(index);
                  scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
                }}
              >
                <ThemedText
                  style={[drumStyles.itemText, { color, fontFamily, fontSize, opacity }]}
                >
                  {item}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const drumStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
  },
  colLabel: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingTop: 10,
    paddingBottom: 6,
  },
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  highlight: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 10,
    zIndex: 1,
    pointerEvents: 'none',
  },
});

// ─── Date Constants ────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 120 }, (_, i) => String(currentYear - i));

function parseBirthday(dateString?: string) {
  const defaults = { monthIndex: 0, dayIndex: 0, yearIndex: 22 }; // ~2002 default age
  if (!dateString) return defaults;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return defaults;
    const yearIndex = YEARS.indexOf(String(d.getFullYear()));
    return {
      monthIndex: d.getMonth(),
      dayIndex: d.getDate() - 1,
      yearIndex: yearIndex >= 0 ? yearIndex : defaults.yearIndex,
    };
  } catch {
    return defaults;
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

  // ─── Navigation ──────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState<SheetView>('main');
  const [isSaving, setIsSaving] = useState(false);

  // ─── Date picker state ────────────────────────────────────────────────────
  // We keep a stable "initial" parsed value and only re-parse when the sheet opens
  const [pickerMonth, setPickerMonth] = useState(0);
  const [pickerDay, setPickerDay] = useState(0);
  const [pickerYear, setPickerYear] = useState(22);

  // Reset everything when sheet becomes visible
  useEffect(() => {
    if (visible) {
      const p = parseBirthday(user?.birthday);
      setPickerMonth(p.monthIndex);
      setPickerDay(p.dayIndex);
      setPickerYear(p.yearIndex);
      setCurrentView('main');
      currentViewRef.current = 'main';
      // Reset slide positions
      mainTransX.value = 0;
      birthdayTransX.value = SCREEN_W;
      editBirthdayTransX.value = SCREEN_W;
      contactInfoTransX.value = SCREEN_W;
      emailDetailTransX.value = SCREEN_W;
      emailVisibilityTransX.value = SCREEN_W;

      // Instantly position offscreen on open trigger, before open animations start
      translateY.value = SHEET_OFFSCREEN;
      backdropOpacity.value = 0;
    }
  }, [visible]); // don't include user?.birthday — only reset on open

  // ─── Sheet animation ──────────────────────────────────────────────────────
  const translateY = useSharedValue(SHEET_OFFSCREEN);
  const backdropOpacity = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(visible);

  // Sync shouldRender state during render pass to avoid extra effect layout delays
  if (visible && !shouldRender) {
    setShouldRender(true);
  }

  const openSheet = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
    translateY.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.8 });
  }, []);

  const closeSheet = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 140, easing: Easing.linear });
    translateY.value = withTiming(
      SHEET_OFFSCREEN,
      { duration: 160, easing: Easing.bezier(0.25, 1, 0.5, 1) },
      (finished) => { if (finished) runOnJS(setShouldRender)(false); },
    );
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (visible) { openSheet(); } else if (shouldRender) { closeSheet(); }
  }, [visible, shouldRender, openSheet, closeSheet]);

  // ─── View-slide shared values ─────────────────────────────────────────────
  // Each panel lives at its own translateX; navigateTo() springs both together.
  const mainTransX = useSharedValue(0);
  const birthdayTransX = useSharedValue(SCREEN_W);
  const editBirthdayTransX = useSharedValue(SCREEN_W);
  const contactInfoTransX = useSharedValue(SCREEN_W);
  const emailDetailTransX = useSharedValue(SCREEN_W);
  const emailVisibilityTransX = useSharedValue(SCREEN_W);

  // Stable ref so navigateTo() never has a stale currentView closure
  const currentViewRef = useRef<SheetView>('main');

  const getTransX = (v: SheetView) => {
    if (v === 'main') return mainTransX;
    if (v === 'birthday') return birthdayTransX;
    if (v === 'edit-birthday') return editBirthdayTransX;
    if (v === 'contact-info') return contactInfoTransX;
    if (v === 'email-detail') return emailDetailTransX;
    return emailVisibilityTransX;
  };

  const navigateTo = useCallback((to: SheetView, dir: 'forward' | 'backward') => {
    const from = currentViewRef.current;
    if (from === to) return;
    currentViewRef.current = to;
    setCurrentView(to); // triggers re-render for pointerEvents

    // 1. Snap the incoming view to the starting edge (off-screen)
    getTransX(to).value = dir === 'forward' ? SCREEN_W : -SCREEN_W;
    // 2. Slide incoming view into center
    getTransX(to).value = withSpring(0, SLIDE_SPRING);
    // 3. Slide outgoing view off-screen in the opposite direction
    getTransX(from).value = withSpring(
      dir === 'forward' ? -SCREEN_W : SCREEN_W,
      SLIDE_SPRING,
    );
  }, []);

  // ─── Android hardware back button ─────────────────────────────────────────
  // On Android, Modal fires onRequestClose for the hardware back press.
  // We handle navigation here so back steps through the view stack.
  const handleHardwareBack = useCallback(() => {
    const view = currentViewRef.current;
    if (view === 'edit-birthday') {
      navigateTo('birthday', 'backward');
    } else if (view === 'birthday') {
      navigateTo('main', 'backward');
    } else if (view === 'email-visibility') {
      navigateTo('email-detail', 'backward');
    } else if (view === 'email-detail') {
      navigateTo('contact-info', 'backward');
    } else if (view === 'contact-info') {
      navigateTo('main', 'backward');
    } else {
      onClose();
    }
  }, [navigateTo, onClose]);

  const mainPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: mainTransX.value }],
  }));
  const birthdayPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: birthdayTransX.value }],
  }));
  const editBirthdayPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: editBirthdayTransX.value }],
  }));
  const contactInfoPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: contactInfoTransX.value }],
  }));
  const emailDetailPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: emailDetailTransX.value }],
  }));
  const emailVisibilityPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: emailVisibilityTransX.value }],
  }));

  // ─── Pan gesture (main view only) ────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .onBegin(() => { dragStartY.value = translateY.value; })
    .onUpdate((e) => { translateY.value = Math.max(0, dragStartY.value + e.translationY); })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > 700) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  // ─── Save birthday ────────────────────────────────────────────────────────
  const handleSaveBirthday = async () => {
    setIsSaving(true);
    try {
      const month = pickerMonth + 1;
      const day = pickerDay + 1;
      const year = parseInt(YEARS[pickerYear]);
      const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const success = await updateBirthday(isoDate);
      if (success) {
        // Close the sheet first — the Modal native layer sits above the app's
        // ToastProvider, so the toast must appear AFTER the sheet closes.
        navigateTo('birthday', 'backward');
        setTimeout(() => {
          onClose();
        }, 320); // wait for slide-back animation to finish
        setTimeout(() => {
          showToast({
            title: 'Birthday Updated',
            message: 'Your birthday has been saved successfully.',
            type: 'success',
          });
        }, 560); // wait for sheet close animation to complete (~240ms)
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

  // ─── Computed preview ─────────────────────────────────────────────────────
  const previewDateStr = `${MONTHS[pickerMonth]} ${DAYS[pickerDay]}, ${YEARS[pickerYear]}`;

  // ─── Sub-views ────────────────────────────────────────────────────────────

  const handleDeleteEmailAlert = () => {
    Alert.alert(
      'Delete email?',
      'Are you sure you want to delete this email from your account? You will no longer be able to use it to log in or reset your password.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Cannot delete email',
              'You cannot delete this email because it is the only contact method linked to your account. Please add another email or phone number first.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const renderContactInfo = () => (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: sheetBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => navigateTo('main', 'backward')} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Contact information</ThemedText>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedText style={[styles.title, { color: textColor }]}>Contact information</ThemedText>
        <ThemedText style={[styles.description, { color: textSecondaryColor }]}>
          Manage your mobile numbers and emails, and who can see your contact info. Use any of them to access any profiles or devices in this Accounts Center.
        </ThemedText>

        <View style={{ height: 12 }} />

        {/* Email entry card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Pressable style={styles.cardRow} onPress={() => navigateTo('email-detail', 'forward')}>
            <View style={[contactStyles.cardIconCircle, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
              <Ionicons name="mail-outline" size={20} color={textColor} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.detailTitle, { color: textColor }]}>{user.email || 'No email set'}</ThemedText>
              <ThemedText style={[styles.detailValue, { color: textSecondaryColor }]}>Email</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
          </Pressable>
        </View>

        {/* Add new contact button */}
        <Pressable
          style={({ pressed }) => [
            contactStyles.addBtn,
            { backgroundColor: '#0064E0', opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => {
            showToast({
              title: 'Add Contact',
              message: 'Adding additional contact options will be available shortly.',
              type: 'info',
            });
          }}
        >
          <ThemedText style={contactStyles.addBtnText}>Add new contact</ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );

  const renderEmailDetail = () => (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: sheetBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => navigateTo('contact-info', 'backward')} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>{user.email}</ThemedText>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={2}>{user.email}</ThemedText>
        <ThemedText style={[styles.description, { color: textSecondaryColor, lineHeight: 20 }]}>
          You added this email to these accounts.{' '}
          <ThemedText style={contactStyles.linkBtn} onPress={() => navigateTo('email-visibility', 'forward')}>
            Who can see your email.
          </ThemedText>
        </ThemedText>

        <View style={{ height: 16 }} />

        {/* User Account Row */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Pressable style={styles.cardRow} onPress={() => navigateTo('email-visibility', 'forward')}>
            <View style={styles.avatarWrapper}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: isDark ? '#3A3A3C' : '#E8E8E8' }]}>
                  <Ionicons name="person" size={24} color={isDark ? '#636366' : '#A8A8A8'} />
                </View>
              )}
              <View style={styles.igBadge}>
                <Ionicons name="logo-instagram" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.profileName, { color: textColor }]}>{user.username}</ThemedText>
              <ThemedText style={[styles.profileSub, { color: textSecondaryColor }]}>Instagram</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
          </Pressable>
        </View>

        <View style={{ height: 16 }} />

        {/* Delete Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Pressable
            style={({ pressed }) => [
              contactStyles.deleteBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleDeleteEmailAlert}
          >
            <ThemedText style={contactStyles.deleteText}>Delete email</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );

  const renderEmailVisibility = () => (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: sheetBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => navigateTo('email-detail', 'backward')} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>{user.email}</ThemedText>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={2}>{user.email}</ThemedText>
        <ThemedText style={[styles.description, { color: textSecondaryColor }]}>Who can see your email</ThemedText>

        <View style={{ height: 16 }} />

        {/* Visibility Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {/* Top user row */}
          <View style={styles.cardRow}>
            <View style={styles.avatarWrapper}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: isDark ? '#3A3A3C' : '#E8E8E8' }]}>
                  <Ionicons name="person" size={24} color={isDark ? '#636366' : '#A8A8A8'} />
                </View>
              )}
              <View style={styles.igBadge}>
                <Ionicons name="logo-instagram" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.profileName, { color: textColor }]}>{user.username}</ThemedText>
              <ThemedText style={[styles.profileSub, { color: textSecondaryColor }]}>Instagram</ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* Visibility row */}
          <View style={contactStyles.visibilityRow}>
            <ThemedText style={[contactStyles.visibilityLabel, { color: textColor }]}>Visibility</ThemedText>
            <ThemedText style={[contactStyles.visibilityVal, { color: textSecondaryColor }]}>Always private</ThemedText>
          </View>
        </View>

        <View style={{ height: 16 }} />

        {/* Delete from Instagram Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Pressable
            style={({ pressed }) => [
              contactStyles.deleteBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleDeleteEmailAlert}
          >
            <ThemedText style={contactStyles.deleteText}>Delete from Instagram</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );

  const renderEditBirthday = () => (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: sheetBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => navigateTo('birthday', 'backward')} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Edit Birthday</ThemedText>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Info banner */}
        <View style={[editBdStyles.infoBanner, { backgroundColor: isDark ? '#262629' : '#F5F7FF', borderColor: isDark ? '#3B82F633' : '#1D4ED822' }]}>
          <MaterialCommunityIcons name="cake-variant-outline" size={20} color={accentColor} style={{ marginRight: 10, marginTop: 1 }} />
          <ThemedText style={[editBdStyles.infoText, { color: textSecondaryColor }]}>
            Your birthday is used to verify your age. It's not shown publicly unless you choose to share it.
          </ThemedText>
        </View>

        {/* Pickers */}
        <View style={[editBdStyles.pickerCard, { backgroundColor: cardBg, borderColor }]}>
          {/*
            Key trick: each DrumPicker gets a unique key so React remounts
            each column independently when the sheet re-opens.
          */}
          <DrumPicker
            key={`month-${visible}`}
            items={MONTHS}
            selectedIndex={pickerMonth}
            onIndexChange={setPickerMonth}
            isDark={isDark}
            label="Month"
          />

          <View style={[editBdStyles.pickerDivider, { backgroundColor: borderColor }]} />

          <DrumPicker
            key={`day-${visible}`}
            items={DAYS}
            selectedIndex={pickerDay}
            onIndexChange={setPickerDay}
            isDark={isDark}
            label="Day"
          />

          <View style={[editBdStyles.pickerDivider, { backgroundColor: borderColor }]} />

          <DrumPicker
            key={`year-${visible}`}
            items={YEARS}
            selectedIndex={pickerYear}
            onIndexChange={setPickerYear}
            isDark={isDark}
            label="Year"
          />
        </View>

        {/* Preview */}
        <View style={[editBdStyles.previewCard, { backgroundColor: isDark ? '#1A2540' : '#EEF2FF', borderColor: isDark ? '#3B82F644' : '#1D4ED822' }]}>
          <ThemedText style={[editBdStyles.previewLabel, { color: textSecondaryColor }]}>
            Selected date
          </ThemedText>
          <ThemedText style={[editBdStyles.previewDate, { color: accentColor }]}>
            {previewDateStr}
          </ThemedText>
        </View>

        {/* Save */}
        <Pressable
          style={({ pressed }) => [
            editBdStyles.saveBtn,
            { backgroundColor: isSaving ? (isDark ? '#2D3748' : '#CBD5E1') : '#0064E0', opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSaveBirthday}
          disabled={isSaving}
        >
          <ThemedText style={editBdStyles.saveBtnText}>
            {isSaving ? 'Saving…' : 'Save Birthday'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );

  const renderBirthdayView = () => {
    const age = getAge(user.birthday);
    const bdFormatted = formatDate(user.birthday);

    return (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: sheetBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={() => navigateTo('main', 'backward')} style={styles.headerBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Birthday</ThemedText>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Hero card */}
          <View style={[bdStyles.heroCard, { backgroundColor: isDark ? '#1A2540' : '#EEF2FF', borderColor: isDark ? '#3B82F633' : '#1D4ED822' }]}>
            <View style={[bdStyles.cakeCircle, { backgroundColor: isDark ? '#3B82F620' : '#DBEAFE' }]}>
              <MaterialCommunityIcons name="cake-variant" size={36} color={accentColor} />
            </View>
            <ThemedText style={[bdStyles.heroDate, { color: textColor }]}>{bdFormatted}</ThemedText>
            {age !== null && (
              <ThemedText style={[bdStyles.heroAge, { color: textSecondaryColor }]}>{age} years old</ThemedText>
            )}
          </View>

          {/* Info section */}
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>About your birthday</ThemedText>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={bdStyles.infoRow}>
              <View style={[bdStyles.iconCircle, { backgroundColor: isDark ? '#3B82F615' : '#EEF2FF' }]}>
                <MaterialCommunityIcons name="eye-off-outline" size={18} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[bdStyles.infoTitle, { color: textColor }]}>Birthday visibility</ThemedText>
                <ThemedText style={[bdStyles.infoDesc, { color: textSecondaryColor }]}>Your birthday isn't shown on your public profile.</ThemedText>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <View style={bdStyles.infoRow}>
              <View style={[bdStyles.iconCircle, { backgroundColor: isDark ? '#3B82F615' : '#EEF2FF' }]}>
                <MaterialCommunityIcons name="shield-account-outline" size={18} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[bdStyles.infoTitle, { color: textColor }]}>Used for safety</ThemedText>
                <ThemedText style={[bdStyles.infoDesc, { color: textSecondaryColor }]}>Your age helps us keep your account safe and show appropriate content.</ThemedText>
              </View>
            </View>
          </View>

          {/* Manage section */}
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Manage</ThemedText>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Pressable style={bdStyles.editRow} onPress={() => navigateTo('edit-birthday', 'forward')}>
              <View style={[bdStyles.iconCircle, { backgroundColor: isDark ? '#3B82F615' : '#EEF2FF' }]}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[bdStyles.infoTitle, { color: textColor }]}>Edit Birthday</ThemedText>
                <ThemedText style={[bdStyles.infoDesc, { color: textSecondaryColor }]}>Update your date of birth</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderMain = () => (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: sheetBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="close" size={26} color={textColor} />
        </Pressable>
        <View style={styles.brandingRow}>
          <Image
            source={require('../../assets/images/meta.png')}
            style={[styles.metaLogo, isDark && { tintColor: '#FFFFFF' }]}
            resizeMode="contain"
          />
          <ThemedText style={[styles.metaText, { color: isDark ? '#FFFFFF' : '#000000' }]}>Meta</ThemedText>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedText style={[styles.title, { color: textColor }]}>Profiles and personal details</ThemedText>
        <ThemedText style={[styles.description, { color: textSecondaryColor }]}>
          Review the profiles and personal details you've added to this Accounts Center.{' '}
          <ThemedText style={styles.link}>Learn more</ThemedText>
        </ThemedText>

        {/* Profiles */}
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
              <View style={styles.igBadge}>
                <Ionicons name="logo-instagram" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.profileName, { color: textColor }]}>{user.username}</ThemedText>
              <ThemedText style={[styles.profileSub, { color: textSecondaryColor }]}>Instagram</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: borderColor }]} />
          <Pressable style={styles.addRow}>
            <ThemedText style={styles.addText}>Add accounts</ThemedText>
          </Pressable>
        </View>

        {/* Personal details */}
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Personal details</ThemedText>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Pressable style={styles.cardRow} onPress={() => navigateTo('contact-info', 'forward')}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.detailTitle, { color: textColor }]}>Contact info</ThemedText>
              <ThemedText style={[styles.detailValue, { color: textSecondaryColor }]}>
                {user.email || 'No email set'}{user.phone ? ` • ${user.phone}` : ''}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: borderColor }]} />
          <Pressable style={styles.cardRow} onPress={() => navigateTo('birthday', 'forward')}>
            <View style={{ flex: 1 }}>
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
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Modal visible={shouldRender} transparent animationType="none" statusBarTranslucent onRequestClose={handleHardwareBack}>
      <GestureHandlerRootView style={styles.root}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/*
          All 3 panels are always rendered with position: absolute.
          pointerEvents controls which one is interactive at any time.
          GestureDetector wraps only the main panel so drum picker
          ScrollViews still receive native touches on birthday views.
        */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { height: SCREEN_HEIGHT * 0.88, overflow: 'hidden' },
            sheetStyle,
          ]}
        >
          {/* Main panel */}
          <Animated.View
            style={[StyleSheet.absoluteFill, mainPanelStyle]}
            pointerEvents={currentView === 'main' ? 'auto' : 'none'}
          >
            <GestureDetector gesture={panGesture}>
              {renderMain()}
            </GestureDetector>
          </Animated.View>

          {/* Birthday panel */}
          <Animated.View
            style={[StyleSheet.absoluteFill, birthdayPanelStyle]}
            pointerEvents={currentView === 'birthday' ? 'auto' : 'none'}
          >
            {renderBirthdayView()}
          </Animated.View>

          {/* Edit-Birthday panel */}
          <Animated.View
            style={[StyleSheet.absoluteFill, editBirthdayPanelStyle]}
            pointerEvents={currentView === 'edit-birthday' ? 'auto' : 'none'}
          >
            {renderEditBirthday()}
          </Animated.View>

          {/* Contact Info panel */}
          <Animated.View
            style={[StyleSheet.absoluteFill, contactInfoPanelStyle]}
            pointerEvents={currentView === 'contact-info' ? 'auto' : 'none'}
          >
            {renderContactInfo()}
          </Animated.View>

          {/* Email Detail panel */}
          <Animated.View
            style={[StyleSheet.absoluteFill, emailDetailPanelStyle]}
            pointerEvents={currentView === 'email-detail' ? 'auto' : 'none'}
          >
            {renderEmailDetail()}
          </Animated.View>

          {/* Email Visibility panel */}
          <Animated.View
            style={[StyleSheet.absoluteFill, emailVisibilityPanelStyle]}
            pointerEvents={currentView === 'email-visibility' ? 'auto' : 'none'}
          >
            {renderEmailVisibility()}
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 100,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 101,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLogo: {
    width: 24,
    height: 24,
  },
  metaText: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
    marginLeft: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.semiBold,
    lineHeight: 28,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 8,
  },
  link: {
    color: '#0064E0',
    fontFamily: Fonts.semiBold,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
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
  igBadge: {
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
    borderColor: '#FFF',
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
  },
  addRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addText: {
    color: '#0064E0',
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  detailTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
});

// Birthday info view styles
const bdStyles = StyleSheet.create({
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 4,
  },
  cakeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroDate: {
    fontSize: 21,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  heroAge: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 12.5,
    fontFamily: Fonts.regular,
    lineHeight: 17,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
});

// Edit birthday view styles
const editBdStyles = StyleSheet.create({
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  pickerCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    // Height is enough for label + PICKER_HEIGHT
    height: PICKER_HEIGHT + 44,
  },
  pickerDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  previewCard: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.2,
  },
});

const contactStyles = StyleSheet.create({
  cardIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  deleteBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  deleteText: {
    color: '#FF3B30',
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  addBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  visibilityLabel: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  visibilityVal: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  linkBtn: {
    color: '#0064E0',
    fontFamily: Fonts.semiBold,
  },
});
