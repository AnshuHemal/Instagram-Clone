import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

interface ActivityItem {
  id: string;
  label: string;
  icon: string;
  iconType: 'feather' | 'ionicons';
  onPress: () => void;
}

interface ActivitySection {
  title: string;
  items: ActivityItem[];
}

export default function YourActivityControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleComingSoon = (feature: string) => {
    haptics.light();
    showToast({
      message: `${feature} management is coming soon!`,
      type: 'info',
    });
  };

  const handleLearnMore = () => {
    haptics.light();
    showToast({
      message: 'View, archive, delete, or download all of your activity history.',
      type: 'info',
    });
  };

  const sections: ActivitySection[] = [
    {
      title: 'Interactions',
      items: [
        { id: 'likes', label: 'Likes', icon: 'heart', iconType: 'feather', onPress: () => handleComingSoon('Likes') },
        { id: 'comments', label: 'Comments', icon: 'message-circle', iconType: 'feather', onPress: () => handleComingSoon('Comments') },
        { id: 'reposts', label: 'Reposts', icon: 'repeat', iconType: 'feather', onPress: () => handleComingSoon('Reposts') },
        { id: 'tags', label: 'Tags', icon: 'user', iconType: 'feather', onPress: () => handleComingSoon('Tags') },
        { id: 'stickers', label: 'Sticker responses', icon: 'smile', iconType: 'feather', onPress: () => handleComingSoon('Sticker responses') },
        { id: 'reviews', label: 'Reviews', icon: 'star', iconType: 'feather', onPress: () => handleComingSoon('Reviews') },
      ],
    },
    {
      title: 'Removed and archived content',
      items: [
        { id: 'deleted', label: 'Recently deleted', icon: 'trash-2', iconType: 'feather', onPress: () => handleComingSoon('Recently deleted') },
        { id: 'archived', label: 'Archived', icon: 'clock', iconType: 'feather', onPress: () => handleComingSoon('Archived') },
      ],
    },
    {
      title: 'Content you shared',
      items: [
        { id: 'posts', label: 'Posts', icon: 'grid', iconType: 'feather', onPress: () => handleComingSoon('Posts') },
        { id: 'reels', label: 'Reels', icon: 'video', iconType: 'feather', onPress: () => handleComingSoon('Reels') },
        { id: 'highlights', label: 'Highlights', icon: 'heart', iconType: 'feather', onPress: () => handleComingSoon('Highlights') },
      ],
    },
    {
      title: 'Suggested content',
      items: [
        { id: 'not_interested', label: 'Not interested', icon: 'eye-off', iconType: 'feather', onPress: () => handleComingSoon('Not interested preferences') },
        { id: 'interested', label: 'Interested', icon: 'eye', iconType: 'feather', onPress: () => handleComingSoon('Interested preferences') },
      ],
    },
    {
      title: 'How you use Instagram',
      items: [
        { id: 'time', label: 'Time management', icon: 'hourglass', iconType: 'feather', onPress: () => { haptics.light(); router.push('/time-management' as any); } },
        { id: 'watch_history', label: 'Watch history', icon: 'play-circle', iconType: 'feather', onPress: () => handleComingSoon('Watch history') },
        { id: 'account_history', label: 'Account history', icon: 'file-text', iconType: 'feather', onPress: () => handleComingSoon('Account history') },
        { id: 'recent_searches', label: 'Recent searches', icon: 'search', iconType: 'feather', onPress: () => handleComingSoon('Recent searches') },
        { id: 'link_history', label: 'Link History', icon: 'link', iconType: 'feather', onPress: () => handleComingSoon('Link History') },
      ],
    },
  ];

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const sectionTitleColor = isDark ? '#A8A8A8' : '#737373';
  const separatorBg = isDark ? '#1C1C1E' : '#F5F5F5';

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
          Your activity
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Block */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.introBlock}>
          <Text style={[styles.introTitle, { color: labelColor }]}>
            One place to manage your activity
          </Text>
          <Text style={[styles.introDesc, { color: descColor }]}>
            View and manage your interactions, content and activity.{' '}
            <Text style={styles.blueLink} onPress={handleLearnMore}>
              Learn more
            </Text>
          </Text>
        </Animated.View>

        {sections.map((section, sIdx) => (
          <View key={section.title}>
            {sIdx > 0 && <View style={[styles.separator, { backgroundColor: separatorBg }]} />}

            <Animated.View entering={FadeInDown.delay(150 + sIdx * 50).duration(300)}>
              <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
                {section.title}
              </Text>

              <View style={styles.card}>
                {section.items.map((item, itemIdx) => (
                  <View key={item.id}>
                    {itemIdx > 0 && (
                      <View style={[styles.innerDivider, { backgroundColor: isDark ? '#262626' : '#EEEEEE' }]} />
                    )}
                    <Pressable
                      onPress={item.onPress}
                      style={({ pressed }) => [
                        styles.row,
                        pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
                      ]}
                    >
                      <View style={styles.rowLeft}>
                        {item.iconType === 'feather' ? (
                          <Feather name={item.icon as any} size={22} color={labelColor} style={styles.rowIcon} />
                        ) : (
                          <Ionicons name={item.icon as any} size={22} color={labelColor} style={styles.rowIcon} />
                        )}
                        <Text style={[styles.rowLabel, { color: labelColor }]}>{item.label}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>
        ))}
      </ScrollView>
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
    paddingLeft: 38,
  },
  scroll: {
    paddingVertical: 14,
  },
  introBlock: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
  },
  introTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 21.5,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  introDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  blueLink: {
    color: '#0095F6',
    fontFamily: Fonts.semiBold,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 10,
  },
  card: {
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 14,
    width: 24,
    textAlign: 'center',
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54,
  },
  separator: {
    height: 10,
    marginVertical: 14,
  },
});
