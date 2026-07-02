import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function VotingRemindersSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [votingReminders, setVotingReminders] = useState(true);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleLocationPress = () => {
    haptics.light();
    showToast({
      message: 'Location selection coming soon',
      type: 'info',
    });
  };

  const handleSystemSettingsPress = () => {
    haptics.light();
    showToast({
      message: 'Opening system settings details...',
      type: 'info',
    });
  };

  const divColor = isDark ? '#262626' : '#EFEFEF';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const linkColor = '#0095F6';

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
          Voting reminders
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)}>
          {/* Your location Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: descColor }]}>Your location</Text>
          </View>

          <Pressable
            onPress={handleLocationPress}
            style={({ pressed }) => [
              styles.row,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
            ]}
          >
            <Text style={[styles.rowLabel, { color: labelColor }]}>Gujarat, IN</Text>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#737373' : '#8E8E8F'} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: divColor }]} />

          {/* Voting Reminders Toggle Row */}
          <View style={styles.toggleRow}>
            <View style={styles.labelCol}>
              <Text style={[styles.rowTitle, { color: labelColor }]}>Voting reminders</Text>
              <Text style={[styles.rowDesc, { color: descColor }]}>
                Stay updated with Meta's alerts on voter registration and elections in your area.{' '}
                <Text style={{ color: linkColor }} onPress={() => showToast({ message: 'Redirecting to Learn More...', type: 'info' })}>
                  Learn more
                </Text>
              </Text>
            </View>
            <Switch
              value={votingReminders}
              onValueChange={(val) => {
                haptics.light();
                setVotingReminders(val);
                showToast({
                  message: val ? 'Voting reminders enabled' : 'Voting reminders disabled',
                  type: 'info',
                });
              }}
              trackColor={{ false: isDark ? '#262626' : '#EFEFEF', true: '#3897F0' }}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: divColor }]} />

          {/* Additional Options */}
          <Pressable
            onPress={handleSystemSettingsPress}
            style={styles.systemSettingsRow}
          >
            <Text style={[styles.systemSettingsText, { color: '#3897F0' }]}>
              Additional options in system settings...
            </Text>
            <Text style={[styles.systemSettingsDesc, { color: descColor }]}>
              These settings affect any Instagram accounts logged into this device
            </Text>
          </Pressable>
        </Animated.View>
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
    fontSize: 20,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 0,
  },
  scroll: {
    paddingTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  labelCol: {
    flex: 1,
    paddingRight: 24,
  },
  rowTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    marginBottom: 6,
  },
  rowDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  systemSettingsRow: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  systemSettingsText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    marginBottom: 8,
  },
  systemSettingsDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
