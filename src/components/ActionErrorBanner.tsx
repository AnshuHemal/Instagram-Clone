import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActionError } from '@/contexts/ActionErrorContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export const ActionErrorBanner: React.FC = () => {
  const { currentError, dismissError } = useActionError();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (currentError) {
      // Spring in
      translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      // Slide out
      translateY.value = withTiming(-80, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [currentError]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!currentError) return null;

  return (
    <Animated.View
      style={[styles.banner, { paddingTop: insets.top + 8 }, animStyle]}
    >
      <View style={styles.content}>
        <Ionicons name="alert-circle" size={16} color="#FFF" />
        <Text style={styles.text} numberOfLines={1}>
          {currentError.message}
        </Text>
        {currentError.onRetry && (
          <Pressable
            onPress={() => {
              haptics.light();
              currentError.onRetry?.();
              dismissError();
            }}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        )}
      </View>
      <Pressable onPress={dismissError} style={styles.closeBtn} hitSlop={10}>
        <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.7)" />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    backgroundColor: '#E53E3E', // Beautiful premium Instagram error red
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 11,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 10,
  },
});
