import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, UserLink } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { LibrarySelectModal } from '@/components/LibrarySelectModal';
import { ProfileFieldModal, FieldRow } from '@/components/ProfileFieldModal';
import { GenderSelectModal } from '@/components/GenderSelectModal';
import { BannersModal } from '@/components/BannersModal';
import { LinksModal } from '@/components/LinksModal';
import { UsernameEditModal } from '@/components/UsernameEditModal';
import { DiscardChangesModal } from '@/components/DiscardChangesModal';
import { PronounsModal } from '@/components/PronounsModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileFormData {
  name: string;
  username: string;
  pronouns: string;
  bio: string;
  gender: string;
  aiCreator: boolean;
}

// ─── Gender Options ───────────────────────────────────────────────────────────

// ─── Gender Row Card ──────────────────────────────────────────────────────────

const GenderRow = ({
  value,
  onPress,
  isDark,
  colors,
  delay = 0,
}: {
  value: string;
  onPress: () => void;
  isDark: boolean;
  colors: any;
  delay?: number;
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(delay)}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.fieldRow,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? '#38383A' : '#E5E5E5',
            },
          ]}
        >
          <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Gender
          </ThemedText>
          <View style={styles.dropdownValueRow}>
            <ThemedText
              style={[
                styles.fieldValue,
                { color: value ? colors.text : colors.textSecondary },
              ]}
            >
              {value || 'Prefer not to say'}
            </ThemedText>
            <Ionicons
              name="chevron-down"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Link Row ─────────────────────────────────────────────────────────────────

const LinkRow = ({
  label,
  onPress,
  colors,
  delay = 0,
}: {
  label: string;
  onPress: () => void;
  colors: any;
  delay?: number;
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(delay)}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.linkRow}
        >
          <ThemedText style={[styles.linkRowText, { color: colors.text }]}>
            {label}
          </ThemedText>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Banner Row ───────────────────────────────────────────────────────────────

const BannerRow = ({
  label,
  subtitle,
  onPress,
  colors,
  delay = 0,
}: {
  label: string;
  subtitle: string;
  onPress: () => void;
  colors: any;
  delay?: number;
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(delay)}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.bannerRow}
        >
          <ThemedText style={[styles.bannerRowLabel, { color: colors.text }]}>
            {label}
          </ThemedText>
          <ThemedText style={[styles.bannerRowSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </ThemedText>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Custom Switch ────────────────────────────────────────────────────────────

const CustomSwitch = ({
  value,
  onValueChange,
  isDark,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
  isDark: boolean;
}) => {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [isDark ? '#3A3A3C' : '#E5E5E5', '#34C759']
    );
    return {
      backgroundColor,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [0, 20]
    );
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View style={[styles.toggleTrack, trackStyle]}>
      <Animated.View style={[styles.toggleThumb, thumbStyle]} />
    </Animated.View>
  );
};

// ─── AI Creator Row ───────────────────────────────────────────────────────────

const AICreatorRow = ({
  value,
  onToggle,
  isDark,
  colors,
  delay = 0,
}: {
  value: boolean;
  onToggle: (val: boolean) => void;
  isDark: boolean;
  colors: any;
  delay?: number;
}) => {
  return (
    <Animated.View entering={FadeInDown.duration(300).delay(delay)}>
      <Pressable onPress={() => onToggle(!value)} style={styles.aiCreatorRow}>
        <View style={styles.aiCreatorContent}>
          <ThemedText style={[styles.aiCreatorTitle, { color: colors.text }]}>
            AI creator
          </ThemedText>
          <ThemedText style={[styles.aiCreatorSubtitle, { color: colors.textSecondary }]}>
            Add this label to your profile if your content often uses AI.{' '}
            <ThemedText
              style={{ color: '#0095F6', textDecorationLine: 'underline', fontSize: 12 }}
              onPress={(e) => {
                e.stopPropagation();
                Alert.alert(
                  'AI Label',
                  'When you share content that uses AI tools, you can add this label to your profile to let people know.',
                  [{ text: 'OK' }]
                );
              }}
            >
              Learn more
            </ThemedText>
          </ThemedText>
        </View>
        <CustomSwitch value={value} onValueChange={onToggle} isDark={isDark} />
      </Pressable>
    </Animated.View>
  );
};

