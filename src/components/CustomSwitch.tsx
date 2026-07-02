import React, { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { haptics } from '@/utils/haptics';

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  isDark: boolean;
}

export function CustomSwitch({ value, onValueChange, isDark }: CustomSwitchProps) {
  const translateX = useSharedValue(value ? 20 : 0);

  useEffect(() => {
    translateX.value = withTiming(value ? 20 : 0, { duration: 150 });
  }, [value]);

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onValueChange(!value);
      }}
      style={[
        styles.switchTrack,
        {
          backgroundColor: value
            ? '#3897F0' // Modern vibrant blue
            : (isDark ? '#262626' : '#EFEFEF'), // Modern gray when inactive
        }
      ]}
    >
      <Animated.View style={[styles.switchThumb, thumbAnimatedStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});
