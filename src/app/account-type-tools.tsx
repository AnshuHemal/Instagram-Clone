import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

interface OptionItem {
  id: string;
  label: string;
  url?: string;
}

interface OptionSection {
  title: string;
  items: OptionItem[];
}

export default function AccountTypeToolsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handlePressOption = (item: OptionItem) => {
    haptics.light();
    if (item.url) {
      showToast({ message: `Opening ${item.label}...`, type: 'info' });
      Linking.openURL(item.url).catch(() => {
        showToast({ message: 'Could not open verification link.', type: 'error' });
      });
    } else {
      showToast({ message: `${item.label} integration is coming soon!`, type: 'info' });
    }
  };

  const sections: OptionSection[] = [
    {
      title: 'Account type',
      items: [
        { id: 'switch_prof', label: 'Switch to professional account' },
        { id: 'add_prof', label: 'Add new professional account' },
      ],
    },
    {
      title: 'Tools',
      items: [
        { id: 'branded_content', label: 'Branded content' },
        { id: 'request_verification', label: 'Request verification' },
        { id: 'meta_verified', label: 'Sign up for Meta Verified', url: 'https://meta.com/verified' },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Account type and tools</Text>
      </View>

      <View style={styles.content}>
        {sections.map((section, sIndex) => (
          <Animated.View 
            key={section.title}
            entering={FadeInDown.delay(sIndex * 120).duration(400)}
            style={styles.sectionContainer}
          >
            <Text style={[styles.sectionHeader, { color: isDark ? '#A8A8A8' : '#737373' }]}>
              {section.title}
            </Text>
            
            {section.items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handlePressOption(item)}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
                ]}
              >
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#8E8E8F" />
              </Pressable>
            ))}
          </Animated.View>
        ))}
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
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    marginLeft: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    letterSpacing: -0.15,
  },
});
