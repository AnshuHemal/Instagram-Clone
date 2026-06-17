/**
 * ErrorState — production-level error state component
 * Shows when a screen fails to load data, with retry button and animations.
 */

import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

interface ErrorStateProps {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  subtitle = 'An error occurred while loading. Please try again.',
  icon = 'alert-circle-outline',
  onRetry,
  retryLabel = 'Try Again',
  compact = false,
}) => {
  const { colors, isDark } = useTheme();
  const btnScale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleRetry = () => {
    haptics.light();
    btnScale.value = withSpring(0.93, { damping: 8 }, () => {
      btnScale.value = withSpring(1, { damping: 10 });
    });
    onRetry?.();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.container, compact && styles.containerCompact]}
    >
      {/* Icon ring */}
      <View
        style={[
          styles.iconRing,
          { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
          compact && styles.iconRingCompact,
        ]}
      >
        <Ionicons
          name={icon}
          size={compact ? 28 : 40}
          color={isDark ? '#636366' : '#AEAEB2'}
        />
      </View>

      <ThemedText style={[styles.title, { color: colors.text }, compact && styles.titleCompact]}>
        {title}
      </ThemedText>

      <ThemedText
        style={[styles.subtitle, { color: colors.textSecondary }, compact && styles.subtitleCompact]}
      >
        {subtitle}
      </ThemedText>

      {onRetry && (
        <Animated.View style={btnStyle}>
          <Pressable
            onPress={handleRetry}
            style={[styles.retryBtn, { backgroundColor: '#0095F6' }]}
          >
            <Feather name="refresh-cw" size={14} color="#FFF" />
            <ThemedText style={styles.retryLabel}>{retryLabel}</ThemedText>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 14,
    paddingVertical: 60,
  },
  containerCompact: {
    paddingVertical: 32,
    gap: 10,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconRingCompact: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 2,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 15,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  subtitleCompact: {
    fontSize: 13,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    marginTop: 6,
  },
  retryLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
