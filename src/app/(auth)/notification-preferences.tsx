import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { api } from '@/services/api';

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      key: 'likes',
      label: 'Likes',
      description: 'When someone likes your post or reel',
      icon: 'heart-outline',
      enabled: true,
    },
    {
      key: 'comments',
      label: 'Comments',
      description: 'When someone comments on your post or reel',
      icon: 'chatbubble-outline',
      enabled: true,
    },
    {
      key: 'follows',
      label: 'Follow requests',
      description: 'When someone follows you',
      icon: 'person-add-outline',
      enabled: true,
    },
    {
      key: 'messages',
      label: 'Messages',
      description: 'When someone sends you a message',
      icon: 'mail-outline',
      enabled: true,
    },
    {
      key: 'firstPost',
      label: 'First posts & reels',
      description: 'When friends share their first post or reel',
      icon: 'sparkles-outline',
      enabled: false,
    },
    {
      key: 'liveVideos',
      label: 'Live videos',
      description: 'When accounts you follow go live',
      icon: 'videocam-outline',
      enabled: false,
    },
    {
      key: 'reminders',
      label: 'Reminders',
      description: 'Reminders from Instagram you might have missed',
      icon: 'alarm-outline',
      enabled: false,
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  // Disable back gesture
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        router.back();
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }, [router])
  );

  const toggleSetting = (key: string) => {
    setSettings(prev =>
      prev.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save preferences to backend (maps to push token registration)
      await api.patch('/auth/profile', {
        notificationPreferences: settings.reduce((acc, s) => ({
          ...acc,
          [s.key]: s.enabled,
        }), {}),
      });
      setTimeout(() => {
        setIsSaving(false);
        router.back();
      }, 300);
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle" style={[styles.title, { color: colors.text }]}>
          Notification Preferences
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInRight.duration(250)}>
          {/* Push Notifications Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Push Notifications
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Choose what notifications you receive on this device.
              </ThemedText>
            </View>

            <View style={[styles.settingsCard, { 
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? '#2C2C2E' : '#E5E5E5',
            }]}>
              {settings.map((setting, index) => {
                const isLast = index === settings.length - 1;
                return (
                  <Pressable
                    key={setting.key}
                    onPress={() => toggleSetting(setting.key)}
                    style={[
                      styles.settingRow,
                      !isLast && { 
                        borderBottomWidth: 0.5, 
                        borderBottomColor: isDark ? '#2C2C2E' : '#F0F0F0' 
                      }
                    ]}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}>
                        <Ionicons 
                          name={setting.icon as any} 
                          size={20} 
                          color={setting.enabled ? '#0064E0' : colors.textSecondary} 
                        />
                      </View>
                      <View style={styles.settingText}>
                        <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
                          {setting.label}
                        </ThemedText>
                        <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                          {setting.description}
                        </ThemedText>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.toggle,
                        {
                          backgroundColor: setting.enabled ? '#0064E0' : (isDark ? '#3A3A3C' : '#E5E5E5'),
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleThumb,
                          {
                            transform: [{ translateX: setting.enabled ? 16 : 0 }],
                          },
                        ]}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Email & SMS Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                More Notification Settings
              </ThemedText>
            </View>

            <Pressable
              onPress={() => {}}
              style={[styles.linkRow, { 
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? '#2C2C2E' : '#E5E5E5',
              }]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                </View>
                <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
                  Email Notifications
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              onPress={() => {}}
              style={[styles.linkRow, { 
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? '#2C2C2E' : '#E5E5E5',
                marginTop: 8,
              }]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}>
                  <Ionicons name="chatbubbles-outline" size={20} color={colors.textSecondary} />
                </View>
                <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
                  SMS Notifications
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Save button at bottom */}
      <View style={[styles.footer, { borderTopColor: isDark ? '#2C2C2E' : '#E5E5E5' }]}>
        <Pressable
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: '#0064E0', opacity: isSaving ? 0.6 : 1 }]}
          disabled={isSaving}
        >
          <ThemedText style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    height: 50,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14.5,
    fontFamily: Fonts.medium,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 0.5,
  },
  saveButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 15.5,
  },
});