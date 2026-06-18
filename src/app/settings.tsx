/**
 * Settings Screen — /settings
 * Production-level settings with sections: Account, Privacy, Notifications,
 * Appearance, Security, About, and Logout.
 * All items animated with stagger FadeInDown.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { haptics } from '@/utils/haptics';

// ─── Setting Row ──────────────────────────────────────────────────────────────

interface SettingRowProps {
  icon: React.ReactNode;
  iconBg?: string;
  label: string;
  sublabel?: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  isDark: boolean;
  colors: any;
  delay?: number;
  showChevron?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  iconBg = '#0095F6',
  label,
  sublabel,
  value,
  onPress,
  rightElement,
  destructive,
  isDark,
  colors,
  delay = 0,
  showChevron = true,
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (!onPress) return;
    scale.value = withSpring(0.97, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    haptics.light();
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(delay).springify()} style={animStyle}>
      <Pressable
        onPress={handlePress}
        disabled={!onPress}
        style={[
          styles.settingRow,
          { borderBottomColor: isDark ? '#2C2C2E' : '#F0F0F0' },
        ]}
      >
        {/* Icon pill */}
        <View style={[styles.settingIconPill, { backgroundColor: iconBg }]}>
          {icon}
        </View>

        {/* Content */}
        <View style={styles.settingContent}>
          <Text
            style={[
              styles.settingLabel,
              { color: destructive ? '#FF3B30' : colors.text },
            ]}
          >
            {label}
          </Text>
          {sublabel && (
            <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>
              {sublabel}
            </Text>
          )}
        </View>

        {/* Right side */}
        {rightElement ?? (
          <View style={styles.settingRight}>
            {value && (
              <Text style={[styles.settingValue, { color: colors.textSecondary }]} numberOfLines={1}>
                {value}
              </Text>
            )}
            {showChevron && onPress && (
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#48484A' : '#C7C7CC'} />
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ label: string; colors: any; delay?: number }> = ({ label, colors, delay = 0 }) => (
  <Animated.View entering={FadeInDown.duration(250).delay(delay)}>
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{label}</Text>
  </Animated.View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false);

  useEffect(() => {
    setIsPrivate(user?.isPrivate ?? false);
  }, [user?.isPrivate]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            haptics.medium();
            await logout();
            router.replace('/(auth)/login' as any);
          },
        },
      ],
    );
  };

  const handlePrivacyToggle = async (val: boolean) => {
    haptics.light();
    setIsPrivate(val);
    try {
      await api.patch('/auth/profile', { isPrivate: val });
    } catch {
      setIsPrivate(!val);
    }
  };

  const rowProps = { isDark, colors };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <BlurView
        intensity={isDark ? 60 : 80}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <View style={{ width: 40 }} />
      </BlurView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Profile card */}
        <Animated.View entering={FadeIn.duration(400)}>
          <Pressable
            onPress={() => router.push('/profile' as any)}
            style={[styles.profileCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
          >
            <LinearGradient
              colors={['#833ab4', '#fd1d1d', '#fcb045']}
              style={styles.profileGradientRing}
            >
              <View style={[styles.profileAvatarInner, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.profileAvatar} />
                ) : (
                  <View style={[styles.profileAvatar, styles.profileAvatarDefault]}>
                    <Ionicons name="person" size={26} color="#AEAEB2" />
                  </View>
                )}
              </View>
            </LinearGradient>

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.name ?? 'Your Name'}
              </Text>
              <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
                @{user?.username ?? 'username'}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={isDark ? '#48484A' : '#C7C7CC'} />
          </Pressable>
        </Animated.View>

        {/* ── Account ── */}
        <SectionHeader label="ACCOUNT" colors={colors} delay={50} />
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <SettingRow
            icon={<Feather name="user" size={16} color="#FFF" />}
            iconBg="#5E5CE6"
            label="Personal Information"
            sublabel="Name, username, email, birthday"
            onPress={() => router.push('/profile' as any)}
            {...rowProps} delay={60}
          />
          <SettingRow
            icon={<Feather name="phone" size={16} color="#FFF" />}
            iconBg="#30D158"
            label="Phone Number"
            value={user?.phone ?? 'Not set'}
            onPress={() => {}}
            {...rowProps} delay={80}
          />
          <SettingRow
            icon={<MaterialCommunityIcons name="email-outline" size={16} color="#FFF" />}
            iconBg="#FF6B35"
            label="Email"
            value={user?.email ?? 'Not set'}
            onPress={() => {}}
            {...rowProps} delay={100}
          />
        </View>

        {/* ── Privacy ── */}
        <SectionHeader label="PRIVACY" colors={colors} delay={120} />
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <SettingRow
            icon={<Ionicons name="lock-closed-outline" size={16} color="#FFF" />}
            iconBg="#FF9F0A"
            label="Private Account"
            sublabel="Only approved followers can see your posts"
            onPress={undefined}
            showChevron={false}
            rightElement={
              <Switch
                value={isPrivate}
                onValueChange={handlePrivacyToggle}
                trackColor={{ false: isDark ? '#3A3A3C' : '#E0E0E0', true: '#0095F6' }}
                thumbColor="#FFFFFF"
              />
            }
            {...rowProps} delay={130}
          />
          <SettingRow
            icon={<Ionicons name="eye-off-outline" size={16} color="#FFF" />}
            iconBg="#FF453A"
            label="Blocked Accounts"
            sublabel="Manage blocked users"
            onPress={() => {}}
            {...rowProps} delay={150}
          />
          <SettingRow
            icon={<Ionicons name="people-outline" size={16} color="#FFF" />}
            iconBg="#30B0C7"
            label="Close Friends"
            sublabel="People who can see your private stories"
            onPress={() => {}}
            {...rowProps} delay={170}
          />
        </View>

        {/* ── Notifications ── */}
        <SectionHeader label="NOTIFICATIONS" colors={colors} delay={190} />
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <SettingRow
            icon={<Ionicons name="notifications-outline" size={16} color="#FFF" />}
            iconBg="#FF9F0A"
            label="Push Notifications"
            sublabel="Likes, comments, follows, mentions"
            onPress={() => Linking.openSettings()}
            {...rowProps} delay={200}
          />
        </View>

        {/* ── Appearance ── */}
        <SectionHeader label="APPEARANCE" colors={colors} delay={220} />
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <SettingRow
            icon={<Ionicons name={isDark ? 'moon' : 'sunny'} size={16} color="#FFF" />}
            iconBg={isDark ? '#5E5CE6' : '#FF9F0A'}
            label="Dark Mode"
            sublabel={isDark ? 'Dark theme active' : 'Light theme active'}
            onPress={undefined}
            showChevron={false}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E0E0E0', true: '#0095F6' }}
                thumbColor="#FFFFFF"
              />
            }
            {...rowProps} delay={230}
          />
        </View>

        {/* ── Security ── */}
        <SectionHeader label="SECURITY" colors={colors} delay={250} />
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <SettingRow
            icon={<Ionicons name="shield-checkmark-outline" size={16} color="#FFF" />}
            iconBg="#30D158"
            label="Change Password"
            sublabel="Update your account password"
            onPress={() => Alert.alert('Coming Soon', 'Password change coming in a future update.')}
            {...rowProps} delay={260}
          />
          <SettingRow
            icon={<MaterialCommunityIcons name="two-factor-authentication" size={16} color="#FFF" />}
            iconBg="#5E5CE6"
            label="Two-Factor Authentication"
            sublabel="Add an extra layer of security"
            onPress={() => Alert.alert('Coming Soon', '2FA coming in a future update.')}
            {...rowProps} delay={280}
          />
        </View>

        {/* ── About ── */}
        <SectionHeader label="ABOUT" colors={colors} delay={300} />
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <SettingRow
            icon={<Feather name="info" size={16} color="#FFF" />}
            iconBg="#636366"
            label="App Version"
            value="1.0.0 (Production)"
            onPress={undefined}
            showChevron={false}
            {...rowProps} delay={310}
          />
          <SettingRow
            icon={<Feather name="file-text" size={16} color="#FFF" />}
            iconBg="#48484A"
            label="Terms of Service"
            onPress={() => Linking.openURL('https://www.instagram.com/about/legal/terms/')}
            {...rowProps} delay={330}
          />
          <SettingRow
            icon={<Ionicons name="lock-closed" size={16} color="#FFF" />}
            iconBg="#3A3A3C"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://privacycenter.instagram.com/policy/')}
            {...rowProps} delay={350}
          />
        </View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.duration(300).delay(380)}>
          <Pressable
            onPress={handleLogout}
            disabled={isLoggingOut}
            style={[styles.logoutBtn, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <Text style={styles.logoutLabel}>Log Out</Text>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  headerBtn: { padding: 8, width: 40 },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 17,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
  },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileGradientRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  profileAvatarDefault: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, gap: 2 },
  profileName: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  profileUsername: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },

  // Section
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginTop: 12,
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

  // Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIconPill: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: { flex: 1, gap: 1 },
  settingLabel: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    letterSpacing: -0.1,
  },
  settingSubLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 120,
  },
  settingValue: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    textAlign: 'right',
  },

  // Logout
  logoutBtn: {
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  logoutLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#FF3B30',
  },
});
