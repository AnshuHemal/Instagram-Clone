import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ─── Custom Icons ─────────────────────────────────────────────────────────────

const SuccessIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#34C759" strokeWidth={2} />
    <Path
      d="m8.5 12.5 2.5 2.5 5-6"
      stroke="#34C759"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ErrorIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#FF3B30" strokeWidth={2} />
    <Path
      d="m9 9 6 6M15 9l-6 6"
      stroke="#FF3B30"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const InfoIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    <Path
      d="M12 11v5M12 8h.01"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ThreadsIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    {/* Clean rendering of the Threads "@" scroll logo */}
    <Path
      d="M12 7c-2.5 0-4.5 2-4.5 4.5S9.5 16 12 16c1.2 0 2.2-.4 3-1.1v.6c0 1.4-1.1 2.5-2.5 2.5-.8 0-1.5-.4-1.9-1-.2-.3-.5-.4-.8-.2-.3.2-.4.5-.2.8.6.8 1.6 1.4 2.9 1.4 1.9 0 3.5-1.6 3.5-3.5v-3.5C16 9 14 7 12 7zm0 7.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5c1.1 0 2 .7 2.3 1.7.1.3.4.5.7.4.3-.1.5-.4.4-.7-.5-1.4-1.7-2.4-3.4-2.4-2.2 0-4 1.8-4 4s1.8 4 4 4 3-1.3 3.4-2.8c.1-.3-.1-.6-.4-.7-.3-.1-.6.1-.7.4-.3 1.1-1.2 1.9-2.3 1.9z"
      fill={color}
    />
  </Svg>
);

// ─── Provider Component ────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  // Check if we are currently inside the tabs navigator to adjust bottom spacing
  const isTabScreen = segments[0] === '(tabs)';

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ToastType>('info');

  const timerRef = useRef<any>(null);

  // Position animated value starts offscreen (pushed down)
  const OFFSCREEN_Y = 350;
  const translateY = useSharedValue(OFFSCREEN_Y);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    translateY.value = withTiming(
      OFFSCREEN_Y,
      { duration: 250, easing: Easing.in(Easing.ease) },
      (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
        }
      }
    );
  }, [translateY]);

  const showToast = useCallback(
    ({ message: msg, title: t = '', type: tp = 'info', duration = 3000 }: ToastOptions) => {
      // Clear existing timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setMessage(msg);
      setTitle(t);
      setType(tp);
      setVisible(true);

      // Slide up animation to center layout 0
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 110,
        mass: 0.8,
      });

      // Set hide timer
      timerRef.current = setTimeout(() => {
        dismissToast();
      }, duration);
    },
    [translateY, dismissToast]
  );

  const clearToastTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Pan Gesture (Swipe down to dismiss) ──────────────────────────────────────

  const dragStartY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      dragStartY.value = translateY.value;
      runOnJS(clearToastTimer)();
    })
    .onUpdate((event) => {
      // Only allow dragging downwards (towards offscreen)
      const newY = dragStartY.value + event.translationY;
      translateY.value = Math.max(0, newY);
    })
    .onEnd((event) => {
      const isDraggingDown = event.translationY > 15 || event.velocityY > 300;
      if (isDraggingDown) {
        runOnJS(dismissToast)();
      } else {
        // Snap back to 0 position
        translateY.value = withSpring(0, { damping: 12, stiffness: 120 });
      }
    });

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Style properties
  const toastBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const toastBorder = isDark ? '#2C2C2E' : '#EAEAEA';
  const infoThemeColor = isDark ? '#FFFFFF' : '#000000'; // threads-style black & white theme for info

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'info':
      default:
        return title === 'Threads' ? (
          <ThreadsIcon color={infoThemeColor} />
        ) : (
          <InfoIcon color="#007AFF" />
        );
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast: dismissToast }}>
      {children}

      {visible && (
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.toastContainer,
              {
                backgroundColor: toastBg,
                borderColor: toastBorder,
                bottom: isTabScreen ? insets.bottom + 65 : insets.bottom + 16,
              },
              animatedStyle,
            ]}
          >
            <View style={styles.contentRow}>
              {/* Left Icon */}
              <View style={styles.iconWrapper}>{renderIcon()}</View>

              {/* Text Area */}
              <View style={styles.textContainer}>
                {title.length > 0 && (
                  <ThemedText style={[styles.toastTitle, { color: colors.text }]}>
                    {title}
                  </ThemedText>
                )}
                <ThemedText style={[styles.toastMessage, { color: colors.textSecondary }]}>
                  {message}
                </ThemedText>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  toastTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    lineHeight: 18,
  },
  toastMessage: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 17,
  },
});
