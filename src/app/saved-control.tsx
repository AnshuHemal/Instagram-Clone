import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

type TabType = 'All' | 'Collections' | 'Series' | 'Reels' | 'Posts' | 'Audio';

export default function SavedControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>('All');

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleAddCollection = () => {
    haptics.light();
    showToast({
      message: 'New collection creation coming soon!',
      type: 'info',
    });
  };

  const handleTabPress = (tab: TabType) => {
    haptics.light();
    setActiveTab(tab);
  };

  const tabs: TabType[] = ['All', 'Collections', 'Series', 'Reels', 'Posts', 'Audio'];

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const activePillBg = isDark ? '#FFFFFF' : '#000000';
  const activePillText = isDark ? '#000000' : '#FFFFFF';
  const inactivePillBg = 'transparent';
  const inactivePillBorder = isDark ? '#555555' : '#DBDBDB';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 6, borderBottomColor: divColor },
        ]}
      >
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Saved
        </Text>
        <Pressable onPress={handleAddCollection} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="add" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
      </View>

      {/* Category Pills Tab Bar */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => handleTabPress(tab)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isActive ? activePillBg : inactivePillBg,
                    borderColor: isActive ? 'transparent' : inactivePillBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: isActive ? activePillText : labelColor,
                    },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Grid or Empty State Area */}
      <Animated.View key={activeTab} entering={FadeIn.duration(200)} style={styles.content}>
        <View style={styles.emptyWrap}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }]}>
            <Feather
              name={
                activeTab === 'Audio'
                  ? 'music'
                  : activeTab === 'Collections'
                  ? 'folder'
                  : 'bookmark'
              }
              size={36}
              color={isDark ? '#555555' : '#BDBDBD'}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: labelColor }]}>
            {activeTab === 'All'
              ? 'Save photos and videos'
              : activeTab === 'Collections'
              ? 'Organize your saved items'
              : `No saved ${activeTab.toLowerCase()} yet`}
          </Text>
          <Text style={[styles.emptyDesc, { color: descColor }]}>
            {activeTab === 'All'
              ? "When you save photos and videos, they'll appear here."
              : activeTab === 'Collections'
              ? 'Create collections to group your saved posts by theme.'
              : `Saved ${activeTab.toLowerCase()} will be stored in this folder.`}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 20,
  },
  tabContainer: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
  },
});
