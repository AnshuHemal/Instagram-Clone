import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Share,
  BackHandler,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  runOnJS,
  clamp,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Rect, Path } from 'react-native-svg';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_SIZE = SCREEN_WIDTH * 0.68;

const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface ShareProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
  colors: any;
  isDark: boolean;
  onEditPhoto: () => void;
  sourceLayout: { x: number; y: number; width: number; height: number } | null;
}

const FinderPattern = ({ x, y, color }: { x: number; y: number; color: string }) => (
  <>
    <Rect x={x} y={y} width={28} height={28} rx={6} fill={color} />
    <Rect x={x + 4} y={y + 4} width={20} height={20} rx={4} fill="white" />
    <Rect x={x + 8} y={y + 8} width={12} height={12} rx={2} fill={color} />
  </>
);

const MockQRCode = ({ color }: { color: string }) => (
  <View style={styles.qrCodeWrapper}>
    <Svg width={110} height={110} viewBox="0 0 100 100">
      <FinderPattern x={0} y={0} color={color} />
      <FinderPattern x={72} y={0} color={color} />
      <FinderPattern x={0} y={72} color={color} />
      <Path
        d="M 36,0 h 8 v 4 h -8 z M 52,0 h 12 v 4 h -12 z M 36,12 h 4 v 8 h -4 z M 48,12 h 16 v 4 h -16 z M 36,24 h 12 v 4 h -12 z M 56,24 h 8 v 4 h -8 z M 0,36 h 8 v 8 h -8 z M 16,36 h 12 v 4 h -12 z M 36,36 h 4 v 4 h -4 z M 48,36 h 16 v 4 h -16 z M 72,36 h 12 v 4 h -12 z M 12,48 h 16 v 4 h -16 z M 36,48 h 12 v 8 h -12 z M 56,48 h 4 v 4 h -4 z M 68,48 h 8 v 4 h -8 z M 0,60 h 12 v 4 h -12 z M 20,60 h 8 v 4 h -8 z M 36,60 h 16 v 4 h -16 z M 60,60 h 8 v 8 h -8 z M 80,60 h 4 v 4 h -8 z M 44,72 h 12 v 4 h -12 z M 64,72 h 4 v 12 h -4 z M 76,72 h 8 v 4 h -8 z M 48,84 h 12 v 4 h -12 z M 68,84 h 8 v 4 h -8 z"
        fill={color}
      />
    </Svg>
  </View>
);

// ── Pinchable Avatar ─────────────────────────────────────────────────────────

interface PinchableAvatarProps {
  user: any;
  onEditPhoto: () => void;
  animatedBadgeStyle: any;
  onZoomed: (isZoomed: boolean) => void;
}

