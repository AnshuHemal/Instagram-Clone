import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

type TabType = 'active' | 'expired' | 'removed';

export default function AppsWebsitesScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const handleTabPress = (tab: TabType) => {
    if (tab === activeTab) return;
    haptics.light();
    setActiveTab(tab);
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'active':
        return {
          title: 'No active apps',
          description: 'You don\'t have any active authorized apps',
        };
      case 'expired':
        return {
          title: 'No expired apps',
          description: 'You don\'t have any expired authorized apps',
        };
      case 'removed':
        return {
          title: 'No removed apps',
          description: 'You don\'t have any removed apps',
        };
    }
  };

  const content = getTabContent();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Apps and websites</Text>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: isDark ? '#262626' : '#EAEAEA' }]}>
        {(['active', 'expired', 'removed'] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab.charAt(0).toUpperCase() + tab.slice(1);
          return (
            <Pressable
              key={tab}
              onPress={() => handleTabPress(tab)}
              style={[
                styles.tabItem,
                isActive && { borderBottomColor: isDark ? '#FFFFFF' : '#000000' }
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#737373' : '#8E8E8F') },
                  isActive && { fontFamily: Fonts.semiBold }
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        <Animated.View
          key={activeTab}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={Layout.springify()}
          style={styles.innerContent}
        >
          {/* Lock Icon Illustration Frame */}
          <View style={[styles.iconOuterCircle, { borderColor: isDark ? '#FFFFFF' : '#000000' }]}>
            <Feather name="lock" size={48} color={isDark ? '#FFFFFF' : '#000000'} />
          </View>

          {/* Texts */}
          <Text style={[styles.contentTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {content.title}
          </Text>
          <Text style={[styles.contentDescription, { color: isDark ? '#A8A8A8' : '#737373' }]}>
            {content.description}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOuterCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  contentTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 25,
    marginBottom: 12,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  contentDescription: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
});
