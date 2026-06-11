/**
 * AddPhotoBottomSheet
 *
 * A bottom sheet containing:
 * - Two header tabs (Profile photo icon, Meta Avatar icon) with animated underline indicator.
 * - Options matching the reference image under the first tab:
 *   1. Choose from library (image-outline)
 *   2. Import from Facebook (logo-facebook, colored Facebook blue)
 *   3. Take photo (camera-outline)
 * - Supports swiping down to dismiss.
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_OFFSCREEN = SCREEN_HEIGHT;
const DISMISS_THRESHOLD = 80;

// Custom Meta Avatar icon SVG
const MetaAvatarIcon = ({ color, size = 26 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Face outline */}
    <Path
      d="M6 11c0-3.3 2.7-6 6-6s6 2.7 6 6c0 2.2-1.2 4.1-3 5.2v.8c0 .6-.4 1-1 1h-4c-.6 0-1-.4-1-1v-.8c-1.8-1.1-3-3-3-5.2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Ears */}
    <Path
      d="M6 10c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5M18 10c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Hair on top */}
    <Path
      d="M9 5c.5-1 1.5-2 3-2s2.5 1 3 2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    {/* Small happy eyes */}
    <Path
      d="M9.5 11c0 .3.2.5.5.5s.5-.2.5-.5M13.5 11c0 .3.2.5.5.5s.5-.2.5-.5"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    {/* Smile */}
    <Path
      d="M10.5 13.5c.5.5 1.5.5 2 0"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

interface AddPhotoBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: 'library' | 'facebook' | 'camera' | 'create_avatar') => void;
}

type TabType = 'profile' | 'avatar';

export const AddPhotoBottomSheet: React.FC<AddPhotoBottomSheetProps> = ({
  visible,
  onClose,
  onSelectOption,
}) => {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // ── Animation values
  const translateY = useSharedValue(SHEET_OFFSCREEN);
  const backdropOpacity = useSharedValue(0);
  const dragStartY = useSharedValue(0);

  // Tab indicator translation driven dynamically by scroll offset
  const scrollX = useSharedValue(0);
  const viewPagerRef = useRef<Animated.ScrollView>(null);

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
      setActiveTab('profile'); // reset tab on open
      scrollX.value = 0;
      viewPagerRef.current?.scrollTo({ x: 0, animated: false });
      openSheet();
    } else if (!visible && shouldRender) {
      closeSheet();
    }
  }, [visible, shouldRender, openSheet, closeSheet]);

  // ── Pan gesture to swipe-dismiss ───────────────────────────────────────────

  const panGesture = Gesture.Pan()
    .failOffsetX([-15, 15]) // Fail vertical swipe if user swipes horizontally, allowing pager to scroll
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

  // ── Scroll Handling ────────────────────────────────────────────────────────

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewPagerScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    const newTab: TabType = pageIndex === 0 ? 'profile' : 'avatar';
    if (activeTab !== newTab) {
      setActiveTab(newTab);
    }
  };

  // ── Animated styles ────────────────────────────────────────────────────────

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => {
    const translation = interpolate(
      scrollX.value,
      [0, SCREEN_WIDTH],
      [0, SCREEN_WIDTH / 2],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX: translation }],
    };
  });

  // Theme-derived styles
  const sheetBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const dividerColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const textColor = colors.text;

  // Tab switching handler
  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    const pageIndex = tab === 'profile' ? 0 : 1;
    viewPagerRef.current?.scrollTo({ x: pageIndex * SCREEN_WIDTH, animated: true });
  };

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

            {/* Tabs Row */}
            <View style={styles.tabsRow}>
              {/* Tab 1: Profile */}
              <Pressable
                onPress={() => handleTabPress('profile')}
                style={styles.tabButton}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={activeTab === 'profile' ? textColor : '#8E8E93'}
                />
              </Pressable>

              {/* Tab 2: Meta Avatar */}
              <Pressable
                onPress={() => handleTabPress('avatar')}
                style={styles.tabButton}
              >
                <MetaAvatarIcon
                  color={activeTab === 'avatar' ? textColor : '#8E8E93'}
                />
              </Pressable>

              {/* Underline Indicator */}
              <Animated.View
                style={[
                  styles.tabUnderlineIndicator,
                  { backgroundColor: isDark ? '#FFFFFF' : '#000000' },
                  indicatorStyle,
                ]}
              />
            </View>

            {/* Main Divider line */}
            <View style={[styles.sheetDivider, { backgroundColor: dividerColor }]} />

            {/* View Pager Container */}
            <Animated.ScrollView
              ref={viewPagerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              onMomentumScrollEnd={onViewPagerScrollEnd}
              style={styles.viewPager}
              contentContainerStyle={{ width: SCREEN_WIDTH * 2 }}
              bounces={false}
              overScrollMode="never"
            >
              {/* Page 1: Profile Photo Options */}
              <View style={{ width: SCREEN_WIDTH }}>
                <View style={styles.optionsList}>
                  {/* Option 1: Choose from library */}
                  <Pressable
                    onPress={() => {
                      onSelectOption('library');
                      onClose();
                    }}
                    style={styles.optionRow}
                    android_ripple={{ color: isDark ? '#2C2C2E' : '#F5F5F5' }}
                  >
                    <Ionicons name="image-outline" size={24} color={textColor} style={styles.optionIcon} />
                    <ThemedText style={[styles.optionLabel, { color: textColor }]}>
                      Choose from library
                    </ThemedText>
                  </Pressable>

                  {/* Option 2: Import from Facebook */}
                  <Pressable
                    onPress={() => {
                      onSelectOption('facebook');
                      onClose();
                    }}
                    style={styles.optionRow}
                    android_ripple={{ color: isDark ? '#2C2C2E' : '#F5F5F5' }}
                  >
                    <Ionicons name="logo-facebook" size={24} color="#1877F2" style={styles.optionIcon} />
                    <ThemedText style={[styles.optionLabel, { color: textColor }]}>
                      Import from Facebook
                    </ThemedText>
                  </Pressable>

                  {/* Option 3: Take photo */}
                  <Pressable
                    onPress={() => {
                      onSelectOption('camera');
                      onClose();
                    }}
                    style={styles.optionRow}
                    android_ripple={{ color: isDark ? '#2C2C2E' : '#F5F5F5' }}
                  >
                    <Ionicons name="camera-outline" size={24} color={textColor} style={styles.optionIcon} />
                    <ThemedText style={[styles.optionLabel, { color: textColor }]}>
                      Take photo
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Page 2: Meta Avatar Options */}
              <View style={{ width: SCREEN_WIDTH }}>
                <View style={styles.optionsList}>
                  {/* Tab 2 options: Create/Edit Avatar */}
                  <Pressable
                    onPress={() => {
                      onSelectOption('create_avatar');
                      onClose();
                    }}
                    style={styles.optionRow}
                    android_ripple={{ color: isDark ? '#2C2C2E' : '#F5F5F5' }}
                  >
                    <Ionicons name="happy-outline" size={24} color={textColor} style={styles.optionIcon} />
                    <ThemedText style={[styles.optionLabel, { color: textColor }]}>
                      Create Meta Avatar
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </Animated.ScrollView>
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
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    width: '100%',
    position: 'relative',
    marginTop: 4,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabUnderlineIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH / 2,
    height: 1.5,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginBottom: 12,
  },
  viewPager: {
    width: '100%',
  },
  optionsList: {
    width: '100%',
    paddingVertical: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  optionIcon: {
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 15.5,
    fontFamily: Fonts.regular,
  },
});
