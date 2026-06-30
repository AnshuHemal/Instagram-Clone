import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

type ModeOption = 'on' | 'off' | 'system';

export default function DarkModeSettingsScreen() {
  const { colors, theme, setThemeMode, isDark } = useTheme();
  const systemScheme = useColorScheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Determine initial selection based on theme context & system color scheme
  const getInitialMode = (): ModeOption => {
    // If context theme matches system default, it is system
    const systemTheme = systemScheme === 'dark' ? 'dark' : 'light';
    if (theme === systemTheme) {
      return 'system';
    }
    return theme === 'dark' ? 'on' : 'off';
  };

  const [selectedMode, setSelectedMode] = useState<ModeOption>('system');

  useEffect(() => {
    setSelectedMode(getInitialMode());
  }, [theme, systemScheme]);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleSelectMode = (mode: ModeOption) => {
    if (mode === selectedMode) return;
    haptics.light();
    setSelectedMode(mode);

    if (mode === 'on') {
      setThemeMode('dark');
      showToast({ message: 'Dark mode turned on', type: 'info' });
    } else if (mode === 'off') {
      setThemeMode('light');
      showToast({ message: 'Dark mode turned off', type: 'info' });
    } else {
      const activeSystemTheme = systemScheme === 'dark' ? 'dark' : 'light';
      setThemeMode(activeSystemTheme);
      showToast({ message: `System default theme applied (${activeSystemTheme})`, type: 'info' });
    }
  };

  const radioBorderColor = isDark ? '#FFFFFF' : '#000000';
  const radioMutedColor = isDark ? '#555555' : '#C7C7CC';
  const textGray = isDark ? '#A8A8A8' : '#737373';

  // Custom Radio Button Component
  const RadioButton = ({ selected }: { selected: boolean }) => (
    <View style={[
      styles.radioCircle, 
      { borderColor: selected ? radioBorderColor : radioMutedColor }
    ]}>
      {selected && <View style={[styles.radioDot, { backgroundColor: radioBorderColor }]} />}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Dark mode</Text>
      </View>

      <View style={styles.content}>
        {/* On Option */}
        <Animated.View entering={FadeInDown.delay(100).duration(350)}>
          <Pressable 
            onPress={() => handleSelectMode('on')}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
            ]}
          >
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>On</Text>
            <RadioButton selected={selectedMode === 'on'} />
          </Pressable>
        </Animated.View>

        {/* Off Option */}
        <Animated.View entering={FadeInDown.delay(180).duration(350)}>
          <Pressable 
            onPress={() => handleSelectMode('off')}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
            ]}
          >
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Off</Text>
            <RadioButton selected={selectedMode === 'off'} />
          </Pressable>
        </Animated.View>

        {/* System Default Option */}
        <Animated.View entering={FadeInDown.delay(260).duration(350)}>
          <Pressable 
            onPress={() => handleSelectMode('system')}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
            ]}
          >
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>System default</Text>
            <RadioButton selected={selectedMode === 'system'} />
          </Pressable>
          <Text style={[styles.descriptionText, { color: textGray }]}>
            We'll adjust your appearance based on your device's system settings.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  headerBackBtn: {
    position: 'absolute',
    left: 12,
    bottom: 8,
    padding: 6,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    letterSpacing: -0.15,
  },
  descriptionText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18.5,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