// ─── Bottom Link Item ─────────────────────────────────────────────────────────

const BottomLinkItem = ({
  label,
  colors,
  onPress,
  delay = 0,
}: {
  label: string;
  colors: any;
  onPress: () => void;
  delay?: number;
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(delay)}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.bottomLinkItem, { borderBottomColor: colors.border }]}
        >
          <ThemedText style={styles.bottomLinkItemText}>
            {label}
          </ThemedText>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    username: user?.username || '',
    pronouns: user?.pronouns || '',
    bio: user?.bio || '',
    gender: user?.gender || 'Prefer not to say',
    aiCreator: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  // Modal states for field editing
  const [showNameModal, setShowNameModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showPronounsModal, setShowPronounsModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);

  // Custom modal states
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBannersModal, setShowBannersModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [links, setLinks] = useState<UserLink[]>([]);
  const [showToFollowers, setShowToFollowers] = useState(user?.showPronounsToFollowers || false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const saveButtonScale = useSharedValue(1);

  // Sync form state when user changes (e.g., after direct-to-database updates from modals)
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        name: user.name || '',
        username: user.username || '',
        pronouns: user.pronouns || '',
        bio: user.bio || '',
        gender: user.gender || 'Prefer not to say',
        aiCreator: prev.aiCreator,
      }));
      if (user.links) {
        setLinks(user.links);
      }
      setShowToFollowers(user.showPronounsToFollowers || false);
    }
  }, [user]);

  useEffect(() => {
    const changed =
      formData.name !== (user?.name || '') ||
      formData.username !== (user?.username || '') ||
      formData.bio !== (user?.bio || '') ||
      formData.pronouns !== (user?.pronouns || '') ||
      formData.gender !== (user?.gender || 'Prefer not to say') ||
      showToFollowers !== (user?.showPronounsToFollowers || false) ||
      JSON.stringify(links) !== JSON.stringify(user?.links || []);
    setHasChanges(changed);
  }, [formData, user, links, showToFollowers]);

  useEffect(() => {
    const onBackPress = () => {
      // If any of the modals are active, let them handle it first
      if (
        showNameModal ||
        showUsernameModal ||
        showPronounsModal ||
        showBioModal ||
        showGenderModal ||
        showBannersModal ||
        showLinksModal ||
        showLibraryModal
      ) {
        return false;
      }

      if (hasChanges) {
        handleBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
    };
  }, [
    hasChanges,
    showNameModal,
    showUsernameModal,
    showPronounsModal,
    showBioModal,
    showGenderModal,
    showBannersModal,
    showLinksModal,
    showLibraryModal,
  ]);

  const handleBack = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    saveButtonScale.value = withTiming(0.95, { duration: 100 }, () => {
      saveButtonScale.value = withTiming(1, { duration: 100 });
    });

    setIsSaving(true);
    try {
      const success = await updateProfile(
        formData.name,
        formData.bio,
        user?.avatar || '',
        undefined,
        undefined,
        formData.username !== user?.username ? formData.username : undefined
      );

      if (success) {
        showToast({
          title: 'Profile updated',
          message: 'Your profile has been saved successfully.',
          type: 'success',
        });
        router.back();
      } else {
        showToast({
          title: 'Error',
          message: 'Failed to update profile. Please try again.',
          type: 'error',
        });
      }
    } catch (error) {
      showToast({
        title: 'Error',
        message: 'An unexpected error occurred.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Edit picture or avatar',
      'Choose an option',
      [
        {
          text: 'Choose from library',
          onPress: () => setShowLibraryModal(true),
        },
        {
          text: 'Take photo',
          onPress: () => {
            showToast({
              title: 'Coming soon',
              message: 'Camera capture will be available shortly.',
              type: 'info',
            });
          },
        },
        {
          text: 'Use avatar',
          onPress: () => {
            showToast({
              title: 'Coming soon',
              message: 'Avatar editor will be available shortly.',
              type: 'info',
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const saveButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));

  const updateField = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* ── Header ── */}
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Pressable onPress={handleBack} style={styles.headerButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle" style={[styles.headerTitle, { color: colors.text }]}>
          Edit profile
        </ThemedText>
        <Animated.View style={saveButtonStyle}>
          <Pressable
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
            style={[
              styles.headerButton,
              { opacity: hasChanges && !isSaving ? 1 : 0.4 },
            ]}
          >
            <Ionicons
              name="checkmark"
              size={26}
              color="#0095F6"
            />
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* ── Scrollable Content ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Profile Picture Section ── */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(50)}
            style={styles.avatarSection}
          >
            <Pressable onPress={handleAvatarPress} style={styles.avatarContainer}>
              {/* Main avatar (left, slightly behind) */}
              <View style={styles.avatarMain}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarImage, styles.avatarPlaceholder, { backgroundColor: isDark ? '#3A3A3C' : '#E8E8E8' }]}>
                    <Ionicons name="person" size={40} color={isDark ? '#636366' : '#A8A8A8'} style={{ marginTop: 8 }} />
                  </View>
                )}
              </View>

              {/* Meta avatar (right, overlapping) */}
              <View style={[styles.avatarMeta, { backgroundColor: '#B39DDB' }]}>
                <MaterialCommunityIcons name="robot-outline" size={28} color="#FFFFFF" />
              </View>
            </Pressable>

            <Pressable onPress={handleAvatarPress}>
              <ThemedText style={[styles.editPictureLink, { color: '#0095F6' }]}>
                Edit picture or avatar
              </ThemedText>
            </Pressable>
          </Animated.View>

          {/* ── Form Fields ── */}
          <View style={styles.formSection}>
            <FieldRow
              label="Name"
              value={formData.name}
              placeholder="Add your name"
              onPress={() => setShowNameModal(true)}
              isDark={isDark}
              colors={colors}
              delay={100}
            />

            <FieldRow
              label="Username"
              value={formData.username}
              placeholder="Add username"
              onPress={() => setShowUsernameModal(true)}
              isDark={isDark}
              colors={colors}
              delay={140}
            />

            <FieldRow
              label="Pronouns"
              value={formData.pronouns}
              placeholder="Add pronouns"
              onPress={() => setShowPronounsModal(true)}
              isDark={isDark}
              colors={colors}
              delay={180}
            />

            <FieldRow
              label="Bio"
              value={formData.bio}
              placeholder="Add bio"
              onPress={() => setShowBioModal(true)}
              isDark={isDark}
              colors={colors}
              delay={220}
            />
          </View>

          {/* ── Spacing & Action Rows ── */}
          <View style={styles.middleSection}>
            <LinkRow
              label="Add link"
              colors={colors}
              delay={260}
              onPress={() => setShowLinksModal(true)}
            />

            <BannerRow
              label="Add banners"
              subtitle="Add music, profiles and more."
              colors={colors}
              delay={300}
              onPress={() => setShowBannersModal(true)}
            />

            <GenderRow
              value={formData.gender}
              onPress={() => setShowGenderModal(true)}
              isDark={isDark}
              colors={colors}
            />

            <LinkRow
              label="Reorder grid"
              colors={colors}
              delay={340}
              onPress={() => {
                showToast({ title: 'Coming soon', message: 'Grid reordering will be available shortly.', type: 'info' });
              }}
            />

            <AICreatorRow
              value={formData.aiCreator}
              onToggle={(val) => updateField('aiCreator', val)}
              isDark={isDark}
              colors={colors}
              delay={380}
            />
          </View>

          {/* ── Bottom Links ── */}
          <View style={[styles.bottomLinksContainer, { borderTopColor: colors.border }]}>
            <BottomLinkItem
              label="Switch to professional account"
              colors={colors}
              delay={420}
              onPress={() => {
                showToast({ title: 'Coming soon', message: 'Professional account features will be available shortly.', type: 'info' });
              }}
            />

            <BottomLinkItem
              label="Personal information settings"
              colors={colors}
              delay={460}
              onPress={() => {
                showToast({ title: 'Coming soon', message: 'Personal information settings will be available shortly.', type: 'info' });
              }}
            />

            <BottomLinkItem
              label="Show your profile is verified"
              colors={colors}
              delay={500}
              onPress={() => {
                showToast({ title: 'Coming soon', message: 'Verification features will be available shortly.', type: 'info' });
              }}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Library Select Modal ── */}
      <LibrarySelectModal
        visible={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onSelectPhoto={async (uri) => {
          try {
            const success = await updateProfile(formData.name, formData.bio, uri);
            if (success) {
              showToast({
                title: 'Success',
                message: 'Profile picture updated successfully.',
                type: 'success',
              });
            } else {
              showToast({
                title: 'Error',
                message: 'Failed to update profile picture.',
                type: 'error',
              });
            }
          } catch (err) {
            showToast({
              title: 'Error',
              message: 'An error occurred while updating profile photo.',
              type: 'error',
            });
          }
        }}
      />

      {/* ── Name Edit Modal ── */}
      <ProfileFieldModal
        visible={showNameModal}
        title="Name"
        label="Name"
        value={formData.name}
        placeholder="Enter your name"
        maxLength={50}
        autoCapitalize="words"
        helperText="Help people discover your account by using the name you're known by: either your full name, nickname, or business name."
        onClose={() => setShowNameModal(false)}
        onSave={async (val) => {
          const success = await updateProfile(
            val,
            formData.bio,
            user?.avatar || '',
            undefined,
            undefined,
            undefined,
            formData.gender !== 'Prefer not to say' ? formData.gender : undefined,
            formData.pronouns
          );
          if (success) {
            updateField('name', val);
            showToast({
              title: 'Profile updated',
              message: 'Your name has been updated successfully.',
              type: 'success',
            });
          } else {
            showToast({
              title: 'Error',
              message: 'Failed to update name.',
              type: 'error',
            });
            throw new Error('Save failed');
          }
        }}
      />

      {/* ── Username Edit Modal ── */}
      <UsernameEditModal
        visible={showUsernameModal}
        value={formData.username}
        onClose={() => setShowUsernameModal(false)}
        onSave={async (val) => {
          const success = await updateProfile(
            formData.name,
            formData.bio,
            user?.avatar || '',
            undefined,
            undefined,
            val,
            formData.gender !== 'Prefer not to say' ? formData.gender : undefined,
            formData.pronouns
          );
          if (success) {
            updateField('username', val);
            showToast({
              title: 'Profile updated',
              message: 'Your username has been updated successfully.',
              type: 'success',
            });
          } else {
            showToast({
              title: 'Error',
              message: 'Failed to update username.',
              type: 'error',
            });
            throw new Error('Save failed');
          }
        }}
      />

      {/* ── Pronouns Edit Modal ── */}
      <PronounsModal
        visible={showPronounsModal}
        value={formData.pronouns}
        showToFollowers={showToFollowers}
        onClose={() => setShowPronounsModal(false)}
        onSave={async (val, showFollowersOnly) => {
          const success = await updateProfile(
            formData.name,
            formData.bio,
            user?.avatar || '',
            undefined,
            undefined,
            undefined,
            formData.gender !== 'Prefer not to say' ? formData.gender : undefined,
            val,
            undefined,
            showFollowersOnly
          );
          if (success) {
            updateField('pronouns', val);
            setShowToFollowers(showFollowersOnly);
            showToast({
              title: 'Profile updated',
              message: 'Your pronouns have been updated successfully.',
              type: 'success',
            });
          } else {
            showToast({
              title: 'Error',
              message: 'Failed to update pronouns. Please try again.',
              type: 'error',
            });
            throw new Error('Save failed');
          }
        }}
      />

      {/* ── Bio Edit Modal ── */}
      <ProfileFieldModal
        visible={showBioModal}
        title="Bio"
        label="Bio"
        value={formData.bio}
        placeholder="Tell people about yourself"
        maxLength={150}
        multiline
        helperText="Your bio is shown on your profile and helps people learn about you."
        onClose={() => setShowBioModal(false)}
        onSave={async (val) => {
          const success = await updateProfile(
            formData.name,
            val,
            user?.avatar || '',
            undefined,
            undefined,
            undefined,
            formData.gender !== 'Prefer not to say' ? formData.gender : undefined,
            formData.pronouns
          );
          if (success) {
            updateField('bio', val);
            showToast({
              title: 'Profile updated',
              message: 'Your bio has been updated successfully.',
              type: 'success',
            });
          } else {
            showToast({
              title: 'Error',
              message: 'Failed to update bio.',
              type: 'error',
            });
            throw new Error('Save failed');
          }
        }}
      />

      {/* ── Custom Selection Modals ── */}
      <GenderSelectModal
        visible={showGenderModal}
        value={formData.gender}
        onClose={() => setShowGenderModal(false)}
        onSave={async (val) => {
          const success = await updateProfile(
            formData.name,
            formData.bio,
            user?.avatar || '',
            undefined,
            undefined,
            undefined,
            val,
            formData.pronouns
          );
          if (success) {
            updateField('gender', val);
            showToast({
              title: 'Profile updated',
              message: 'Your gender has been updated successfully.',
              type: 'success',
            });
          } else {
            showToast({
              title: 'Error',
              message: 'Failed to update gender.',
              type: 'error',
            });
            throw new Error('Save failed');
          }
        }}
      />

      <BannersModal
        visible={showBannersModal}
        onClose={() => setShowBannersModal(false)}
      />

      <LinksModal
        visible={showLinksModal}
        initialLinks={links}
        onClose={() => setShowLinksModal(false)}
        onSaveLinks={async (updatedLinks) => {
          const success = await updateProfile(
            formData.name,
            formData.bio,
            user?.avatar || '',
            undefined,
            undefined,
            undefined,
            formData.gender !== 'Prefer not to say' ? formData.gender : undefined,
            formData.pronouns,
            updatedLinks
          );
          if (success) {
            showToast({
              title: 'Profile updated',
              message: 'Your links have been updated successfully.',
              type: 'success',
            });
          } else {
            showToast({
              title: 'Error',
              message: 'Failed to update links. Please try again.',
              type: 'error',
            });
            throw new Error('Save failed');
          }
        }}
      />

      <DiscardChangesModal
        visible={showDiscardConfirm}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          router.back();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    height: 50,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
  },

  // ── Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarMain: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
    zIndex: 1,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMeta: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -16,
    borderWidth: 3,
    borderColor: 'transparent',
    zIndex: 2,
  },
  editPictureLink: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },

  // ── Form Section
  formSection: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // ── Field Row (shared by FieldRow, SectionRow, GenderDropdown)
  fieldRow: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 60,
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },

  // ── Middle Section Action Rows
  middleSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 20,
  },
  linkRow: {
    paddingVertical: 6,
    justifyContent: 'center',
  },
  linkRowText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  bannerRow: {
    gap: 2,
    justifyContent: 'center',
  },
  bannerRowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  bannerRowSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },

  // ── Dropdown
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    paddingVertical: 4,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dropdownItemText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
  },

  // ── AI Creator Row
  aiCreatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 4,
  },
  aiCreatorContent: {
    flex: 1,
    gap: 2,
  },
  aiCreatorTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  aiCreatorSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },

  // ── Toggle Switch Styling
  toggleTrack: {
    width: 51,
    height: 31,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  // ── Bottom Links
  bottomLinksContainer: {
    marginTop: 24,
    borderTopWidth: 0.5,
  },
  bottomLinkItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    justifyContent: 'center',
  },
  bottomLinkItemText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#0095F6',
  },
});
