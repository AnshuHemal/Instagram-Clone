/**
 * LibrarySelectModal
 *
 * A production-level, full-screen Modal component simulating the native
 * Instagram gallery picker.
 *
 * Features:
 * - Slide-up full-screen transition using React Native Modal and Reanimated.
 * - Permissions onboarding state matching the first reference image.
 * - Large circular profile crop preview in the upper half of the screen,
 *   matching the second reference image.
 * - 4-column horizontal/vertical media grid in the lower half of the screen.
 * - Done button in the top-right header to save/apply selected photo.
 * - Native multipart/form-data upload using Axios onUploadProgress with
 *   an elegant overlay displaying percent progress and a graphic loader bar.
 * - Smooth profile redirect/reload workflow post-upload.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Modal,
  FlatList,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = SCREEN_WIDTH / 4;

// High-quality modern mock library images from Unsplash
const INITIAL_MOCK_GALLERY = [
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600',
];

// Custom vector graphics matching premium look
const GalleryIllustration = ({ isDark }: { isDark: boolean }) => (
  <View style={styles.illustrationContainer}>
    <Svg width={120} height={120} viewBox="0 0 100 100" fill="none">
      {/* Background card */}
      <Rect
        x={20}
        y={15}
        width={60}
        height={60}
        rx={12}
        fill={isDark ? '#2C2C2E' : '#F2F2F7'}
        transform="rotate(-8 50 45)"
        opacity={0.5}
      />
      {/* Middle card */}
      <Rect
        x={20}
        y={15}
        width={60}
        height={60}
        rx={12}
        fill={isDark ? '#3A3A3C' : '#E5E5EA'}
        transform="rotate(6 50 45)"
        opacity={0.8}
      />
      {/* Front card with a landscape graphic */}
      <Rect
        x={20}
        y={20}
        width={60}
        height={60}
        rx={12}
        fill={isDark ? '#1C1C1E' : '#FFFFFF'}
        stroke={isDark ? '#3A3A3C' : '#E5E5EA'}
        strokeWidth={1.5}
      />
      {/* Mountains inside front card */}
      <Path
        d="M25 65 L44 42 L55 55 L68 36 L75 65 Z"
        fill={isDark ? '#2C2C2E' : '#E8E8E8'}
      />
      {/* Sun inside front card */}
      <Circle cx={36} cy={34} r={6} fill="#FFB703" />
    </Svg>
  </View>
);

interface LibrarySelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPhoto: (uri: string) => void;
}

