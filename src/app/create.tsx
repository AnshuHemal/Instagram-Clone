import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  FlatList,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/contexts/PostsContext';
import { useReels } from '@/contexts/ReelsContext';
import { ThemedText } from '@/components/themed-text';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── expo-video dynamic import ────────────────────────────────────────────────
let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (_) {}

interface SelectedMedia {
  key: string;
  uri: string;
  type: 'image' | 'video';
  progress: number;
  uploadedUrl?: string;
}

type CreateMode = 'POST' | 'REEL';

// ─── MediaPreviewItem ─────────────────────────────────────────────────────────

const MediaPreviewItem = React.memo(({
  item,
  width,
}: {
  item: SelectedMedia;
  width: number;
}) => {
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    if (!ExpoVideo || item.type !== 'video') return;
    let p: any = null;
    try {
      p = ExpoVideo.createVideoPlayer(item.uri);
      p.loop = true;
      p.muted = true;
      p.play();
      setPlayer(p);
    } catch (_) {}
    return () => {
      if (p) {
        try {
          p.pause();
          p.release();
        } catch (_) {}
      }
    };
  }, [item.uri]);

  return (
    <View style={{ width, aspectRatio: 1, backgroundColor: '#000' }}>
      {item.type === 'video' && ExpoVideo && player ? (
        <ExpoVideo.VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
      {item.type === 'video' && (
        <View style={styles.videoTypeBadge}>
          <Ionicons name="videocam" size={12} color="#FFF" />
        </View>
      )}
    </View>
  );
});

// ─── ThumbnailStrip ───────────────────────────────────────────────────────────

const THUMB_SIZE = 72;
const THUMB_GAP = 8;

const ThumbnailStrip = ({
  media,
  activeIndex,
  onThumbnailPress,
  onRemove,
  onAdd,
  maxReached,
  colors,
  isDark,
}: {
  media: SelectedMedia[];
  activeIndex: number;
  onThumbnailPress: (index: number) => void;
  onRemove: (key: string) => void;
  onAdd: () => void;
  maxReached: boolean;
  colors: any;
  isDark: boolean;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.thumbStripContent}
    style={styles.thumbStrip}
  >
    {media.map((item, index) => (
      <Animated.View
        key={item.key}
        entering={FadeIn.duration(220)}
        style={[
          styles.thumbWrapper,
          activeIndex === index && { borderColor: '#0095F6', borderWidth: 2 },
        ]}
      >
        <Pressable
          onPress={() => {
            haptics.selection();
            onThumbnailPress(index);
          }}
          style={styles.thumbPressable}
        >
          <Image source={{ uri: item.uri }} style={styles.thumbImage} />
          {item.type === 'video' && (
            <View style={styles.thumbVideoBadge}>
              <Ionicons name="videocam" size={10} color="#FFF" />
            </View>
          )}
          <View style={[styles.orderBadge, activeIndex === index && { backgroundColor: '#0095F6' }]}>
            <Text style={styles.orderBadgeText}>{index + 1}</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => {
            haptics.light();
            onRemove(item.key);
          }}
          style={styles.thumbRemoveBtn}
          hitSlop={6}
        >
          <Ionicons name="close-circle" size={18} color="#FF3B30" />
        </Pressable>
      </Animated.View>
    ))}

    {!maxReached && (
      <Pressable
        onPress={() => {
          haptics.light();
          onAdd();
        }}
        style={[
          styles.thumbAddBtn,
          {
            backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
            borderColor: isDark ? '#3A3A3C' : '#D1D1D6',
          },
        ]}
      >
        <Ionicons name="add" size={24} color={colors.text} />
      </Pressable>
    )}
  </ScrollView>
);

// ─── UploadProgressOverlay ────────────────────────────────────────────────────

