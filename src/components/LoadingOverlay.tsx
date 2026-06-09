import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  useDerivedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useLoading } from '@/contexts/LoadingContext';

const { width, height } = Dimensions.get('window');

export const LoadingOverlay: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isLoading } = useLoading();

  // Animation values
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isLoading) {
      // Fade in overlay
      opacity.value = withTiming(1, { duration: 250 });

      // Start infinite rotation for spinner ring
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1, // infinite
        false // do not reverse
      );

      // Start infinite scale pulsing for Instagram logo
      pulse.value = withRepeat(
        withTiming(1.12, {
          duration: 750,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // infinite
        true // reverse (yoyo)
      );
    } else {
      // Fade out overlay
      opacity.value = withTiming(0, { duration: 200 });
      // Reset values
      rotation.value = 0;
      pulse.value = 1;
    }
  }, [isLoading]);

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      pointerEvents: opacity.value > 0.1 ? 'auto' : 'none',
    };
  });

  const spinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const logoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  if (!isLoading && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        overlayStyle,
        { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.85)' },
      ]}
    >
      <View style={styles.spinnerContainer}>
        {/* Rotating Circular Border */}
        <Animated.View style={[styles.spinnerRing, spinnerStyle, { borderTopColor: colors.primary, borderRightColor: colors.primary }]} />
        
        {/* Pulsing Central Instagram Logo */}
        <Animated.View style={[styles.logoWrapper, logoStyle]}>
          <Image
            source={require('@/assets/images/instagram_splash.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 120,
    height: 120,
  },
  spinnerRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3.5,
    borderColor: 'transparent',
    position: 'absolute',
  },
  logoWrapper: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    // Soft shadow for the central icon wrapper
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  logo: {
    width: 32,
    height: 32,
  },
});
