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
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter, Stack } from 'expo-router';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

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

  // Reanimated shared values
  const translateY = useSharedValue(600); // starts offscreen
  const backdropOpacity = useSharedValue(0);

  // Sync state with global context on mount
  useEffect(() => {
    if (user) {
      setIsPrivate(user.isPrivate ?? false);
    }
  }, [user?.isPrivate]);

  // Handle opening transitions
  useEffect(() => {
    if (showConfirmModal) {
      translateY.value = 600;
      backdropOpacity.value = 0;
      translateY.value = withTiming(0, { duration: 280 });
      backdropOpacity.value = withTiming(1, { duration: 280 });
    }
  }, [showConfirmModal]);

  const finalizeDismiss = () => {
    setShowConfirmModal(false);
    setPendingVal(null);
  };

  const dismissSheet = () => {
    haptics.light();
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(600, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(finalizeDismiss)();
      }
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        // Dampen backdrop opacity as we swipe down
        const progress = Math.max(0, 1 - e.translationY / 300);
        backdropOpacity.value = progress;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 800) {
        backdropOpacity.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(600, { duration: 180 }, (finished) => {
          if (finished) {
            runOnJS(finalizeDismiss)();
          }
        });
      } else {
        backdropOpacity.value = withTiming(1, { duration: 150 });
        translateY.value = withTiming(0, { duration: 150 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: `rgba(0, 0, 0, ${backdropOpacity.value * 0.6})`,
    };
  });

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleToggleValueChange = (newVal: boolean) => {
    haptics.light();
    setPendingVal(newVal);
    setShowConfirmModal(true);
  };

  const executePrivacyPatch = async () => {
    if (pendingVal === null) return;
    setIsUpdating(true);
    const valToSet = pendingVal;
    const oldVal = isPrivate;

    // Optimistic UI update
    setIsPrivate(valToSet);
    finalizeDismiss();

    try {
      await api.patch('/auth/profile', { isPrivate: valToSet });
      await refreshProfile();
    } catch (error) {
      // Revert if request fails
      setIsPrivate(oldVal);
      Alert.alert('Error', 'Failed to update account privacy. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmPrivacyChange = () => {
    haptics.medium();
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(600, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(executePrivacyPatch)();
      }
    });
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

      {/* Confirmation Bottom Sheet Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="none"
        onRequestClose={dismissSheet}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Animated.View style={[styles.modalOverlay, backdropStyle]}>
            <Pressable style={styles.dismissOverlay} onPress={dismissSheet} />
          
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.bottomSheetCard,
                { 
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  paddingBottom: (insets.bottom > 0 ? insets.bottom + 16 : 24) + 100
                },
                sheetStyle
              ]}
            >
            {/* Grabber Handle */}
            <View style={[styles.grabber, { backgroundColor: isDark ? '#555555' : '#EFEFEF' }]} />
            
            {/* Title */}
            <Text style={[styles.bottomSheetTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {pendingVal === true ? 'Switch to private account?' : 'Switch to public account?'}
            </Text>

            {/* Separator */}
            <View style={[styles.bottomSheetSeparator, { backgroundColor: isDark ? '#2D2D2D' : '#EFEFEF' }]} />

            {/* Content list */}
            <View style={styles.bulletsContainer}>
              {pendingVal === true ? (
                <>
                  <View style={styles.bulletRow}>
                    <View style={styles.bulletIconContainer}>
                      <MaterialCommunityIcons name="play-box-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                    </View>
                    <View style={styles.bulletTextContainer}>
                      <Text style={[styles.bulletText, { color: isDark ? '#EFEFEF' : '#262626' }]}>
                        Only your followers will be able to see your photos and videos.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bulletRow}>
                    <View style={styles.bulletIconContainer}>
                      <Feather name="at-sign" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
                    </View>
                    <View style={styles.bulletTextContainer}>
                      <Text style={[styles.bulletText, { color: isDark ? '#EFEFEF' : '#262626' }]}>
                        This won't change who can message, tag or @mention you, but you won't be able to tag people who don't follow you.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bulletRow}>
                    <View style={styles.bulletIconContainer}>
                      <Feather name="repeat" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    </View>
                    <View style={styles.bulletTextContainer}>
                      <Text style={[styles.bulletText, { color: isDark ? '#EFEFEF' : '#262626' }]}>
                        No one can reuse your content. All reels, posts and stories that previously used your content in features like remixes, sequences, templates or stickers will be deleted. If you switch back to a public account within 24 hours, they will be restored.
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.bulletRow}>
                    <View style={styles.bulletIconContainer}>
                      <MaterialCommunityIcons name="play-box-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                    </View>
                    <View style={styles.bulletTextContainer}>
                      <Text style={[styles.bulletText, { color: isDark ? '#EFEFEF' : '#262626' }]}>
                        Anyone can see your posts, reels and stories, and can use your original audio and text.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bulletRow}>
                    <View style={styles.bulletIconContainer}>
                      <Feather name="at-sign" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
                    </View>
                    <View style={styles.bulletTextContainer}>
                      <Text style={[styles.bulletText, { color: isDark ? '#EFEFEF' : '#262626' }]}>
                        This won't change who can message, tag or @mention you.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bulletRow}>
                    <View style={styles.bulletIconContainer}>
                      <Feather name="repeat" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    </View>
                    <View style={styles.bulletTextContainer}>
                      <Text style={[styles.bulletText, { color: isDark ? '#EFEFEF' : '#262626' }]}>
                        People can reuse all or part of your posts and reels in features like remixes, sequences, templates and stickers and download them as part of their reel or post.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bulletRow}>
                    <View style={styles.bulletIconContainer}>
                      <Feather name="settings" size={21} color={isDark ? '#FFFFFF' : '#000000'} />
                    </View>
                    <View style={styles.bulletTextContainer}>
                      <Text style={[styles.bulletText, { color: isDark ? '#EFEFEF' : '#262626' }]}>
                        You can turn off reuse for each post or reel or change the default in your settings.
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Action button */}
            <Pressable
              onPress={confirmPrivacyChange}
              style={({ pressed }) => [
                styles.bottomSheetActionButton,
                { opacity: pressed ? 0.85 : 1 }
              ]}
            >
              <Text style={styles.bottomSheetActionButtonText}>
                {pendingVal === true ? 'Switch to private' : 'Switch to public'}
              </Text>
            </Pressable>
          </Animated.View>
          </GestureDetector>
        </Animated.View>
        </GestureHandlerRootView>
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
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  bottomSheetCard: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 20,
    marginBottom: -100,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  bottomSheetSeparator: {
    width: '100%',
    height: 1,
    marginBottom: 24,
  },
  bulletsContainer: {
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  bulletIconContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  bulletTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  bulletText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
  },
  bottomSheetActionButton: {
    width: '100%',
    backgroundColor: '#3797EF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#3797EF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  bottomSheetActionButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 16,
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
