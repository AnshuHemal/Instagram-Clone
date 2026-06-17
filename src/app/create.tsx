import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/contexts/PostsContext';
import { useReels } from '@/contexts/ReelsContext';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';

const { width } = Dimensions.get('window');

// Dynamic check for expo-video
let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (e) {
  // Silent fallback
}

interface SelectedMedia {
  uri: string;
  type: 'image' | 'video';
}

export default function CreateScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { fetchPosts } = usePosts();
  const { fetchReels } = useReels();

  // Mode state: POST vs REEL
  const [activeMode, setActiveMode] = useState<'POST' | 'REEL'>('POST');

  // Input states
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [audioName, setAudioName] = useState('Original Audio');

  // Media states
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [videoPlayer, setVideoPlayer] = useState<any>(null);

  // Upload/loading states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Auto-create/release video player when selectedMedia changes
  useEffect(() => {
    if (!ExpoVideo || !selectedMedia || selectedMedia.type !== 'video') {
      if (videoPlayer) {
        try {
          videoPlayer.release();
        } catch (e) {}
        setVideoPlayer(null);
      }
      return;
    }

    let p: any = null;
    try {
      p = ExpoVideo.createVideoPlayer(selectedMedia.uri);
      p.loop = true;
      p.muted = true;
      p.play();
      setVideoPlayer(p);
    } catch (err) {
      console.error('Error creating video player in CreateScreen:', err);
    }

    return () => {
      if (p) {
        try {
          p.release();
        } catch (e) {}
      }
    };
  }, [selectedMedia]);

  const handlePickMedia = async (useCamera = false) => {
    try {
      // 1. Check/request permissions
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          `We need access to your ${useCamera ? 'camera' : 'gallery'} to create posts and reels.`
        );
        return;
      }

      // 2. Launch Picker
      const mediaTypes = activeMode === 'REEL'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.All;

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes,
            quality: 0.8,
          });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo =
          asset.type === 'video' ||
          asset.mimeType?.startsWith('video') ||
          asset.uri.toLowerCase().endsWith('.mp4') ||
          asset.uri.toLowerCase().endsWith('.mov');

        setSelectedMedia({
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
        });
      }
    } catch (err) {
      console.error('Error selecting media:', err);
      Alert.alert('Error', 'Failed to pick media file. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!selectedMedia) {
      Alert.alert('Error', 'Please select an image or video to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const localUri = selectedMedia.uri;
      const isVideo = selectedMedia.type === 'video';

      // 1. Request signed Cloudinary payload from NestJS backend
      let signatureRes;
      if (activeMode === 'POST') {
        signatureRes = await api.post(`/posts/upload-signature?resourceType=${selectedMedia.type}`);
      } else {
        signatureRes = await api.post('/reels/upload-signature');
      }

      const signData = signatureRes.data.data;
      const {
        signature,
        apiKey,
        cloudName,
        timestamp,
        folder,
        uploadPreset,
        eager,
        notificationUrl,
      } = signData;

      // 2. Build Multipart FormData
      const formData = new FormData();
      const uriParts = localUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      const fileExt = fileName.split('.').pop() || (isVideo ? 'mp4' : 'jpg');

      formData.append('file', {
        uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
        name: fileName || (isVideo ? 'reel.mp4' : 'post.jpg'),
        type: isVideo ? `video/${fileExt}` : `image/${fileExt}`,
      } as any);

      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', folder);
      formData.append('upload_preset', uploadPreset);
      formData.append('context', `user_id=${user?.id}`);

      if (isVideo) {
        if (eager) formData.append('eager', eager);
        formData.append('eager_async', 'true');
        if (notificationUrl) {
          formData.append('notification_url', notificationUrl);
          formData.append('eager_notification_url', notificationUrl);
        }
      }

      // 3. Upload directly to Cloudinary
      // Use raw axios to prevent shared api instance bearer token injection
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${selectedMedia.type}/upload`;

      const uploadRes = await axios.post(uploadUrl, formData, {
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

      const cloudData = uploadRes.data;

      // 4. Save to Database
      if (activeMode === 'POST') {
        const mediaUrl = cloudData.secure_url;
        await api.post('/posts', {
          caption: caption.trim() || undefined,
          location: location.trim() || undefined,
          media: [
            {
              mediaUrl,
              mediaType: isVideo ? 'VIDEO' : 'IMAGE',
              orderIndex: 0,
            },
          ],
        });

        // Trigger feed refresh
        fetchPosts(null, true).catch(() => {});
      } else {
        const cloudinaryPublicId = cloudData.public_id;
        // Parse hashtags from caption
        const hashtags = caption.match(/#(\w+)/g)?.map((tag) => tag.slice(1)) || [];

        await api.post('/reels', {
          cloudinaryPublicId,
          caption: caption.trim() || undefined,
          audioName: audioName.trim() || 'Original Audio',
          hashtags,
        });

        // Trigger reels feed refresh
        fetchReels(null, true).catch(() => {});
      }

      // 5. Success cleanup and redirect
      setCaption('');
      setLocation('');
      setAudioName('Original Audio');
      setSelectedMedia(null);

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Media upload flow failed:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'An error occurred during upload. Please try again.';
      Alert.alert('Upload Failed', errMsg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const isFormValid = selectedMedia !== null;
  const isDarkTheme = isDark;
  const inputBg = isDarkTheme ? '#1C1C1E' : '#F2F2F7';
  const dividerColor = isDarkTheme ? '#2C2C2E' : '#E5E5EA';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: dividerColor }]}>
          <Pressable onPress={handleClose} style={styles.headerButton} disabled={isUploading}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle} type="subtitle">
            New {activeMode === 'POST' ? 'Post' : 'Reel'}
          </ThemedText>
          <Pressable onPress={handleShare} disabled={!isFormValid || isUploading} style={styles.headerButton}>
            <ThemedText
              type="smallBold"
              style={{ color: isFormValid && !isUploading ? colors.primary : colors.textSecondary }}
            >
              Share
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Preview Canvas */}
          <View style={[styles.previewContainer, { backgroundColor: isDarkTheme ? '#000000' : '#EAEAEA' }]}>
            {selectedMedia ? (
              selectedMedia.type === 'video' && ExpoVideo && videoPlayer ? (
                <ExpoVideo.VideoView
                  player={videoPlayer}
                  style={styles.previewMedia}
                  contentFit="cover"
                  nativeControls={false}
                />
              ) : (
                <Image source={{ uri: selectedMedia.uri }} style={styles.previewMedia} />
              )
            ) : (
              <View style={styles.placeholderWrapper}>
                <Ionicons
                  name={activeMode === 'POST' ? 'images-outline' : 'videocam-outline'}
                  size={50}
                  color={colors.textSecondary}
                />
                <ThemedText style={[styles.placeholderText, { color: colors.textSecondary }]}>
                  No media selected
                </ThemedText>
              </View>
            )}

            {/* Media Action Triggers */}
            <View style={styles.mediaButtonsRow}>
              <Pressable
                onPress={() => handlePickMedia(false)}
                style={[styles.pickerButton, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]}
                disabled={isUploading}
              >
                <Ionicons name="images" size={18} color="#FFFFFF" />
                <ThemedText style={styles.pickerButtonText}>Gallery</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => handlePickMedia(true)}
                style={[styles.pickerButton, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]}
                disabled={isUploading}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <ThemedText style={styles.pickerButtonText}>Camera</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={[styles.inputRow, { borderBottomColor: dividerColor }]}>
              <Ionicons name="create-outline" size={20} color={colors.text} style={styles.inputIcon} />
              <TextInput
                placeholder="Write a caption... (use # for hashtags)"
                placeholderTextColor={isDarkTheme ? '#8E8E8F' : '#9E9E9E'}
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={3}
                style={[styles.inputField, { color: colors.text }]}
                editable={!isUploading}
              />
            </View>

            {activeMode === 'POST' ? (
              <View style={[styles.inputRow, { borderBottomColor: dividerColor }]}>
                <Ionicons name="location-outline" size={20} color={colors.text} style={styles.inputIcon} />
                <TextInput
                  placeholder="Add location"
                  placeholderTextColor={isDarkTheme ? '#8E8E8F' : '#9E9E9E'}
                  value={location}
                  onChangeText={setLocation}
                  style={[styles.inputField, { color: colors.text }]}
                  editable={!isUploading}
                />
              </View>
            ) : (
              <View style={[styles.inputRow, { borderBottomColor: dividerColor }]}>
                <Ionicons name="musical-notes-outline" size={20} color={colors.text} style={styles.inputIcon} />
                <TextInput
                  placeholder="Audio name"
                  placeholderTextColor={isDarkTheme ? '#8E8E8F' : '#9E9E9E'}
                  value={audioName}
                  onChangeText={setAudioName}
                  style={[styles.inputField, { color: colors.text }]}
                  editable={!isUploading}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Mode Selector Tab Bar */}
        <View style={[styles.modePickerContainer, { borderTopColor: dividerColor, backgroundColor: colors.background }]}>
          <Pressable
            onPress={() => {
              if (!isUploading) {
                setActiveMode('POST');
                setSelectedMedia(null);
              }
            }}
            style={[
              styles.modeTab,
              activeMode === 'POST' && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 },
            ]}
          >
            <ThemedText
              style={[
                styles.modeTabText,
                activeMode === 'POST' ? { color: colors.text, fontFamily: Fonts.bold } : { color: colors.textSecondary },
              ]}
            >
              POST
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!isUploading) {
                setActiveMode('REEL');
                setSelectedMedia(null);
              }
            }}
            style={[
              styles.modeTab,
              activeMode === 'REEL' && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 },
            ]}
          >
            <ThemedText
              style={[
                styles.modeTabText,
                activeMode === 'REEL' ? { color: colors.text, fontFamily: Fonts.bold } : { color: colors.textSecondary },
              ]}
            >
              REEL
            </ThemedText>
          </Pressable>
        </View>

        {/* glassmorphic Upload Progress Overlay */}
        {isUploading && (
          <View style={styles.loadingOverlay}>
            <View style={[styles.loadingBox, { backgroundColor: isDarkTheme ? '#1C1C1E' : '#FFFFFF' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={[styles.loadingTitle, { color: colors.text }]}>
                Uploading to Cloudinary...
              </ThemedText>
              <ThemedText style={[styles.loadingProgress, { color: colors.primary }]}>
                {uploadProgress}%
              </ThemedText>
              <View style={[styles.progressBarBg, { backgroundColor: isDarkTheme ? '#2C2C2E' : '#E5E5EA' }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${uploadProgress}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    padding: 5,
    minWidth: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderWrapper: {
    alignItems: 'center',
    gap: 10,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  mediaButtonsRow: {
    position: 'absolute',
    bottom: 15,
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  pickerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  formContainer: {
    paddingHorizontal: 15,
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 15,
  },
  inputIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    padding: 0,
    textAlignVertical: 'top',
  },
  modePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modeTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTabText: {
    fontSize: 14,
    letterSpacing: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    width: 270,
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  loadingTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingProgress: {
    fontFamily: Fonts.bold,
    fontSize: 18,
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
