import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function AboutProfileScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleOpenGuidelines = () => {
    haptics.light();
    showToast({ message: 'Opening guidelines details...', type: 'info' });
    Linking.openURL('https://help.instagram.com/477434105621119/').catch(() => {
      showToast({ message: 'Could not open help link.', type: 'error' });
    });
  };

  const userAvatar = user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  const username = user?.username || 'user';

  // Format created date dynamically
  const getJoinDate = () => {
    return 'June 2026';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>About your profile</Text>
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
          
          <Text style={[styles.descriptionText, { color: isDark ? '#A8A8A8' : '#737373' }]}>
            To help keep our community authentic, we're showing information about profiles on Instagram. People can see this by tapping on the ••• on your profile and choosing About This Account.{' '}
            <Text 
              onPress={handleOpenGuidelines}
              style={styles.linkText}
            >
              See why this information is important.
            </Text>
          </Text>
        </Animated.View>

        {/* Date Joined row */}
        <Animated.View 
          entering={FadeInDown.delay(250).duration(400)}
          style={styles.infoList}
        >
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Feather name="calendar" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.infoLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Date joined
              </Text>
              <Text style={[styles.infoValue, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                {getJoinDate()}
              </Text>
            </View>
          </View>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 36,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 36,
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
    paddingHorizontal: 6,
  },
  linkText: {
    color: '#0095F6',
    fontFamily: Fonts.medium,
  },
  infoList: {
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
});
