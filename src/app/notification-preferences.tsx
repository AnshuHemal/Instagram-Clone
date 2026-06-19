/**
 * Notification Preferences Screen — /notification-preferences
 * Toggle each notification type on/off with optimistic state.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { api } from '@/services/api';
import { haptics } from '@/utils/haptics';
import { Fonts } from '@/constants/theme';

interface NotifPrefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  directMessages: boolean;
  reelLikes: boolean;
  storyReplies: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  likes: true,
  comments: true,
  follows: true,
  mentions: true,
  directMessages: true,
  reelLikes: true,
  storyReplies: true,
};

interface PrefRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  sublabel?: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  isDark: boolean;
  colors: any;
  delay: number;
}

const PrefRow: React.FC<PrefRowProps> = ({
  icon, iconBg, label, sublabel, value, onToggle, isDark, colors, delay,
}) => (
  <Animated.View entering={FadeInDown.duration(280).delay(delay).springify()}>
    <View style={[styles.row, { borderBottomColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
      <View style={[styles.iconPill, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.medium }]}>{label}</Text>
        {sublabel && <Text style={[styles.rowSub, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { haptics.light(); onToggle(v); }}
        trackColor={{ false: isDark ? '#3A3A3C' : '#E0E0E0', true: '#0095F6' }}
        thumbColor="#FFFFFF"
      />
    </View>
  </Animated.View>
);

export default function NotificationPreferencesScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  // Load prefs from server on mount
  useEffect(() => {
    api.get('/auth/notification-preferences')
      .then(res => { if (res.data?.data) setPrefs(res.data.data); })
      .catch(() => {});
  }, []);

  const updatePref = async (key: keyof NotifPrefs, value: boolean) => {
    const prev = prefs[key];
    setPrefs(p => ({ ...p, [key]: value }));
    try {
      await api.patch('/auth/notification-preferences', { [key]: value });
    } catch {
      setPrefs(p => ({ ...p, [key]: prev }));
    }
  };

  const ROW_PROPS = { isDark, colors };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}>
        <View style={[styles.header, { borderBottomColor: isDark ? '#2C2C2E' : '#F0F0F0' }]}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInDown.duration(200)}>
          <Text style={[styles.sectionNote, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            Choose which notifications you receive from Instagram.
          </Text>
        </Animated.View>

        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <PrefRow {...ROW_PROPS} delay={60}
            icon={<Ionicons name="heart" size={15} color="#FFF" />}
            iconBg="#FF3040"
            label="Likes on Posts"
            sublabel="When someone likes your post"
            value={prefs.likes}
            onToggle={v => updatePref('likes', v)}
          />
          <PrefRow {...ROW_PROPS} delay={80}
            icon={<Ionicons name="chatbubble" size={14} color="#FFF" />}
            iconBg="#0095F6"
            label="Comments"
            sublabel="When someone comments on your post"
            value={prefs.comments}
            onToggle={v => updatePref('comments', v)}
          />
          <PrefRow {...ROW_PROPS} delay={100}
            icon={<Ionicons name="person-add" size={14} color="#FFF" />}
            iconBg="#30D158"
            label="New Followers"
            sublabel="When someone follows you"
            value={prefs.follows}
            onToggle={v => updatePref('follows', v)}
          />
          <PrefRow {...ROW_PROPS} delay={120}
            icon={<Ionicons name="at" size={15} color="#FFF" />}
            iconBg="#FF9F0A"
            label="Mentions"
            sublabel="When someone mentions you in a post or comment"
            value={prefs.mentions}
            onToggle={v => updatePref('mentions', v)}
          />
          <PrefRow {...ROW_PROPS} delay={140}
            icon={<Ionicons name="chatbubbles" size={14} color="#FFF" />}
            iconBg="#5E5CE6"
            label="Direct Messages"
            sublabel="When you receive a new message"
            value={prefs.directMessages}
            onToggle={v => updatePref('directMessages', v)}
          />
          <PrefRow {...ROW_PROPS} delay={160}
            icon={<Ionicons name="film" size={14} color="#FFF" />}
            iconBg="#FF453A"
            label="Reel Likes"
            sublabel="When someone likes your reel"
            value={prefs.reelLikes}
            onToggle={v => updatePref('reelLikes', v)}
          />
          <PrefRow {...ROW_PROPS} delay={180}
            icon={<Ionicons name="eye" size={14} color="#FFF" />}
            iconBg="#30B0C7"
            label="Story Replies"
            sublabel="When someone replies to your story"
            value={prefs.storyReplies}
            onToggle={v => updatePref('storyReplies', v)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 8, width: 40 },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 17,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  scrollContent: { padding: 16, paddingBottom: 60, gap: 12 },
  sectionNote: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  section: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconPill: {
    width: 34, height: 34,
    borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1, gap: 1 },
  rowLabel: { fontSize: 15, letterSpacing: -0.1 },
  rowSub: { fontSize: 12 },
});
