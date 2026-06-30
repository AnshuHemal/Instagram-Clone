import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
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
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_OFFSCREEN = SCREEN_HEIGHT;
const DISMISS_THRESHOLD = 80;

interface InstagramBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  fullHeight?: boolean;
}

export const InstagramBottomSheet: React.FC<InstagramBottomSheetProps> = ({
  visible,
  onClose,
  title,
  headerRight,
  children,
  fullHeight = false,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Animation values
  const translateY = useSharedValue(SHEET_OFFSCREEN);
  const backdropOpacity = useSharedValue(0);
  const dragStartY = useSharedValue(0);

  // Helper to allow animating out before removing from view hierarchy
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    }
  }, [visible]);

  // Open & Close Animations
  const animateIn = () => {
    backdropOpacity.value = withTiming(0.4, { duration: 250 });
    translateY.value = withSpring(0, {
      damping: 18,
      stiffness: 110,
      mass: 0.8,
    });
  };

  const animateOut = (callback?: () => void) => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SHEET_OFFSCREEN, { duration: 200 }, () => {
      runOnJS(setShouldRender)(false);
      if (callback) {
        runOnJS(callback)();
      }
    });
  };

  useEffect(() => {
    if (visible) {
      animateIn();
    } else {
      animateOut();
    }
  }, [visible]);

  const handleClose = () => {
    haptics.light();
    onClose();
  };

  // Gestures for swiping down
  const panGesture = Gesture.Pan()
    .onStart(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Allow dragging downwards only
      if (event.translationY > 0) {
        translateY.value = dragStartY.value + event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        // Snap back up
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!shouldRender) return null;

  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const sheetBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const dragHandleBg = isDark ? '#3E3E3E' : '#DBDBDB';

  return (
    <Modal
      transparent
      visible={shouldRender}
      animationType="none"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.root}>
        {/* Backdrop overlay */}
        <Pressable style={styles.backdropArea} onPress={handleClose}>
          <Animated.View
            style={[
              styles.backdrop,
              animatedBackdropStyle,
            ]}
          />
        </Pressable>

        {/* Bottom Sheet Container */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: sheetBg,
                height: fullHeight ? SCREEN_HEIGHT - insets.top - 12 : undefined,
                maxHeight: fullHeight ? SCREEN_HEIGHT - insets.top - 12 : SCREEN_HEIGHT * 0.85,
              },
              animatedSheetStyle,
            ]}
          >
            {/* Drag Handle Indicator */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: dragHandleBg }]} />
            </View>

            {/* Bottom Sheet Header */}
            <View style={styles.header}>
              <View style={styles.headerSide} />
              <Text style={[styles.headerTitle, { color: labelColor }]}>{title}</Text>
              <View style={styles.headerSide}>{headerRight}</View>
            </View>

            {/* Content Slot */}
            <View style={[styles.content, fullHeight && { flex: 1 }]}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropArea: {
    ...StyleSheet.absoluteFill,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  sheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 4.5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerSide: {
    width: 50,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16.5,
    textAlign: 'center',
    flex: 1,
  },
  content: {
    width: '100%',
  },
});
