/**
 * AvatarBottomSheet
 *
 * A production-quality bottom sheet for profile photo actions that matches
 * the exact styling, animations, and gesture-driven dismiss interactions
 * as the CreateBottomSheet.
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
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
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_OFFSCREEN = SCREEN_HEIGHT;
const DISMISS_THRESHOLD = 80;

interface AvatarBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: 'add_photo' | 'add_story') => void;
}

export const AvatarBottomSheet: React.FC<AvatarBottomSheetProps> = ({
  visible,
  onClose,
  onSelectOption,
}) => {
  const { colors, isDark } = useTheme();

  // ── Animation values
  const translateY = useSharedValue(SHEET_OFFSCREEN);
  const backdropOpacity = useSharedValue(0);
  const dragStartY = useSharedValue(0);

  // Modal rendering lifecycle helper
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
      const newY = dragStartY.value + event.translationY;
      translateY.value = Math.max(0, newY);
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 800) {
        runOnJS(onClose)();
      } else {
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

  // Theme-derived styles
  const sheetBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const dividerColor = isDark ? '#2C2C2E' : '#F2F2F2';
  const textColor = colors.text;

  // ── Render Helpers ─────────────────────────────────────────────────────────

  const renderOption = (
    id: 'add_photo' | 'add_story',
    label: string,
    subLabel: string,
    icon: React.ReactNode,
    isLast: boolean = false
  ) => (
    <Pressable
      onPress={() => {
        onSelectOption(id);
        onClose();
      }}
      style={styles.optionRow}
      android_ripple={{ color: isDark ? '#2C2C2E' : '#F5F5F5' }}
    >
      <View style={[styles.optionIconContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
        {icon}
      </View>
      <View
        style={[
          styles.optionTextContainer,
          {
            borderBottomColor: dividerColor,
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.optionLabelGroup}>
          <ThemedText style={[styles.optionLabel, { color: textColor }]}>
            {label}
          </ThemedText>
          <ThemedText style={[styles.optionSubLabel, { color: colors.textSecondary }]}>
            {subLabel}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
    </Pressable>
  );

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.modalContainer}>
        {/* Backdrop overlay */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Bottom Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: sheetBg },
              sheetStyle,
            ]}
          >
            {/* Drag handle */}
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: isDark ? '#48484A' : '#D1D1D6' },
                ]}
              />
            </View>

            {/* Title / Close Header */}
            <View style={styles.sheetTitleRow}>
              <ThemedText style={[styles.menuTitle, { color: textColor }]}>
                Profile photo
              </ThemedText>
            </View>

            <View style={[styles.sheetDivider, { backgroundColor: dividerColor }]} />

            {/* List options */}
            <View style={styles.optionsList}>
              {renderOption(
                'add_photo',
                'Add profile picture',
                'Choose from your gallery',
                <Ionicons name="image-outline" size={22} color="#0095F6" />
              )}
              {renderOption(
                'add_story',
                'Add to Your Story',
                'Share a moment with followers',
                <Ionicons name="add-circle-outline" size={22} color="#E1306C" />,
                true
              )}
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 100,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 101,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 40,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 6,
    paddingTop: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 6,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginBottom: 8,
  },
  optionsList: {
    width: '100%',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingVertical: 4,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
    marginLeft: 14,
  },
  optionLabelGroup: {
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  optionSubLabel: {
    fontSize: 12.5,
    fontFamily: Fonts.regular,
  },
});
