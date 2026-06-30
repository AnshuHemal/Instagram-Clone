import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function AccountStatusScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const handleAction = (feature: string) => {
    haptics.light();
    showToast({ message: `${feature} is clear! No issues found.`, type: 'success' });
  };

  const userAvatar = user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  const username = user?.username || 'user';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Account Status</Text>
      </View>

      <View style={styles.content}>
        {/* Profile Card Summary */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(450)}
          style={styles.profileSection}
        >
          <Image source={{ uri: userAvatar }} style={styles.profileImage} />
          
          <Text style={[styles.usernameText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {username}
          </Text>
          
          <Text style={[styles.descriptionText, { color: isDark ? '#A8A8A8' : '#262626' }]}>
            See any actions Instagram has taken when your account or content don't follow our standards.{' '}
            <Text 
              onPress={() => handleAction('Account Status Details')}
              style={styles.linkText}
            >
              Learn more about Account Status.
            </Text>
          </Text>
        </Animated.View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {/* Row 1: Removed content and messaging issues */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Pressable
              onPress={() => { haptics.light(); router.push('/removed-content-status' as any); }}
              style={({ pressed }) => [
                styles.optionRow,
                { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
              ]}
            >
              <View style={styles.rowIcon}>
                <Feather name="user" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
              </View>
              
              <Text style={[styles.optionLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Removed content and messaging issues
              </Text>
              
              <Ionicons name="checkmark-circle" size={20} color="#24A647" style={{ marginRight: 8 }} />
              <Ionicons name="chevron-forward" size={16} color="#8E8E8F" />
            </Pressable>
          </Animated.View>

          {/* Row 2: Availability to people under 18 */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Pressable
              onPress={() => { haptics.light(); router.push('/under-18-availability' as any); }}
              style={({ pressed }) => [
                styles.optionRow,
                { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
              ]}
            >
              <View style={styles.rowIcon}>
                <Feather name="search" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
              </View>
              
              <Text style={[styles.optionLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Availability to people under 18
              </Text>
              
              <Ionicons name="checkmark-circle" size={20} color="#24A647" style={{ marginRight: 8 }} />
              <Ionicons name="chevron-forward" size={16} color="#8E8E8F" />
            </Pressable>
          </Animated.View>

          {/* Row 3: Features you can't use */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Pressable
              onPress={() => { haptics.light(); router.push('/features-you-cant-use' as any); }}
              style={({ pressed }) => [
                styles.optionRow,
                { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
              ]}
            >
              <View style={styles.rowIcon}>
                <Feather name="message-square" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
              </View>
              
              <Text style={[styles.optionLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Features you can't use
              </Text>
              
              <Ionicons name="checkmark-circle" size={20} color="#24A647" style={{ marginRight: 8 }} />
              <Ionicons name="chevron-forward" size={16} color="#8E8E8F" />
            </Pressable>
          </Animated.View>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 36,
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 36,
    paddingHorizontal: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  usernameText: {
    fontFamily: Fonts.semiBold,
    fontSize: 23,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  descriptionText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  linkText: {
    color: '#0095F6',
    fontFamily: Fonts.medium,
  },
  optionsList: {
    width: '100%',
    marginTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  rowIcon: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 21,
  },
});
