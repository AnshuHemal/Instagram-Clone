/**
 * Account Privacy Screen — /account-privacy
 * Rebuilt to match the official Instagram "Account privacy" screen.
 * Allows users to toggle their account between Private and Public,
 * featuring beautiful custom confirmation modals, haptic feedback,
 * light/dark mode support, and state synchronization.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Custom Animated Switch component (Vibrant blue design to match Sleep Mode) ──────────────

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  isDark: boolean;
}

function CustomSwitch({ value, onValueChange, isDark }: CustomSwitchProps) {
  const translateX = useSharedValue(value ? 20 : 0);

  useEffect(() => {
    translateX.value = withTiming(value ? 20 : 0, { duration: 150 });
  }, [value]);

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onValueChange(!value);
      }}
      style={[
        styles.switchTrack,
        {
          backgroundColor: value
            ? '#3897F0' // Modern vibrant blue
            : (isDark ? '#262626' : '#EFEFEF'), // Modern gray when inactive
        }
      ]}
    >
      <Animated.View style={[styles.switchThumb, thumbAnimatedStyle]} />
    </Pressable>
  );
}

export default function AccountPrivacyScreen() {
  const { colors, isDark } = useTheme();
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingVal, setPendingVal] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state with global context on mount
  useEffect(() => {
    if (user) {
      setIsPrivate(user.isPrivate ?? false);
    }
  }, [user?.isPrivate]);

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const handleToggleValueChange = (newVal: boolean) => {
    haptics.light();
    setPendingVal(newVal);
    setShowConfirmModal(true);
  };

  const confirmPrivacyChange = async () => {
    if (pendingVal === null) return;
    haptics.medium();
    setShowConfirmModal(false);
    setIsUpdating(true);

    const oldVal = isPrivate;
    // Optimistic UI update
    setIsPrivate(pendingVal);

    try {
      await api.patch('/auth/profile', { isPrivate: pendingVal });
      await refreshProfile();
    } catch (error) {
      // Revert if request fails
      setIsPrivate(oldVal);
      Alert.alert('Error', 'Failed to update account privacy. Please try again.');
    } finally {
      setIsUpdating(false);
      setPendingVal(null);
    }
  };

  const cancelPrivacyChange = () => {
    haptics.light();
    setShowConfirmModal(false);
    setPendingVal(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Account privacy</Text>
      </View>

      {/* Privacy Switch Row */}
      <View style={styles.content}>
        <View style={styles.privacyRow}>
          <Text style={[styles.privacyLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Private account
          </Text>
          {isUpdating ? (
            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} style={{ marginRight: 8 }} />
          ) : (
            <CustomSwitch
              value={isPrivate}
              onValueChange={handleToggleValueChange}
              isDark={isDark}
            />
          )}
        </View>

        {/* Informative Descriptions */}
        <Text style={[styles.description, { color: isDark ? '#A8A8A8' : '#737373' }]}>
          When your account is public, your profile and posts can be seen by anyone, on or off Instagram, even if they don't have an Instagram account.
        </Text>

        <Text style={[styles.description, { color: isDark ? '#A8A8A8' : '#737373' }]}>
          When your account is private, only the followers you approve can see what you share, including your photos or videos on hashtag and location pages, and your followers and following lists. Certain info on your profile, like your profile picture and username, is visible to everyone on and off Instagram.{' '}
          <Text style={styles.learnMore}>Learn more</Text>
        </Text>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelPrivacyChange}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.dismissOverlay} onPress={cancelPrivacyChange} />
          
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.modalCard, { backgroundColor: isDark ? '#262626' : '#FFFFFF' }]}
          >
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {pendingVal === true ? 'Switch to private account?' : 'Change to public account?'}
            </Text>
            
            <Text style={[styles.modalMessage, { color: isDark ? '#A8A8A8' : '#737373' }]}>
              {pendingVal === true
                ? "Only your followers will be able to see your photos and videos. This won't change who can message, tag or @mention you, but you won't be able to tag people who don't follow you."
                : "Anyone will be able to see your photos, videos, and stories. You won't have to approve followers."}
            </Text>

            <View style={[styles.modalSeparator, { backgroundColor: isDark ? '#3E3E3E' : '#EFEFEF' }]} />

            <Pressable
              onPress={confirmPrivacyChange}
              style={({ pressed }) => [
                styles.modalActionButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={[styles.actionButtonText, { color: isDark ? '#3897F0' : '#0095F6' }]}>
                {pendingVal === true ? 'Switch to Private' : 'Change to Public'}
              </Text>
            </Pressable>

            <View style={[styles.modalSeparator, { backgroundColor: isDark ? '#3E3E3E' : '#EFEFEF' }]} />

            <Pressable
              onPress={cancelPrivacyChange}
              style={({ pressed }) => [
                styles.modalCancelButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
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
    paddingTop: 16,
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  privacyLabel: {
    fontFamily: Fonts.regular,
    fontSize: 17,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  learnMore: {
    color: '#0095F6',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: SCREEN_WIDTH * 0.82,
    borderRadius: 14,
    paddingTop: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  modalMessage: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 22,
    marginBottom: 22,
  },
  modalSeparator: {
    width: '100%',
    height: 1,
  },
  modalActionButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  modalCancelButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});
