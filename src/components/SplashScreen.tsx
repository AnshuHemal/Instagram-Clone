
import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

export const SplashScreen: React.FC = () => {
  const { colors, isDark } = useTheme();

  // Animation values
  const logoOpacity = useSharedValue(1);
  const logoScale = useSharedValue(1.0);
  
  const footerOpacity = useSharedValue(1);
  const footerTranslateY = useSharedValue(0);

  useEffect(() => {
    // Entrance animations removed, showing immediately as requested.
  }, []);

  // Animated styles
  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });

  const animatedFooterStyle = useAnimatedStyle(() => {
    return {
      opacity: footerOpacity.value,
      transform: [{ translateY: footerTranslateY.value }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      {/* Centered Instagram Glyph Logo */}
      <View style={styles.centerContainer}>
        <Animated.View style={[styles.logoWrapper, animatedLogoStyle]}>
          <Image
            source={require('@/assets/images/instagram_splash.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      {/* "from Meta" Branding at the Bottom */}
      <Animated.View style={[styles.footerContainer, animatedFooterStyle]}>
        <Text style={[styles.fromText, { color: isDark ? '#737373' : '#8E8E8F' }]}>from</Text>
        <View style={styles.metaBranding}>
          <Image
            source={require('@/assets/images/meta.png')}
            style={[styles.metaIcon, { tintColor: isDark ? '#FFFFFF' : '#0064E0' }]}
            contentFit="contain"
          />
          <Text style={[styles.metaText, { color: isDark ? '#FFFFFF' : '#0064E0' }]}>Meta</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 85,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  footerContainer: {
    alignItems: 'center',
    paddingBottom: 45,
    gap: 6,
  },
  fromText: {
    fontSize: 12,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  metaBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    width: 18,
    height: 18,
  },
  metaText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
});
