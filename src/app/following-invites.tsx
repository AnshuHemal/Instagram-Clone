import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Share } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolateColor,
  FadeInDown
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

// Custom Reanimated Switch Component
const AnimatedSwitch = ({ value, onValueChange }: { value: boolean; onValueChange: (val: boolean) => void }) => {
  const { isDark } = useTheme();
  const translateX = useSharedValue(value ? 20 : 0);
  
  useEffect(() => {
    translateX.value = withTiming(value ? 20 : 0, { duration: 200 });
  }, [value, translateX]);

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedTrackStyle = useAnimatedStyle(() => {
    const activeColor = '#0095F6'; // Blue active
    const inactiveColor = isDark ? '#3A3A3C' : '#EAEAEA';
    
    const backgroundColor = interpolateColor(
      translateX.value,
      [0, 20],
      [inactiveColor, activeColor]
    );

    return { backgroundColor };
  });

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.switchTrack, animatedTrackStyle]}>
        <Animated.View style={[styles.switchThumb, animatedThumbStyle]} />
      </Animated.View>
    </Pressable>
  );
};

export default function FollowingInvitesScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [confirmFollow, setConfirmFollow] = useState(false);

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const handleSwitchChange = (val: boolean) => {
    haptics.light();
    setConfirmFollow(val);
    showToast({ 
      message: val ? 'Auto-confirm enabled' : 'Auto-confirm disabled', 
      type: 'info' 
    });
  };

  const handleOptionPress = async (optionName: string) => {
    haptics.light();
    const username = user?.username || 'username';
    const inviteMsg = `I'm on Instagram as @${username}. Install the app to follow my photos and videos. https://www.instagram.com/${username}?igsh=ZWN2eXh1YjVraDF4&utm_source=ig_contact_invite`;
    
    switch (optionName) {
      case 'Contacts':
        try {
          await Share.share({
            message: inviteMsg,
          });
        } catch {
          showToast({ message: 'Could not open share menu.', type: 'error' });
        }
        break;
      case 'Copy invite link':
        try {
          await Clipboard.setStringAsync(inviteMsg);
          haptics.success();
          showToast({ message: 'Invite link copied to clipboard!', type: 'success' });
        } catch {
          showToast({ message: 'Failed to copy invite link.', type: 'error' });
        }
        break;
      case 'Invite friends by':
        try {
          await Share.share({
            message: inviteMsg,
          });
        } catch {
          showToast({ message: 'Could not open share menu.', type: 'error' });
        }
        break;
      case 'WhatsApp':
        haptics.light();
        showToast({ message: 'Opening WhatsApp...', type: 'info' });
        Linking.openURL('https://play.google.com/store/apps/details?id=com.whatsapp&hl=en_IN').catch(() => {
          showToast({ message: 'Could not open WhatsApp link.', type: 'error' });
        });
        break;
      case 'Messages':
        haptics.light();
        showToast({ message: 'Opening Messenger...', type: 'info' });
        Linking.openURL('https://play.google.com/store/apps/details?id=com.facebook.orca&hl=en_IN').catch(() => {
          showToast({ message: 'Could not open Messenger link.', type: 'error' });
        });
        break;
      case 'Threads':
        haptics.light();
        showToast({ message: 'Opening Threads...', type: 'info' });
        Linking.openURL('https://play.google.com/store/apps/details?id=com.instagram.barcelona&hl=en_IN').catch(() => {
          showToast({ message: 'Could not open Threads link.', type: 'error' });
        });
        break;
      default:
        showToast({ message: `${optionName} options coming soon!`, type: 'info' });
        break;
    }
  };

  const borderCol = isDark ? '#262626' : '#EAEAEA';
  const textGray = isDark ? '#A8A8A8' : '#737373';
  const sectionTitleColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Following and invites</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        {/* Section 1: Following */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>Following</Text>

          <View style={styles.switchRow}>
            <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Automatically confirm anyone you follow
            </Text>
            <AnimatedSwitch 
              value={confirmFollow} 
              onValueChange={handleSwitchChange} 
            />
          </View>
          
          <Text style={[styles.descriptionText, { color: textGray }]}>
            Automatically confirm follow requests from people who want to follow you back. This won't apply to creators and businesses.
          </Text>

          <Pressable 
            onPress={() => handleOptionPress('Follow contacts')}
            style={({ pressed }) => [
              styles.iconRow,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="person-add-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <Text style={[styles.rowLabelText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Follow contacts
            </Text>
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: borderCol }]} />

        {/* Section 2: Invite your friends */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>Invite your friends</Text>

          {/* Contacts */}
          <Pressable 
            onPress={() => handleOptionPress('Contacts')}
            style={({ pressed }) => [
              styles.iconRow,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }
            ]}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5 name="address-card" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <Text style={[styles.rowLabelText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Contacts
            </Text>
          </Pressable>

          {/* Copy invite link */}
          <Pressable 
            onPress={() => handleOptionPress('Copy invite link')}
            style={({ pressed }) => [
              styles.iconRow,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="link-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} style={{ transform: [{ rotate: '-45deg' }] }} />
            </View>
            <Text style={[styles.rowLabelText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Copy invite link
            </Text>
          </Pressable>

          {/* Invite friends by... */}
          <Pressable 
            onPress={() => handleOptionPress('Invite friends by')}
            style={({ pressed }) => [
              styles.iconRow,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="share-social-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <Text style={[styles.rowLabelText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Invite friends by...
            </Text>
          </Pressable>

          {/* WhatsApp */}
          <Pressable 
            onPress={() => handleOptionPress('WhatsApp')}
            style={({ pressed }) => [
              styles.iconRow,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="logo-whatsapp" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <Text style={[styles.rowLabelText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              WhatsApp
            </Text>
          </Pressable>

          {/* Messages */}
          <Pressable 
            onPress={() => handleOptionPress('Messages')}
            style={({ pressed }) => [
              styles.iconRow,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <Text style={[styles.rowLabelText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Messages
            </Text>
          </Pressable>

          {/* Threads */}
          <Pressable 
            onPress={() => handleOptionPress('Threads')}
            style={({ pressed }) => [
              styles.iconRow,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }
            ]}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="at" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <Text style={[styles.rowLabelText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Threads
            </Text>
          </Pressable>
        </View>
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
  scrollContent: {
    paddingTop: 24,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 17.5,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  descriptionText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18.5,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    flex: 1,
    paddingRight: 16,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  iconContainer: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rowLabelText: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    letterSpacing: -0.15,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  // Switch styling
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 3,
  },
});
