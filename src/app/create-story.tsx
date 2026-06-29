import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import { useStories } from '@/contexts/StoriesContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Premium Predefined Gradients
const PRESET_GRADIENTS = [
  ['#8a3ab9', '#e95950', '#fccc63'], // IG Classic
  ['#F5576C', '#F093FB'],           // Sunset pink/purple
  ['#2193b0', '#6dd5ed'],           // Ocean Breeze
  ['#FF5F6D', '#FFC371'],           // Creampie orange
  ['#111111', '#2c3e50'],           // Sleek Dark
  ['#a8c0ff', '#3f2b96'],           // Royal Lavender
];

export default function CreateStoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mediaUrl: string;
    postId: string;
    type: string;
    postType: 'post' | 'reel';
  }>();

  const { uploadStory } = useStories();
  const { showToast } = useToast();
  const { colors } = useTheme();

  // Story state
  const [gradientIndex, setGradientIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [postData, setPostData] = useState<any>(null);
  const [loadingPost, setLoadingPost] = useState(true);

  // View shot ref
  const canvasRef = useRef<View>(null);

  // Sticker Shared Values (Zoom, Rotation, Offset)
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Offset storage for continuous gestures
  const prevTranslationX = useSharedValue(0);
  const prevTranslationY = useSharedValue(0);
  const prevScale = useSharedValue(1);
  const prevRotation = useSharedValue(0);

  // Fetch post/reel details to render the sticker card
  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!params.postId) return;
      try {
        setLoadingPost(true);
        const endpoint = params.postType === 'reel' ? `/reels/${params.postId}` : `/posts/${params.postId}`;
        const res = await api.get(endpoint);
        // Post/Reel controller payloads vary, normalize user/caption
        if (res.data) {
          const raw = res.data.data;
          setPostData({
            username: raw?.user?.username || raw?.author?.username || 'user',
            avatarUrl: raw?.user?.avatarUrl || raw?.author?.avatarUrl || '',
            isVerified: !!(raw?.user?.isVerified || raw?.author?.isVerified),
            caption: raw?.caption || '',
          });
        }
      } catch (err) {
        console.error('[CreateStory] Failed to fetch post details:', err);
      } finally {
        setLoadingPost(false);
      }
    };
    fetchPostDetails();
  }, [params.postId, params.postType]);

  // Gestures setup
  const panGesture = Gesture.Pan()
    .minDistance(1)
    .onUpdate((event) => {
      translationX.value = prevTranslationX.value + event.translationX;
      translationY.value = prevTranslationY.value + event.translationY;
    })
    .onEnd(() => {
      prevTranslationX.value = translationX.value;
      prevTranslationY.value = translationY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(0.5, Math.min(3, prevScale.value * event.scale));
    })
    .onEnd(() => {
      prevScale.value = scale.value;
    });

  const rotationGesture = Gesture.Rotation()
    .onUpdate((event) => {
      rotation.value = prevRotation.value + event.rotation;
    })
    .onEnd(() => {
      prevRotation.value = rotation.value;
    });

  // Combine gestures so they can work simultaneously
  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture);

  const stickerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: scale.value },
      { rotate: `${(rotation.value * 180) / Math.PI}deg` },
    ],
  }));

  // Toggle Background Gradient
  const cycleGradient = () => {
    haptics.light();
    setGradientIndex((prev) => (prev + 1) % PRESET_GRADIENTS.length);
  };

  // Compile and upload the story
  const handleShareStory = async () => {
    if (isUploading) return;
    setIsUploading(true);
    haptics.medium();

    showToast({
      title: 'Sharing Story',
      message: 'Composing your sticker layout...',
      type: 'info',
    });

    try {
      // Capture the canvas ref to create a composite JPEG file
      const capturedUri = await captureRef(canvasRef, {
        format: 'jpg',
        quality: 0.9,
      });

      if (!capturedUri) {
        throw new Error('Composed canvas image was empty');
      }

      // Upload to Cloudinary & register in Neon DB linking parentPostId
      const success = await uploadStory(
        capturedUri,
        'image',
        params.postId,
        params.postType
      );

      if (success) {
        showToast({
          title: 'Story Shared',
          message: 'Post shared to your story successfully!',
          type: 'success',
        });
        // Go back to feed/tabs
        router.dismissAll();
        router.replace('/(tabs)');
      } else {
        throw new Error('StoriesContext upload method returned false');
      }
    } catch (err) {
      console.error('[CreateStory] Failed to compose/share story:', err);
      showToast({
        title: 'Share Failed',
        message: 'Could not upload story. Please try again.',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const currentGradient = PRESET_GRADIENTS[gradientIndex];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Top Header controls */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              haptics.light();
              router.back();
            }}
            style={styles.circleBtn}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </Pressable>

          <Text style={styles.headerTitle}>Story Draft</Text>

          <Pressable onPress={cycleGradient} style={styles.circleBtn}>
            <Ionicons name="color-palette-outline" size={22} color="#FFF" />
          </Pressable>
        </View>

        {/* Story Canvas Area */}
        <View style={styles.canvasContainer}>
          <View
            ref={canvasRef}
            collapsable={false}
            style={styles.canvas}
          >
            <LinearGradient
              colors={currentGradient as any}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* Hint text */}
            <Text style={styles.hintText}>Pinch to scale/rotate • Drag to move</Text>

            {/* Post Sticker Component */}
            {loadingPost ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <GestureDetector gesture={combinedGesture}>
                <Animated.View style={[styles.stickerCard, stickerAnimatedStyle]}>
                  {/* Sticker header */}
                  <View style={styles.stickerHeader}>
                    <Image
                      source={{ uri: postData?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }}
                      style={styles.stickerAvatar}
                    />
                    <Text style={styles.stickerUsername} numberOfLines={1}>
                      {postData?.username}
                    </Text>
                    {postData?.isVerified && (
                      <Ionicons name="checkmark-circle" size={13} color="#0095F6" style={{ marginLeft: 3 }} />
                    )}
                  </View>

                  {/* Post Media Preview */}
                  <Image
                    source={{ uri: params.mediaUrl }}
                    style={styles.stickerMedia}
                    contentFit="cover"
                  />

                  {/* Optional small caption snippet */}
                  {postData?.caption ? (
                    <Text style={styles.stickerCaption} numberOfLines={1}>
                      {postData.caption}
                    </Text>
                  ) : null}
                </Animated.View>
              </GestureDetector>
            )}
          </View>
        </View>

        {/* Footer actions */}
        <View style={styles.footer}>
          <Pressable
            disabled={isUploading || loadingPost}
            onPress={handleShareStory}
            style={({ pressed }) => [
              styles.shareBtn,
              (isUploading || loadingPost) && { opacity: 0.5 },
              pressed && { scale: 0.98 },
            ]}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Text style={styles.shareBtnText}>Share to story</Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  canvas: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  hintText: {
    position: 'absolute',
    top: 20,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  stickerCard: {
    width: SCREEN_WIDTH * 0.72,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  stickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stickerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAEAEA',
  },
  stickerUsername: {
    color: '#000000',
    fontFamily: Fonts.bold,
    fontSize: 13,
    marginLeft: 8,
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  stickerMedia: {
    width: '100%',
    height: SCREEN_WIDTH * 0.72,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
  },
  stickerCaption: {
    color: '#666',
    fontFamily: Fonts.regular,
    fontSize: 11,
    marginTop: 8,
    lineHeight: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    gap: 8,
    width: '100%',
  },
  shareBtnText: {
    color: '#000000',
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
});
