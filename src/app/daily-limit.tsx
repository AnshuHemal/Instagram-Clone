/**
 * Daily Limit Screen — /daily-limit
 * Layout matches the official Instagram "Daily limit" configuration screen.
 * Shows list of duration options with radio buttons, dynamic storage via expo-secure-store,
 * and auto-back navigation on select.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

type LimitOption = 'Off' | '15m' | '30m' | '45m' | '1h' | '2h';

interface OptionItem {
  key: LimitOption;
  label: string;
}

const OPTIONS: OptionItem[] = [
  { key: '15m', label: '15 minutes' },
  { key: '30m', label: '30 minutes' },
  { key: '45m', label: '45 minutes' },
  { key: '1h', label: '1 hour' },
  { key: '2h', label: '2 hours' },
  { key: 'Off', label: 'Off' },
];

export default function DailyLimitScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedLimit, setSelectedLimit] = useState<LimitOption>('Off');

  useEffect(() => {
    // Load current setting
    const loadLimit = async () => {
      try {
        const storedVal = await SecureStore.getItemAsync('dailyLimit');
        if (storedVal) {
          setSelectedLimit(storedVal as LimitOption);
        }
      } catch (e) {
        console.warn('Failed to load daily limit:', e);
      }
    };
    loadLimit();
  }, []);

  const handleSelect = async (opt: LimitOption) => {
    haptics.success();
    setSelectedLimit(opt);
    try {
      await SecureStore.setItemAsync('dailyLimit', opt);
    } catch (e) {
      console.warn('Failed to save daily limit:', e);
    }
    // Auto navigate back after selection
    setTimeout(() => {
      router.back();
    }, 200);
  };

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header (Left-aligned title) */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Daily limit</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {/* Description Header */}
        <Text style={[styles.description, { color: isDark ? '#A8A8A8' : '#737373' }]}>
          We'll remind you to close Instagram when you spend this amount of time in a day. We'll also let you know when you're close to reaching the limit.
        </Text>

        {/* Options List */}
        <View style={styles.listContainer}>
          {OPTIONS.map(item => {
            const isSelected = selectedLimit === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => handleSelect(item.key)}
                style={({ pressed }) => [
                  styles.optionRow,
                  { backgroundColor: pressed ? (isDark ? '#1A1A1A' : '#F5F5F5') : 'transparent' }
                ]}
              >
                <Text style={[styles.optionLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {item.label}
                </Text>
                
                {/* Custom radio button layout */}
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={isSelected ? (isDark ? '#FFFFFF' : '#000000') : '#8E8E8F'}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
  },
  headerBackBtn: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 21,
    marginLeft: 12,
    letterSpacing: -0.4,
  },
  body: {
    paddingBottom: 40,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  listContainer: {
    width: '100%',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
  },
});
