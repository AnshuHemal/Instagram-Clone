import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';

// ─── "from Meta" text built from primitives to avoid font loading issues ──────

const FromMetaLabel: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(
      300,
      withSpring(0, { damping: 18, stiffness: 120 }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.footerContainer, animStyle]}>
      <Animated.Text
        style={[
          styles.fromText,
          { color: isDark ? '#737373' : '#8E8E8F', fontFamily: Fonts.regular },
        ]}
      >
        from
      </Animated.Text>
      <View style={styles.metaBranding}>
        <Image
          source={require('@/assets/images/meta.png')}
          style={[
            styles.metaIcon,
            { tintColor: isDark ? '#FFFFFF' : '#0064E0' },
          ]}
          contentFit="contain"
        />
        <Animated.Text
          style={[
            styles.metaText,
            {
              color: isDark ? '#FFFFFF' : '#0064E0',
              fontFamily: Fonts.bold,
            },
          ]}
        >
          Meta
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const SplashScreen: React.FC = () => {
  const { isDark } = useTheme();

  // Logo entrance — scale from 0.6 → 1 with a spring, fade in simultaneously
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 380,
      easing: Easing.out(Easing.ease),
    });
    logoScale.value = withSpring(1, {
      damping: 14,
      stiffness: 130,
      mass: 0.9,
    });
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
      ]}
    >
      {/* ── Centred Logo ── */}
      <View style={styles.center}>
        <Animated.View style={[styles.logoWrapper, logoAnimStyle]}>
          <Image
            source={require('@/assets/images/instagram_splash.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      {/* ── Footer Branding ── */}
      <FromMetaLabel isDark={isDark} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 85,
    height: 85,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  footerContainer: {
    alignItems: 'center',
    paddingBottom: 48,
    gap: 6,
  },
  fromText: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  metaBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaIcon: {
    width: 17,
    height: 17,
  },
  metaText: {
    fontSize: 16,
    letterSpacing: 0.6,
  },
});
