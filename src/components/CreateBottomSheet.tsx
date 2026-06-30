/**
 * CreateBottomSheet
 *
 * A production-quality bottom sheet that slides up when the user taps the
 * plus button in the Profile header. Mimics the real Instagram Create menu UX:
 *
 *  ┌──────────────────────────────────────┐
 *  │               ▬  (drag handle)       │
 *  │                Create                │
 *  │──────────────────────────────────────│
 *  │  ▷  Reel                             │
 *  │──────────────────────────────────────│
 *  │  [] Edits                      [New] │
 *  │──────────────────────────────────────│
 *  │  田 Post                             │
 *  │──────────────────────────────────────│
 *  │  ⊕  Story                            │
 *  │──────────────────────────────────────│
 *  │  ♡  Highlights                       │
 *  │──────────────────────────────────────│
 *  │  ((.)) Live                          │
 *  └──────────────────────────────────────┘
 *
 * Features:
 *  - Native modal context (covers top status bar and bottom tab navigator)
 *  - Animated backdrop (near-transparent for parent-overlay interaction)
 *  - Sheet slides up with timing animations
 *  - Swipe-down to dismiss via pan gesture inside the modal
 *  - Fully dark/light mode aware
 *  - Inset list dividers and "New" badge for Edits option
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
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

// ─── Custom SVG Icons ─────────────────────────────────────────────────────────

const ReelsIcon = ({ color, size = 22 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3}
      y={3}
      width={18}
      height={18}
      rx={4}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 9h18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m7 3 2 6M13 3l2 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m10 12 5.5 3-5.5 3v-6z"
      fill={color}
    />
  </Svg>
);

const EditsIcon = ({ color, size = 22 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.5 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H9.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.5 4h3A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1={12}
      y1={4}
      x2={12}
      y2={20}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const PostIcon = ({ color, size = 22 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3}
      y={3}
      width={18}
      height={18}
      rx={1.5}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1={9}
      y1={3}
      x2={9}
      y2={21}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1={15}
      y1={3}
      x2={15}
      y2={21}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1={3}
      y1={9}
      x2={21}
      y2={9}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1={3}
      y1={15}
      x2={21}
      y2={15}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const StoryIcon = ({ color, size = 22 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx={12}
      cy={12}
      r={9}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 7.5v9M7.5 12h9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HighlightsIcon = ({ color, size = 22 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx={12}
      cy={12}
      r={9}
      stroke={color}
      strokeWidth={2}
      strokeDasharray="3 3"
    />
    <Path
      d="M12 16s-4.2-3.2-4.2-6a2.5 2.5 0 0 1 2.5-2.5c1.2 0 2.1 1 2.5 2.1.4-1.1 1.3-2.1 2.5-2.1a2.5 2.5 0 0 1 2.5 2.5c0 2.8-4.2 6-4.2 6z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const LiveIcon = ({ color, size = 22 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={1.5} fill={color} />
    <Path
      d="M15.5 9.5a4.5 4.5 0 0 1 0 5M8.5 9.5a4.5 4.5 0 0 0 0 5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 6.5a8.5 8.5 0 0 1 0 11M5.5 6.5a8.5 8.5 0 0 0 0 11"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_OFFSCREEN = SCREEN_HEIGHT;
const DISMISS_THRESHOLD = 80;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CreateBottomSheet: React.FC<CreateBottomSheetProps> = ({
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
    id: string,
    label: string,
    icon: React.ReactNode,
    showNewBadge: boolean = false,
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
      <View style={styles.optionIconContainer}>{icon}</View>
      <View
        style={[
          styles.optionTextContainer,
          {
            borderBottomColor: dividerColor,
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <ThemedText style={[styles.optionLabel, { color: textColor }]}>
          {label}
        </ThemedText>
        {showNewBadge && (
          <View style={styles.newBadge}>
            <ThemedText style={styles.newBadgeText}>New</ThemedText>
          </View>
        )}
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
        {/* Backdrop (Dimming overlay inside modal for perfect synchronization) */}
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

            {/* Menu Header */}
            <ThemedText style={[styles.menuTitle, { color: textColor }]}>
              Create
            </ThemedText>

            {/* List options */}
            <View style={styles.optionsList}>
              {renderOption(
                'reel',
                'Reel',
                <ReelsIcon color={textColor} />
              )}
              {renderOption(
                'edits',
                'Edits',
                <EditsIcon color={textColor} />,
                true
              )}
              {renderOption(
                'post',
                'Post',
                <PostIcon color={textColor} />
              )}
              {renderOption(
                'story',
                'Story',
                <StoryIcon color={textColor} />
              )}
              {renderOption(
                'highlights',
                'Highlights',
                <HighlightsIcon color={textColor} />
              )}
              {renderOption(
                'live',
                'Live',
                <LiveIcon color={textColor} />,
                false,
                true
              )}
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
    marginBottom: 10,
    paddingTop: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    paddingVertical: 10,
  },
  titleDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginBottom: 10,
  },
  optionsList: {
    width: '100%',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  optionIconContainer: {
    width: 44,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  newBadge: {
    backgroundColor: '#0095F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
});