export const LibrarySelectModal: React.FC<LibrarySelectModalProps> = ({
  visible,
  onClose,
  onSelectPhoto,
}) => {
  const { colors, isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Gallery items and current preview states
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(INITIAL_MOCK_GALLERY);
  const [selectedPreviewUri, setSelectedPreviewUri] = useState<string>(INITIAL_MOCK_GALLERY[0]);

  // Sync / check permission on visibility changes
  useEffect(() => {
    if (visible) {
      checkPermission();
    }
  }, [visible]);

  const checkPermission = async () => {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleTurnOn = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      openNativePicker();
    }
  };

  const openNativePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const pickedUri = result.assets[0].uri;
        // Prepend to gallery photos list and set as active preview
        setGalleryPhotos((prev) => {
          if (prev.includes(pickedUri)) return prev;
          return [pickedUri, ...prev];
        });
        setSelectedPreviewUri(pickedUri);
      }
    } catch (err) {
      console.error('Error invoking launchImageLibraryAsync:', err);
    }
  };

  const handleDone = async () => {
    if (!selectedPreviewUri) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let finalAvatarUrl = selectedPreviewUri;

      if (!selectedPreviewUri.startsWith('http')) {
        // Local file URI — upload via FormData
        const formData = new FormData();
        const uriParts = selectedPreviewUri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split('.').pop() || 'jpeg';

        formData.append('file', {
          uri: Platform.OS === 'android' ? selectedPreviewUri : selectedPreviewUri.replace('file://', ''),
          name: fileName || 'avatar.jpg',
          type: `image/${fileType}`,
        } as any);

        const response = await api.post('/auth/profile/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        });

        if (response.data && response.data.avatarUrl) {
          finalAvatarUrl = response.data.avatarUrl;
        } else {
          throw new Error('Upload failed');
        }
      } else {
        // Remote Unsplash URI — simulate upload progress smoothly for premium feel
        for (let p = 0; p <= 100; p += 10) {
          setUploadProgress(p);
          await new Promise((r) => setTimeout(r, 60)); // 600ms total simulation
        }
      }

      // Update database profile record with final image URL
      await api.patch('/auth/profile', {
        name: user?.name || user?.username || '',
        bio: user?.bio || '',
        avatarUrl: finalAvatarUrl,
      });

      // Update local context
      if (user) {
        await updateProfile(user.name, user.bio, finalAvatarUrl);
      }

      showToast({
        title: 'Success',
        message: 'Profile picture updated successfully.',
        type: 'success',
      });
      
      onSelectPhoto(finalAvatarUrl);
      onClose();
    } catch (err: any) {
      console.error('Failed to save profile picture:', err);
      const errMsg = err.response?.data?.message || 'Failed to save profile picture. Please try again.';
      showToast({
        title: 'Upload Error',
        message: errMsg,
        type: 'error',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Theme styling helpers
  const sheetBg = isDark ? '#121212' : '#FFFFFF';
  const textColor = colors.text;
  const dividerColor = isDark ? '#2C2C2E' : '#E5E5EA';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: sheetBg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: dividerColor }]}>
          {/* Close button */}
          <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={12} disabled={isUploading}>
            <Ionicons name="close" size={28} color={textColor} />
          </Pressable>

          {/* Album Selector */}
          <Pressable onPress={openNativePicker} style={styles.dropdownBtn} disabled={isUploading}>
            <ThemedText style={[styles.dropdownText, { color: textColor }]}>
              Recents
            </ThemedText>
            <Ionicons name="chevron-down" size={15} color={textColor} />
          </Pressable>

          {/* Top-Right Done Action button */}
          {hasPermission === true ? (
            <Pressable
              onPress={handleDone}
              style={styles.doneBtn}
              hitSlop={12}
              disabled={isUploading}
            >
              <ThemedText style={styles.doneText}>Done</ThemedText>
            </Pressable>
          ) : (
            <View style={styles.headerBtnPlaceholder} />
          )}
        </View>

        {/* Conditional Content */}
        {hasPermission === false ? (
          /* Onboarding State: Permission needed */
          <View style={styles.onboardingBody}>
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.illustrationWrapper}>
              <GalleryIllustration isDark={isDark} />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(450).delay(200)} style={styles.textWrapper}>
              <ThemedText style={[styles.mainTitle, { color: textColor }]}>
                Post photos from your phone on Instagram
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                Post photos you took with your phone on Instagram, automatically save your edited photos to your gallery, and more.
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(300)}>
              <Pressable
                onPress={handleTurnOn}
                style={({ pressed }) => [
                  styles.turnOnButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <ThemedText style={styles.turnOnText}>Turn on</ThemedText>
              </Pressable>
            </Animated.View>
          </View>
        ) : (
          /* Active State: Permission granted - show big crop circle preview and 4-column photos grid */
          <Animated.View entering={FadeIn.duration(300)} style={styles.mainBody}>
            {/* Circular Crop Preview Area */}
            <View style={[styles.previewArea, { backgroundColor: isDark ? '#000000' : '#FFFFFF', borderBottomColor: dividerColor }]}>
              <View style={[styles.cropCircleContainer, { borderColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                <Image
                  source={{ uri: selectedPreviewUri }}
                  style={styles.cropCircleImage}
                />
              </View>
            </View>

            {/* Photos Grid */}
            <FlatList
              data={galleryPhotos}
              numColumns={4}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gridContainer}
              renderItem={({ item }) => {
                const isSelected = item === selectedPreviewUri;
                return (
                  <Pressable
                    onPress={() => setSelectedPreviewUri(item)}
                    style={styles.gridItem}
                    disabled={isUploading}
                  >
                    <Image source={{ uri: item }} style={styles.gridImage} />
                    {isSelected && (
                      <View style={styles.selectedGridOverlay}>
                        <View style={[styles.selectedCircleIndicator, { backgroundColor: '#0095F6' }]}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          </Animated.View>
        )}

        {/* Dynamic Upload Progress Overlay */}
        {isUploading && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.loadingOverlay}
          >
            <View style={[styles.loadingBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <ActivityIndicator size="large" color="#0095F6" />
              <ThemedText style={[styles.loadingTitle, { color: textColor }]}>
                Uploading profile photo...
              </ThemedText>
              <ThemedText style={styles.loadingProgress}>
                {uploadProgress}%
              </ThemedText>
              
              {/* Progress bar fill graphic */}
              <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${uploadProgress}%`,
                      backgroundColor: '#0095F6',
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 44, // Safe margin for status bar
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dropdownText: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  headerBtnPlaceholder: {
    width: 40,
  },
  doneBtn: {
    width: 50,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  doneText: {
    color: '#0095F6',
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  onboardingBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingBottom: 80,
  },
  illustrationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationWrapper: {
    marginBottom: 20,
  },
  textWrapper: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 21,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  turnOnButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  turnOnText: {
    color: '#0095F6',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  mainBody: {
    flex: 1,
  },
  previewArea: {
    height: 330,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cropCircleContainer: {
    width: 270,
    height: 270,
    borderRadius: 135,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cropCircleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridContainer: {
    paddingBottom: 20,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    padding: 0.7,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedGridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 6,
    right: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    width: 260,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingProgress: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: '#0095F6',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