const PinchableAvatar: React.FC<PinchableAvatarProps> = ({
  user,
  onEditPhoto,
  animatedBadgeStyle,
  onZoomed,
}) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const hintOpacity = useSharedValue(1);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Notify parent whether we're zoomed in
  const notifyZoom = (s: number) => {
    onZoomed(s > 1.05);
  };

  // ── Pinch gesture ───────────────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
      // Hide hint on first use
      hintOpacity.value = withTiming(0, { duration: 300 });
      runOnJS(setHasInteracted)(true);
    })
    .onUpdate((e) => {
      const next = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      scale.value = next;
      runOnJS(notifyZoom)(next);
    })
    .onEnd(() => {
      // Always snap back to initial position and scale on gesture release (fast, no-bounce)
      scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
      translateX.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
      savedScale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      runOnJS(notifyZoom)(1);
    });

  // ── Pan gesture (only active when zoomed) ──────────────────────────────────
  const panGesture = Gesture.Pan()
    .minPointers(2) // two fingers = same as pinch, moves image while zooming
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      // Bound pan to a reasonable range proportional to zoom level
      const maxPan = (CARD_SIZE * (scale.value - 1)) / 2;
      translateX.value = clamp(
        savedTranslateX.value + e.translationX,
        -maxPan,
        maxPan
      );
      translateY.value = clamp(
        savedTranslateY.value + e.translationY,
        -maxPan,
        maxPan
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // ── Double-tap to reset ─────────────────────────────────────────────────────
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
      translateX.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
      savedScale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      runOnJS(notifyZoom)(1);
    });

  // Compose: simultaneous pinch + pan, double-tap to reset
  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, pinchGesture),
    panGesture
  );

  const imageAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const hintAnimStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

  const localBadgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [1, 1.2], [1, 0], 'clamp');
    return {
      opacity,
      transform: [{ scale: interpolate(scale.value, [1, 1.2], [1, 0.8], 'clamp') }],
    };
  });

  return (
    <View style={styles.frontCardContainer}>
      {/* Circular clip container */}
      <Animated.View style={[styles.cardCircle, imageAnimStyle]}>
        <GestureDetector gesture={composedGesture}>
          <View style={StyleSheet.absoluteFill}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={100} color="#A8A8A8" />
              </View>
            )}
          </View>
        </GestureDetector>

        {/* Pinch-to-zoom hint — fades out after first interaction */}
        {!hasInteracted && (
          <Animated.View style={[styles.zoomHint, hintAnimStyle]} pointerEvents="none">
            <View style={styles.zoomHintPill}>
              <Ionicons name="expand-outline" size={12} color="#FFFFFF" />
              <ThemedText style={styles.zoomHintText}>Pinch to zoom</ThemedText>
            </View>
          </Animated.View>
        )}
      </Animated.View>

      {/* Pencil edit badge */}
      <Animated.View style={[styles.editBadge, animatedBadgeStyle, localBadgeStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onEditPhoto} hitSlop={8}>
          <View style={styles.editBadgeInner}>
            <Feather name="edit-2" size={18} color="#000000" />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({
  visible,
  onClose,
  user,
  colors,
  isDark,
  onEditPhoto,
  sourceLayout,
}) => {
  const { showToast } = useToast();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Transition animation from source to center
  const transitionProgress = useSharedValue(0);
  const flipValue = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsFlipped(false);
      setIsZoomed(false);
      flipValue.value = 0;
      transitionProgress.value = 0;
      transitionProgress.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [visible]);

  const handleClose = () => {
    transitionProgress.value = withTiming(
      0,
      { duration: 180, easing: Easing.out(Easing.ease) },
      (finished) => {
        if (finished) runOnJS(onClose)();
      }
    );
  };

  useEffect(() => {
    if (visible) {
      const backAction = () => {
        handleClose();
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, [visible]);

  const toggleFlip = () => {
    // Don't flip while the user is zoomed in
    if (isZoomed) return;
    const nextFlippedState = !isFlipped;
    setIsFlipped(nextFlippedState);
    flipValue.value = withTiming(nextFlippedState ? 180 : 0, {
      duration: 350,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const handleCopyLink = async () => {
    const profileUrl = `https://instagram.com/${user?.username}`;
    await Clipboard.setStringAsync(profileUrl);
    showToast({ title: 'Link Copied', message: 'Profile link copied to clipboard.', type: 'success' });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${user?.username}'s Instagram profile!`,
        url: `https://instagram.com/${user?.username}`,
      });
    } catch (_) {}
  };

  const handleAddAvatar = () => {
    showToast({ title: 'Coming soon', message: 'Avatar generation is under development.', type: 'info' });
  };

  // Interpolated animation targets
  const targetSize = CARD_SIZE;
  const targetX = (SCREEN_WIDTH - CARD_SIZE) / 2;
  const targetY = (SCREEN_HEIGHT - CARD_SIZE) / 2;

  const source = sourceLayout || {
    x: (SCREEN_WIDTH - 90) / 2,
    y: SCREEN_HEIGHT * 0.3,
    width: 90,
    height: 90,
  };

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: transitionProgress.value,
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(transitionProgress.value, [0, 1], [60, 0]);
    return { opacity: transitionProgress.value, transform: [{ translateY }] };
  });

  const animatedCardStyle = useAnimatedStyle(() => {
    const x = interpolate(transitionProgress.value, [0, 1], [source.x, targetX]);
    const y = interpolate(transitionProgress.value, [0, 1], [source.y, targetY]);
    const size = interpolate(transitionProgress.value, [0, 1], [source.width, targetSize]);
    return { position: 'absolute', left: x, top: y, width: size, height: size };
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
      zIndex: flipValue.value > 90 ? 0 : 1,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: flipValue.value > 90 ? 1 : 0,
    };
  });

  const animatedBadgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(transitionProgress.value, [0.6, 1], [0, 1], 'clamp');
    const scale = interpolate(transitionProgress.value, [0.6, 1], [0.4, 1], 'clamp');
    return { opacity, transform: [{ scale }] };
  });

  if (!visible) return null;

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.overlay, backdropAnimatedStyle]}>
        {/* Fullscreen soft linear gradient backdrop */}
        <LinearGradient
          colors={['#FFFFFF', '#F6F7FC', '#E5E8FC']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        {/* Giant Circle Flipping Card */}
        <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
          <Pressable
            onPress={toggleFlip}
            style={styles.cardTouchWrapper}
            disabled={isZoomed} // disable flip when user is mid-zoom
          >
            {/* FRONT: Pinchable Avatar */}
            <Animated.View style={[{ width: '100%', height: '100%' }, frontAnimatedStyle]}>
              <PinchableAvatar
                user={user}
                onEditPhoto={onEditPhoto}
                animatedBadgeStyle={animatedBadgeStyle}
                onZoomed={setIsZoomed}
              />
            </Animated.View>

            {/* BACK: Circular QR Code */}
            <Animated.View style={[styles.cardCircle, styles.cardCircleBack, backAnimatedStyle]}>
              <View style={styles.backContent}>
                <ThemedText style={styles.backTitleText}>SCAN TO VISIT PROFILE</ThemedText>
                <MockQRCode color="#000000" />
                <ThemedText style={styles.backUsernameText}>@{user?.username}</ThemedText>
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* Bottom Toolbar */}
        <Animated.View style={[styles.bottomBar, footerAnimatedStyle]}>
          <Pressable style={styles.bottomBtn} onPress={handleShare}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-circle-outline" size={26} color="#000000" />
            </View>
            <ThemedText style={styles.btnText}>Share profile</ThemedText>
          </Pressable>

          <Pressable style={styles.bottomBtn} onPress={handleCopyLink}>
            <View style={styles.iconCircle}>
              <Feather name="link" size={24} color="#000000" />
            </View>
            <ThemedText style={styles.btnText}>Copy link</ThemedText>
          </Pressable>

          <Pressable style={styles.bottomBtn} onPress={toggleFlip}>
            <View style={styles.iconCircle}>
              <Ionicons name="qr-code-outline" size={24} color="#000000" />
            </View>
            <ThemedText style={styles.btnText}>QR code</ThemedText>
          </Pressable>

          <Pressable style={styles.bottomBtn} onPress={handleAddAvatar}>
            <View style={styles.iconCircle}>
              <Ionicons name="happy-outline" size={24} color="#000000" />
            </View>
            <ThemedText style={styles.btnText}>Add avatar</ThemedText>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cardTouchWrapper: {
    flex: 1,
  },
  frontCardContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8FC',
    overflow: 'hidden',
  },
  cardCircleBack: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: '4%',
    right: '4%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    zIndex: 2,
  },
  editBadgeInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Zoom hint pill ──────────────────────────────────────────────────────────
  zoomHint: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  zoomHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  zoomHintText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 11,
  },
  // ── QR back side ───────────────────────────────────────────────────────────
  backContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backTitleText: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
    color: '#8E8E93',
    letterSpacing: 1.0,
    marginBottom: 12,
  },
  qrCodeWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 8,
  },
  backUsernameText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  // ── Bottom bar ─────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bottomBtn: {
    alignItems: 'center',
    gap: 6,
    width: SCREEN_WIDTH / 4.5,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  btnText: {
    color: '#000000',
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  // ── Legacy (unused, kept for safety) ──────────────────────────────────────
  topBar: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 50, zIndex: 10 },
  topBarBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  topBarTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  topBarTitle: { fontFamily: Fonts.semiBold, fontSize: 18, color: '#000000' },
  avatarContainer: { width: '100%', height: '100%', position: 'relative' },
});