const UploadProgressOverlay = ({
  visible,
  overallProgress,
  currentFileIndex,
  totalFiles,
  isDark,
  colors,
}: {
  visible: boolean;
  overallProgress: number;
  currentFileIndex: number;
  totalFiles: number;
  isDark: boolean;
  colors: any;
}) => {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.uploadOverlay}>
      <Animated.View
        entering={SlideInDown.springify().damping(18)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.uploadCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
      >
        <View style={styles.uploadIconRing}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>

        <ThemedText style={[styles.uploadTitle, { color: colors.text }]}>
          {overallProgress < 100 ? 'Uploading content...' : 'Saving post...'}
        </ThemedText>

        {totalFiles > 1 && (
          <ThemedText style={[styles.uploadSubtitle, { color: colors.textSecondary }]}>
            File {Math.min(currentFileIndex + 1, totalFiles)} of {totalFiles}
          </ThemedText>
        )}

        <View style={[styles.progressTrack, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${overallProgress}%`,
                backgroundColor: '#0095F6',
              },
            ]}
          />
        </View>

        <ThemedText style={[styles.uploadPercent, { color: '#0095F6' }]}>
          {Math.round(overallProgress)}%
        </ThemedText>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Main Screen Component ─────────────────────────────────────────────────────

export default function CreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { fetchPosts } = usePosts();
  const { fetchReels } = useReels();

  // Mode: POST allows multi-media, REEL allows a single video
  const [activeMode, setActiveMode] = useState<CreateMode>('POST');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Form Fields
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [audioName, setAudioName] = useState('Original Audio');

  // Loading & Upload Progress States
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Read mode from search params on mount
  useEffect(() => {
    if (params.mode === 'REEL') {
      setActiveMode('REEL');
    }
  }, [params.mode]);

  const handlePickMedia = async (useCamera = false) => {
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          `We need access to your ${useCamera ? 'camera' : 'gallery'} to select photos/videos.`
        );
        return;
      }

      const isReelMode = activeMode === 'REEL';
      const maxCount = isReelMode ? 1 : 10 - selectedMedia.length;

      if (maxCount <= 0) {
        Alert.alert('Limit Reached', 'You can select up to 10 files for a post.');
        return;
      }

      const mediaTypes = isReelMode
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.All;

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes,
            allowsMultipleSelection: !isReelMode,
            selectionLimit: maxCount,
            quality: 0.8,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems: SelectedMedia[] = result.assets.map((asset, idx) => {
          const isVideo =
            asset.type === 'video' ||
            asset.mimeType?.startsWith('video') ||
            asset.uri.toLowerCase().endsWith('.mp4') ||
            asset.uri.toLowerCase().endsWith('.mov');

          return {
            key: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
            uri: asset.uri,
            type: isVideo ? 'video' : 'image',
            progress: 0,
          };
        });

        if (isReelMode) {
          setSelectedMedia(newItems);
          setActiveIndex(0);
        } else {
          setSelectedMedia((prev) => [...prev, ...newItems].slice(0, 10));
        }
      }
    } catch (err) {
      console.error('Pick media error:', err);
      Alert.alert('Error', 'Failed to pick media. Please try again.');
    }
  };

  const handleRemoveMedia = (key: string) => {
    setSelectedMedia((prev) => {
      const filtered = prev.filter((m) => m.key !== key);
      // Adjust active index
      if (activeIndex >= filtered.length && filtered.length > 0) {
        setActiveIndex(filtered.length - 1);
      }
      return filtered;
    });
  };

  // Compute overall progress as average of all items
  const overallProgress = useMemo(() => {
    if (selectedMedia.length === 0) return 0;
    const total = selectedMedia.reduce((sum, item) => sum + item.progress, 0);
    return total / selectedMedia.length;
  }, [selectedMedia]);

  const handleShare = async () => {
    if (selectedMedia.length === 0) {
      Alert.alert('Error', 'Please select at least one media file.');
      return;
    }

    setIsUploading(true);
    setCurrentFileIndex(0);

    try {
      // 1. Upload each media item sequentially to Cloudinary
      const uploadedMedia: { url: string; type: 'IMAGE' | 'VIDEO'; orderIndex: number }[] = [];

      for (let i = 0; i < selectedMedia.length; i++) {
        setCurrentFileIndex(i);
        const item = selectedMedia[i];

        // Fetch signed upload parameters
        const signatureRes = await api.post(`/posts/upload-signature?resourceType=${item.type}`);
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

        // Build FormData
        const formData = new FormData();
        const uriParts = item.uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        const fileExt = fileName.split('.').pop() || (item.type === 'video' ? 'mp4' : 'jpg');

        formData.append('file', {
          uri: Platform.OS === 'android' ? item.uri : item.uri.replace('file://', ''),
          name: fileName || `file-${i}.${fileExt}`,
          type: item.type === 'video' ? `video/${fileExt}` : `image/${fileExt}`,
        } as any);

        formData.append('api_key', apiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('signature', signature);
        formData.append('folder', folder);
        formData.append('upload_preset', uploadPreset);
        formData.append('context', `user_id=${user?.id}`);

        if (item.type === 'video') {
          if (eager) formData.append('eager', eager);
          formData.append('eager_async', 'true');
          if (notificationUrl) {
            formData.append('notification_url', notificationUrl);
            formData.append('eager_notification_url', notificationUrl);
          }
        }

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${item.type}/upload`;

        const uploadRes = await axios.post(uploadUrl, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setSelectedMedia((prev) =>
                prev.map((m) => (m.key === item.key ? { ...m, progress: percent } : m))
              );
            }
          },
        });

        uploadedMedia.push({
          url: uploadRes.data.secure_url,
          type: item.type === 'video' ? 'VIDEO' : 'IMAGE',
          orderIndex: i,
        });
      }

      // 2. Submit saved URLs to backend DB
      if (activeMode === 'POST') {
        await api.post('/posts', {
          caption: caption.trim() || undefined,
          location: location.trim() || undefined,
          media: uploadedMedia.map((um) => ({
            mediaUrl: um.url,
            mediaType: um.type,
            orderIndex: um.orderIndex,
          })),
        });
        fetchPosts(null, true).catch(() => {});
      } else {
        // Reel creation (takes the first video uploaded)
        const primaryMedia = uploadedMedia[0];
        // Parse hashtags
        const hashtags = caption.match(/#(\w+)/g)?.map((tag) => tag.slice(1)) || [];
        
        // Find public_id from secure URL
        // Example: https://res.cloudinary.com/demo/video/upload/v1570592929/folder/name.mp4 -> folder/name
        const urlParts = primaryMedia.url.split('/upload/');
        const publicIdWithExt = urlParts[urlParts.length - 1].split('/').slice(1).join('/'); // remove version e.g. v1570592929
        const cloudinaryPublicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;

        await api.post('/reels', {
          cloudinaryPublicId,
          caption: caption.trim() || undefined,
          audioName: audioName.trim() || 'Original Audio',
          hashtags,
        });
        fetchReels(null, true).catch(() => {});
      }

      // 3. Clear State & Route Back
      setCaption('');
      setLocation('');
      setAudioName('Original Audio');
      setSelectedMedia([]);
      setActiveIndex(0);

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
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const isFormValid = selectedMedia.length > 0;
  const isDarkTheme = isDark;
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
          {/* Swipeable Carousel / Single Preview Container */}
          <View style={[styles.previewContainer, { backgroundColor: isDarkTheme ? '#000000' : '#EAEAEA' }]}>
            {selectedMedia.length > 0 ? (
              <FlatList
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                data={selectedMedia}
                keyExtractor={(item) => item.key}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setActiveIndex(index);
                }}
                renderItem={({ item }) => (
                  <MediaPreviewItem item={item} width={SCREEN_WIDTH} />
                )}
              />
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

            {/* Position Indicator Badge */}
            {selectedMedia.length > 1 && (
              <View style={styles.indicatorBadge}>
                <Text style={styles.indicatorText}>
                  {activeIndex + 1} / {selectedMedia.length}
                </Text>
              </View>
            )}
          </View>

          {/* Thumbnail strip for reordering/removing */}
          {activeMode === 'POST' && selectedMedia.length > 0 && (
            <ThumbnailStrip
              media={selectedMedia}
              activeIndex={activeIndex}
              onThumbnailPress={(index) => setActiveIndex(index)}
              onRemove={handleRemoveMedia}
              onAdd={() => handlePickMedia(false)}
              maxReached={selectedMedia.length >= 10}
              colors={colors}
              isDark={isDarkTheme}
            />
          )}

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
                setSelectedMedia([]);
                setActiveIndex(0);
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
                setSelectedMedia([]);
                setActiveIndex(0);
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

        {/* Dynamic Upload Progress Overlay */}
        <UploadProgressOverlay
          visible={isUploading}
          overallProgress={overallProgress}
          currentFileIndex={currentFileIndex}
          totalFiles={selectedMedia.length}
          isDark={isDarkTheme}
          colors={colors}
        />
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
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
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
    zIndex: 10,
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
  indicatorBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 10,
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  videoTypeBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Thumbnail Strip styles
  thumbStrip: {
    height: THUMB_SIZE + 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  thumbStripContent: {
    paddingHorizontal: 15,
    gap: THUMB_GAP,
    alignItems: 'center',
  },
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    overflow: 'visible',
    position: 'relative',
  },
  thumbPressable: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbVideoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  thumbRemoveBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  thumbAddBtn: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Upload overlay styles
  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  uploadCard: {
    width: 290,
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
  uploadIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  uploadTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16.5,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  uploadPercent: {
    fontFamily: Fonts.bold,
    fontSize: 17,
  },
});
