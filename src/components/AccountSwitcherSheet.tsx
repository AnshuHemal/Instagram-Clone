/**
 * AccountSwitcherSheet
 *
 * A production-quality bottom sheet that slides up when the user taps their
 * username in the Profile header. Mimics the real Instagram account-switcher UX:
 *
 *  ┌──────────────────────────────────────┐
 *  │         ▬  (drag handle)             │
 *  │  ●  insforgetester        ✓           │
 *  │  ＋  Add Instagram account            │
 *  │──────────────────────────────────────│
 *  │   Go to Accounts Center              │
 *  │              ∞ Meta                  │
 *  └──────────────────────────────────────┘
 *
 * Features:
 *  - Native modal context (covers top status bar and bottom tab navigator)
 *  - Animated backdrop (fade in/out)
 *  - Sheet slides up with spring physics
 *  - Swipe-down to dismiss via pan gesture inside the modal
 *  - Fully dark/light mode aware
 *  - Accessible (backdrop press closes the sheet)
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  Dimensions,
  Modal,
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// How far down the sheet goes (off-screen)
const SHEET_OFFSCREEN = SCREEN_HEIGHT;

// Dismiss threshold – if user drags more than this, close the sheet
const DISMISS_THRESHOLD = 80;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AccountSwitcherSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddAccount?: () => void;
  onAccountsCenter?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AccountSwitcherSheet: React.FC<AccountSwitcherSheetProps> = ({
  visible,
  onClose,
  onAddAccount,
  onAccountsCenter,
}) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // ── Animation values
  const translateY = useSharedValue(SHEET_OFFSCREEN);
  const backdropOpacity = useSharedValue(0);

  // dragStartY captures sheet position at gesture start
  const dragStartY = useSharedValue(0);

  // Modal rendering lifecycle helper (renders modal while animating out)
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    }
  }, [visible]);

  // ── Open / close animation ─────────────────────────────────────────────────

  const openSheet = useCallback(() => {
    backdropOpacity.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withSpring(0, {
      damping: 20,
      stiffness: 180,
      mass: 0.8,
    });
  }, []);

  const closeSheet = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(
      SHEET_OFFSCREEN,
      { duration: 220, easing: Easing.in(Easing.ease) },
      (finished) => {
        if (finished) {
          runOnJS(setShouldRender)(false);
        }
      }
    );
  }, []);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (visible) {
      // Trigger animation immediately once visibility is true
      openSheet();
    } else if (!visible && shouldRender) {
      closeSheet();
    }
  }, [visible, shouldRender, openSheet, closeSheet]);

  // ── Pan gesture to swipe-dismiss ───────────────────────────────────────────

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Only allow downward dragging
      const newY = dragStartY.value + event.translationY;
      translateY.value = Math.max(0, newY);
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 800) {
        // Fast or far enough – dismiss
        runOnJS(onClose)();
      } else {
        // Snap back
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  // ── Animated styles ────────────────────────────────────────────────────────

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // ── Avatar helpers ─────────────────────────────────────────────────────────

  const hasAvatar = !!(user?.avatar && user.avatar.trim());

  // Sheet background and border colours
  const sheetBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const dividerColor = isDark ? '#2C2C2E' : '#E5E5E5';
  const rowBg = isDark ? '#2C2C2E' : '#F5F5F5';
  const textColor = colors.text;
  const subtextColor = colors.textSecondary;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!user) return null;

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.modalContainer}>
        {/* ── Backdrop ── */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* ── Sheet ── */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: sheetBg },
              sheetStyle,
            ]}
          >
            {/* Drag handle pill */}
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: isDark ? '#48484A' : '#D1D1D6' },
                ]}
              />
            </View>

            {/* ── Account list card ── */}
            <View
              style={[
                styles.accountCard,
                { backgroundColor: rowBg },
              ]}
            >
              {/* Current account row */}
              <Pressable style={styles.accountRow} android_ripple={{ color: dividerColor }}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  {hasAvatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      style={styles.accountAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.accountAvatar,
                        styles.avatarFallback,
                        { backgroundColor: isDark ? '#3A3A3C' : '#D4D4D4' },
                      ]}
                    >
                      {/* Silhouette */}
                      <View style={styles.silhouetteHead} />
                      <View style={styles.silhouetteBody} />
                    </View>
                  )}
                </View>

                {/* Username */}
                <ThemedText
                  style={[styles.accountUsername, { color: textColor }]}
                  numberOfLines={1}
                >
                  {user.username}
                </ThemedText>

                {/* Active checkmark */}
                <View style={styles.checkContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#0095F6" />
                </View>
              </Pressable>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: dividerColor }]} />

              {/* Add account row */}
              <Pressable
                style={styles.accountRow}
                onPress={onAddAccount}
                android_ripple={{ color: dividerColor }}
              >
                {/* Plus icon circle */}
                <View style={[styles.addIconCircle, { borderColor: textColor }]}>
                  <Ionicons name="add" size={20} color={textColor} />
                </View>

                <ThemedText
                  style={[styles.addAccountText, { color: textColor }]}
                >
                  Add Instagram account
                </ThemedText>
              </Pressable>
            </View>

            {/* ── Accounts center button ── */}
            <Pressable
              style={[
                styles.accountsCenterBtn,
                { borderColor: dividerColor, backgroundColor: sheetBg },
              ]}
              onPress={onAccountsCenter}
            >
              <ThemedText style={[styles.accountsCenterText, { color: textColor }]}>
                Go to Accounts Center
              </ThemedText>
            </Pressable>

            {/* ── Meta branding ── */}
            <View style={styles.metaRow}>
              <Image
                source={require('@/assets/images/meta.png')}
                style={[styles.metaIcon, { tintColor: subtextColor }]}
                resizeMode="contain"
              />
              <ThemedText style={[styles.metaText, { color: subtextColor }]}>
                Meta
              </ThemedText>
            </View>
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
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },

  // Backdrop
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 100,
  },

  // Sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 101,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 36,
    paddingTop: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
  },

  // Drag handle
  handleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  // Account card
  accountCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  silhouetteHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#A8A8A8',
    marginBottom: 2,
  },
  silhouetteBody: {
    width: 26,
    height: 18,
    borderRadius: 13,
    backgroundColor: '#A8A8A8',
    marginBottom: -4,
  },
  accountUsername: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  checkContainer: {
    width: 28,
    alignItems: 'flex-end',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },

  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAccountText: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },

  // Accounts center
  accountsCenterBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  accountsCenterText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
  },

  // Meta branding
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  metaIcon: {
    width: 15,
    height: 15,
  },
  metaText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
});
