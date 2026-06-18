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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInDown,
  SlideOutDown,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
import ProgressRing, { PulsingDot } from '@/components/reel-creation/ProgressRing';
import HashtagInput from '@/components/reel-creation/HashtagInput';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Preview height: 50% of screen height, capped at SCREEN_WIDTH (square)
const PREVIEW_HEIGHT = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT * 0.50);

// ─── expo-video dynamic import ────────────────────────────────────────────────
let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (_) {}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectedMedia {
  key: string;
  uri: string;
  type: 'image' | 'video';
  progress: number;
  uploadedUrl?: string;
}

interface SelectedVideo {
  uri: string;
  duration: number | null; // seconds
}

type CreateMode = 'POST' | 'REEL';
type ReelWizardStep = 'pick' | 'caption' | 'processing';
type UploadPhase =
  | 'idle'
  | 'uploading'
  | 'creating'
  | 'polling'
  | 'success'
  | 'timeout'
  | 'error';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


// ─── MediaPreviewItem (POST mode) ─────────────────────────────────────────────

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


// ─── ThumbnailStrip (POST mode) ───────────────────────────────────────────────

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


// ─── UploadProgressOverlay (POST mode) ───────────────────────────────────────

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
              { width: `${overallProgress}%`, backgroundColor: '#0095F6' },
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


// ─── MediaPickStep (REEL Step 1) ──────────────────────────────────────────────

interface MediaPickStepProps {
  onVideoSelected: (v: SelectedVideo) => void;
  onSwitchToPost: () => void;
  onClose: () => void;
  insets: { top: number; bottom: number };
}

function MediaPickStep({ onVideoSelected, onSwitchToPost, onClose, insets: safeInsets }: MediaPickStepProps) {
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(null);
  const [videoPlayer, setVideoPlayer] = useState<any>(null);

  // Animations
  const nextBtnScale = useSharedValue(0);
  const nextBtnOpacity = useSharedValue(0);
  const bottomPanelY = useSharedValue(0);

  // Gradient pulse
  const gradientOpacity = useSharedValue(1);
  useEffect(() => {
    gradientOpacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 2500 }),
        withTiming(1, { duration: 2500 }),
      ),
      -1,
      true,
    );
  }, []);
  const gradientAnimStyle = useAnimatedStyle(() => ({ opacity: gradientOpacity.value }));

  const nextBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextBtnScale.value }],
    opacity: nextBtnOpacity.value,
  }));

  useEffect(() => {
    return () => {
      if (videoPlayer) {
        try { videoPlayer.pause(); } catch (_) {}
        setTimeout(() => { try { videoPlayer.release(); } catch (_) {} }, 3000);
      }
    };
  }, [videoPlayer]);

  const handlePickGallery = async () => {
    haptics.light();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your gallery to select videos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) applySelectedVideo(result.assets[0]);
  };

  const handlePickCamera = async () => {
    haptics.light();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your camera to record videos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) applySelectedVideo(result.assets[0]);
  };

  const applySelectedVideo = (asset: ImagePicker.ImagePickerAsset) => {
    const video: SelectedVideo = { uri: asset.uri, duration: asset.duration ?? null };
    setSelectedVideo(video);
    if (ExpoVideo) {
      try {
        const p = ExpoVideo.createVideoPlayer(asset.uri);
        p.loop = true; p.muted = true; p.play();
        setVideoPlayer(p);
      } catch (_) {}
    }
    nextBtnScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    nextBtnOpacity.value = withTiming(1, { duration: 200 });
  };

  const topPad = safeInsets.top;
  const botPad = safeInsets.bottom;

  return (
    <View style={styles.pickScreen}>

      {/* ── Background: animated gradient OR full-screen video ── */}
      {selectedVideo ? (
        <View style={StyleSheet.absoluteFill}>
          {ExpoVideo && videoPlayer ? (
            <ExpoVideo.VideoView
              player={videoPlayer}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              nativeControls={false}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />
          )}
          {/* readability gradient over video */}
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'transparent', 'transparent', 'rgba(0,0,0,0.75)']}
            locations={[0, 0.25, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : (
        <Animated.View style={[StyleSheet.absoluteFill, gradientAnimStyle]}>
          <LinearGradient
            colors={['#1a0533', '#3d0d4a', '#6b1f6e', '#c0392b', '#e67e22', '#1a0533']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* ── Top bar: Close + POST|REEL pill ── */}
      <View style={[styles.pickTopBar, { paddingTop: topPad + 10 }]}>
        <Pressable onPress={() => { haptics.light(); onClose(); }} style={styles.pickCloseBtn} hitSlop={8}>
          <Ionicons name="close" size={20} color="#FFF" />
        </Pressable>

        <View style={styles.pickModePill}>
          <Pressable onPress={() => { haptics.selection(); onSwitchToPost(); }} style={styles.pickModeOption} hitSlop={6}>
            <Text style={styles.pickModeInactive}>POST</Text>
          </Pressable>
          <View style={styles.pickModeActivePill}>
            <Text style={styles.pickModeActiveText}>REEL</Text>
          </View>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* ── Center hint — only when no video selected ── */}
      {!selectedVideo && (
        <View style={styles.pickCenterHint} pointerEvents="none">
          <View style={styles.pickCenterIconRing}>
            <Ionicons name="videocam-outline" size={36} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.pickCenterTitle}>Create a Reel</Text>
          <Text style={styles.pickCenterSub}>Pick a video from your gallery{'\n'}or record one now</Text>
        </View>
      )}

      {/* ── Duration badge over selected video ── */}
      {selectedVideo?.duration != null && (
        <View style={[styles.pickDurationBadge, { top: topPad + 64 }]}>
          <Ionicons name="time-outline" size={12} color="#FFF" />
          <Text style={styles.pickDurationText}>{formatDuration(selectedVideo.duration)}</Text>
        </View>
      )}

      {/* ── Bottom action panel ── */}
      <View style={[styles.pickBottomPanel, { paddingBottom: botPad + 20 }]}>
        {/* Gallery & Camera */}
        <View style={styles.pickActionsRow}>
          <Pressable style={styles.pickActionBtn} onPress={handlePickGallery}>
            <Ionicons name="images" size={20} color="#FFF" />
            <Text style={styles.pickActionLabel}>Gallery</Text>
          </Pressable>
          <Pressable style={styles.pickActionBtn} onPress={handlePickCamera}>
            <Ionicons name="camera" size={20} color="#FFF" />
            <Text style={styles.pickActionLabel}>Camera</Text>
          </Pressable>
        </View>

        {/* Continue button — springs in after video selected */}
        <Animated.View style={[{ width: '100%' }, nextBtnAnimStyle]}>
          <Pressable
            style={styles.pickNextBtn}
            onPress={() => { if (selectedVideo) { haptics.medium(); onVideoSelected(selectedVideo); } }}
          >
            <Text style={styles.pickNextBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}


// ─── CaptionStep (REEL Step 2) ────────────────────────────────────────────────

const TRENDING_SOUNDS = ['Original Audio', 'Lo-fi Study', 'Chill Vibes', 'EDM Drop', 'Nature Sounds'];

interface CaptionStepProps {
  video: SelectedVideo;
  onBack: () => void;
  onShare: (caption: string, audioName: string, location: string) => void;
  isSharing: boolean;
}

function CaptionStep({ video, onBack, onShare, isSharing }: CaptionStepProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [audioName, setAudioName] = useState('Original Audio');
  const [location, setLocation] = useState('');

  const dividerColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const textColor = colors.text;
  const placeholderColor = isDark ? '#8E8E8F' : '#9E9E9E';

  return (
    <SafeAreaView style={[styles.captionStep, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.captionHeader, { borderBottomColor: dividerColor }]}>
        <Pressable
          onPress={() => { haptics.light(); onBack(); }}
          style={styles.headerButton}
          disabled={isSharing}
        >
          <Ionicons name="chevron-back" size={26} color={textColor} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>New Reel</ThemedText>
        <Pressable
          onPress={() => {
            if (!isSharing) {
              haptics.medium();
              onShare(caption, audioName, location);
            }
          }}
          style={styles.headerButton}
          disabled={isSharing}
        >
          <ThemedText
            style={[
              styles.shareButtonText,
              { color: isSharing ? colors.textSecondary : '#0095F6' },
            ]}
          >
            Share
          </ThemedText>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.captionScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Caption row: avatar + HashtagInput */}
          <View style={[styles.captionRow, { borderBottomColor: dividerColor }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.captionAvatar} />
            ) : (
              <View style={[styles.captionAvatar, { backgroundColor: '#555' }]} />
            )}
            <HashtagInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption..."
              numberOfLines={4}
              textColor={textColor}
            />
          </View>

          {/* Audio name */}
          <View style={[styles.captionInputRow, { borderBottomColor: dividerColor }]}>
            <Ionicons name="musical-notes-outline" size={20} color={textColor} style={styles.inputIcon} />
            <TextInput
              value={audioName}
              onChangeText={setAudioName}
              placeholder="Audio name"
              placeholderTextColor={placeholderColor}
              style={[styles.captionInputField, { color: textColor }]}
            />
          </View>

          {/* Trending sounds */}
          <View style={[styles.trendingSection, { borderBottomColor: dividerColor }]}>
            <ThemedText style={[styles.trendingLabel, { color: colors.textSecondary }]}>
              Trending sounds
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingPillsRow}>
              {TRENDING_SOUNDS.map((sound) => (
                <Pressable
                  key={sound}
                  style={[
                    styles.soundPill,
                    {
                      backgroundColor: audioName === sound ? '#0095F6' : (isDark ? '#2C2C2E' : '#F2F2F7'),
                      borderColor: audioName === sound ? '#0095F6' : (isDark ? '#3A3A3C' : '#D1D1D6'),
                    },
                  ]}
                  onPress={() => {
                    haptics.selection();
                    setAudioName(sound);
                  }}
                >
                  <Text style={[styles.soundPillText, { color: audioName === sound ? '#FFF' : textColor }]}>
                    {sound}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Location */}
          <View style={[styles.captionInputRow, { borderBottomColor: dividerColor }]}>
            <Ionicons name="location-outline" size={20} color={textColor} style={styles.inputIcon} />
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Add location"
              placeholderTextColor={placeholderColor}
              style={[styles.captionInputField, { color: textColor }]}
            />
          </View>

          {/* UI-only rows */}
          {['Tag people', 'Add to Collections', 'Advanced Settings'].map((label) => (
            <View key={label} style={[styles.uiOnlyRow, { borderBottomColor: dividerColor }]}>
              <ThemedText style={[styles.uiOnlyRowText, { color: textColor }]}>{label}</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


// ─── ProcessingStep (REEL Step 3) ─────────────────────────────────────────────

interface ProcessingStepProps {
  phase: UploadPhase;
  uploadProgress: number;
  onDone: () => void;
  onViewReel?: () => void;
  onViewProfile?: () => void;
  onRetry?: () => void;
}

const PHASE_CONFIG: Record<UploadPhase, { ringColor: string; statusText: string; progress: number }> = {
  idle:      { ringColor: '#8E8E8F', statusText: 'Preparing...', progress: 0 },
  uploading: { ringColor: '#FF9500', statusText: 'Uploading...', progress: 0 },
  creating:  { ringColor: '#0095F6', statusText: 'Processing...', progress: 0.95 },
  polling:   { ringColor: '#0095F6', statusText: 'Processing...', progress: 0.95 },
  success:   { ringColor: '#34C759', statusText: 'Your reel is live!', progress: 1 },
  timeout:   { ringColor: '#FF9500', statusText: 'Still processing...', progress: 0.95 },
  error:     { ringColor: '#FF3B30', statusText: 'Upload failed', progress: 0 },
};

function ProcessingStep({ phase, uploadProgress, onDone, onViewReel, onViewProfile, onRetry }: ProcessingStepProps) {
  const { colors, isDark } = useTheme();

  const config = PHASE_CONFIG[phase];
  const ringProgress =
    phase === 'uploading' ? uploadProgress : config.progress;

  // Success checkmark scale
  const checkScale = useSharedValue(0);
  useEffect(() => {
    if (phase === 'success') {
      checkScale.value = withSpring(1, { damping: 12, stiffness: 160 });
    } else {
      checkScale.value = 0;
    }
  }, [phase]);
  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const progressText =
    phase === 'uploading'
      ? `${Math.round(uploadProgress * 100)}%`
      : '';

  const iconForPhase = () => {
    if (phase === 'success') {
      return (
        <Animated.View style={checkAnimStyle}>
          <Ionicons name="checkmark-circle" size={32} color="#34C759" />
        </Animated.View>
      );
    }
    if (phase === 'timeout') return <Ionicons name="time-outline" size={32} color="#FF9500" />;
    if (phase === 'error') return <Ionicons name="close-circle" size={32} color="#FF3B30" />;
    return (
      <PulsingDot size={32} color="transparent">
        <Ionicons name="film-outline" size={28} color="#FFFFFF" />
      </PulsingDot>
    );
  };

  return (
    <SafeAreaView style={[styles.processingStep, { backgroundColor: colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.processingContent}>

        {/* Ring with center icon */}
        <View style={styles.ringWrapper}>
          <ProgressRing
            progress={ringProgress}
            size={160}
            strokeWidth={10}
            color={config.ringColor}
            backgroundColor={isDark ? '#2C2C2E' : '#E5E5EA'}
          />
          <View style={styles.ringCenter}>
            {iconForPhase()}
          </View>
        </View>

        {/* Status text — key forces remount for fade animation */}
        <Animated.View key={config.statusText} entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
          <Text style={[styles.processingStatusText, { color: colors.text }]}>
            {config.statusText}
          </Text>
          {progressText ? (
            <Text style={[styles.processingProgressText, { color: config.ringColor }]}>
              {progressText}
            </Text>
          ) : null}
        </Animated.View>

        {/* Action buttons */}
        <View style={styles.processingActions}>
          {phase === 'success' && (
            <>
              {onViewReel && (
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#0095F6' }]}
                  onPress={() => { haptics.light(); onViewReel(); }}
                >
                  <Text style={styles.actionBtnText}>View Reel</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.actionBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
                onPress={() => { haptics.success(); onDone(); }}
              >
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Done</Text>
              </Pressable>
            </>
          )}
          {phase === 'timeout' && (
            <>
              {onViewProfile && (
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#0095F6' }]}
                  onPress={() => { haptics.light(); onViewProfile(); }}
                >
                  <Text style={styles.actionBtnText}>View Profile</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.actionBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
                onPress={() => { haptics.success(); onDone(); }}
              >
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Done</Text>
              </Pressable>
            </>
          )}
          {phase === 'error' && onRetry && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]}
              onPress={() => { haptics.error(); onRetry(); }}
            >
              <Text style={styles.actionBtnText}>Try Again</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}


// ─── Main CreateScreen ────────────────────────────────────────────────────────

export default function CreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { fetchPosts } = usePosts();
  const { fetchReels } = useReels();

  // ── Shared mode state ──
  const [activeMode, setActiveMode] = useState<CreateMode>('POST');

  // ── REEL wizard state ──
  const [reelStep, setReelStep] = useState<ReelWizardStep>('pick');
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  // Store caption/audio for runReelUpload (set in CaptionStep onShare)
  const pendingCaptionRef = useRef('');
  const pendingAudioRef = useRef('Original Audio');
  const pendingLocationRef = useRef('');

  // ── POST mode state ──
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [audioName, setAudioName] = useState('Original Audio');
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Read mode param on mount
  useEffect(() => {
    if (params.mode === 'REEL') {
      setActiveMode('REEL');
    }
  }, [params.mode]);

  // Reset reel wizard when switching to REEL tab
  const handleSwitchMode = (mode: CreateMode) => {
    if (isUploading || isSharing) return;
    setActiveMode(mode);
    setSelectedMedia([]);
    setActiveIndex(0);
    if (mode === 'REEL') {
      setReelStep('pick');
      setSelectedVideo(null);
      setUploadPhase('idle');
      setUploadProgress(0);
    }
  };

  // ── Upload orchestration for REEL ──────────────────────────────────────────
  const runReelUpload = async (video: SelectedVideo, cap: string, audio: string) => {
    try {
      // 1. Get upload signature
      setUploadPhase('uploading');
      setUploadProgress(0);

      const sigRes = await api.post('/reels/upload-signature');
      const signData = sigRes.data.data;
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

      // 2. Build FormData
      const formData = new FormData();
      const uriParts = video.uri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      const fileExt = fileName.split('.').pop() || 'mp4';

      formData.append('file', {
        uri: Platform.OS === 'android' ? video.uri : video.uri.replace('file://', ''),
        name: fileName || `reel-video.${fileExt}`,
        type: `video/${fileExt}`,
      } as any);

      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', folder);
      formData.append('upload_preset', uploadPreset);
      if (eager) formData.append('eager', eager);
      formData.append('eager_async', 'true');
      if (notificationUrl) {
        formData.append('notification_url', notificationUrl);
        formData.append('eager_notification_url', notificationUrl);
      }

      // 3. Upload to Cloudinary
      const uploadRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            setUploadProgress(e.loaded / (e.total ?? 1));
          },
        },
      );

      const cloudinaryPublicId: string = uploadRes.data.public_id;

      // 4. Create DB record
      setUploadPhase('creating');
      const hashtags = cap.match(/#(\w+)/g)?.map((t) => t.slice(1)) ?? [];
      const createRes = await api.post('/reels', {
        cloudinaryPublicId,
        caption: cap.trim() || undefined,
        audioName: audio.trim() || 'Original Audio',
        hashtags,
      });
      const reelId: string = createRes.data.data.id;

      // 5. Poll for READY
      setUploadPhase('polling');
      const started = Date.now();
      while (Date.now() - started < 60_000) {
        await sleep(2000);
        try {
          const statusRes = await api.get(`/reels/${reelId}`);
          if (statusRes.data.data?.status === 'READY') {
            setUploadPhase('success');
            return;
          }
        } catch (_) {
          // network blip during poll — continue
        }
      }
      setUploadPhase('timeout');
    } catch (err: any) {
      console.error('[runReelUpload] error:', err);
      setUploadPhase('error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleReelShare = (cap: string, audio: string, loc: string) => {
    pendingCaptionRef.current = cap;
    pendingAudioRef.current = audio;
    pendingLocationRef.current = loc;
    setIsSharing(true);
    setReelStep('processing');
    if (selectedVideo) {
      runReelUpload(selectedVideo, cap, audio);
    }
  };

  const handleReelDone = () => {
    haptics.success();
    fetchReels(null, true).catch(() => {});
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleReelRetry = () => {
    if (selectedVideo) {
      setIsSharing(true);
      runReelUpload(selectedVideo, pendingCaptionRef.current, pendingAudioRef.current);
    }
  };

  // ── POST mode helpers ──────────────────────────────────────────────────────
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

      const maxCount = 10 - selectedMedia.length;
      if (maxCount <= 0) {
        Alert.alert('Limit Reached', 'You can select up to 10 files for a post.');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
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
        setSelectedMedia((prev) => [...prev, ...newItems].slice(0, 10));
      }
    } catch (err) {
      console.error('Pick media error:', err);
      Alert.alert('Error', 'Failed to pick media. Please try again.');
    }
  };

  const handleRemoveMedia = (key: string) => {
    setSelectedMedia((prev) => {
      const filtered = prev.filter((m) => m.key !== key);
      if (activeIndex >= filtered.length && filtered.length > 0) {
        setActiveIndex(filtered.length - 1);
      }
      return filtered;
    });
  };

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
      const uploadedMedia: { url: string; type: 'IMAGE' | 'VIDEO'; orderIndex: number }[] = [];
      for (let i = 0; i < selectedMedia.length; i++) {
        setCurrentFileIndex(i);
        const item = selectedMedia[i];
        const signatureRes = await api.post(`/posts/upload-signature?resourceType=${item.type}`);
        const signData = signatureRes.data.data;
        const { signature, apiKey, cloudName, timestamp, folder, uploadPreset, eager, notificationUrl } = signData;

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
        uploadedMedia.push({ url: uploadRes.data.secure_url, type: item.type === 'video' ? 'VIDEO' : 'IMAGE', orderIndex: i });
      }

      await api.post('/posts', {
        caption: caption.trim() || undefined,
        location: location.trim() || undefined,
        media: uploadedMedia.map((um) => ({ mediaUrl: um.url, mediaType: um.type, orderIndex: um.orderIndex })),
      });
      fetchPosts(null, true).catch(() => {});
      setCaption(''); setLocation(''); setAudioName('Original Audio');
      setSelectedMedia([]); setActiveIndex(0);
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Media upload flow failed:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'An error occurred during upload.';
      Alert.alert('Upload Failed', errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const isFormValid = selectedMedia.length > 0;
  const isDarkTheme = isDark;
  const dividerColor = isDarkTheme ? '#2C2C2E' : '#E5E5EA';

  // ── Render REEL mode ───────────────────────────────────────────────────────
  if (activeMode === 'REEL') {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        {reelStep === 'pick' && (
          <Animated.View
            key="reel-pick"
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(220)}
            style={StyleSheet.absoluteFill}
          >
            <MediaPickStep
              onVideoSelected={(v) => {
                setSelectedVideo(v);
                setReelStep('caption');
              }}
              onSwitchToPost={() => handleSwitchMode('POST')}
              onClose={handleClose}
              insets={insets}
            />
          </Animated.View>
        )}

        {reelStep === 'caption' && selectedVideo && (
          <Animated.View
            key="reel-caption"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={StyleSheet.absoluteFill}
          >
            <CaptionStep
              video={selectedVideo}
              onBack={() => setReelStep('pick')}
              onShare={handleReelShare}
              isSharing={isSharing}
            />
          </Animated.View>
        )}

        {reelStep === 'processing' && (
          <Animated.View
            key="reel-processing"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={StyleSheet.absoluteFill}
          >
            <ProcessingStep
              phase={uploadPhase}
              uploadProgress={uploadProgress}
              onDone={handleReelDone}
              onViewReel={handleReelDone}
              onViewProfile={handleReelDone}
              onRetry={handleReelRetry}
            />
          </Animated.View>
        )}

      </View>
    );
  }

  // ── Render POST mode ───────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top safe area + header */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: dividerColor }]}>
          <Pressable onPress={handleClose} style={styles.headerButton} disabled={isUploading}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle} type="subtitle">New Post</ThemedText>
          <Pressable onPress={handleShare} disabled={!isFormValid || isUploading} style={styles.headerButton}>
            <ThemedText
              type="smallBold"
              style={{ color: isFormValid && !isUploading ? colors.primary : colors.textSecondary }}
            >
              Share
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Fixed media preview — never scrolls */}
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
            renderItem={({ item }) => <MediaPreviewItem item={item} width={SCREEN_WIDTH} />}
          />
        ) : (
          <View style={styles.placeholderWrapper}>
            <Ionicons name="images-outline" size={50} color={colors.textSecondary} />
            <ThemedText style={[styles.placeholderText, { color: colors.textSecondary }]}>No media selected</ThemedText>
          </View>
        )}
        <View style={styles.mediaButtonsRow}>
          <Pressable onPress={() => handlePickMedia(false)} style={[styles.pickerButton, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]} disabled={isUploading}>
            <Ionicons name="images" size={18} color="#FFFFFF" />
            <ThemedText style={styles.pickerButtonText}>Gallery</ThemedText>
          </Pressable>
          <Pressable onPress={() => handlePickMedia(true)} style={[styles.pickerButton, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]} disabled={isUploading}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
            <ThemedText style={styles.pickerButtonText}>Camera</ThemedText>
          </Pressable>
        </View>
        {selectedMedia.length > 1 && (
          <View style={styles.indicatorBadge}>
            <Text style={styles.indicatorText}>{activeIndex + 1} / {selectedMedia.length}</Text>
          </View>
        )}
      </View>

      {/* Fixed thumbnail strip — never scrolls */}
      {selectedMedia.length > 0 && (
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

      {/* Only the form fields scroll */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Mode switcher — safe-area aware */}
      <View style={[
        styles.modeBarOuter,
        { borderTopColor: dividerColor, backgroundColor: colors.background },
      ]}>
        <View style={styles.modeBarInner}>
          {/* Active pill indicator */}
          <View style={styles.modePillWrap}>
            <View style={[styles.modePillActive, { backgroundColor: isDarkTheme ? '#2C2C2E' : '#F0F0F0' }]}>
              <ThemedText style={[styles.modeTabText, { color: colors.text, fontFamily: Fonts.bold }]}>
                POST
              </ThemedText>
            </View>
          </View>

          <Pressable
            onPress={() => handleSwitchMode('REEL')}
            style={styles.modeTabBtn}
            hitSlop={10}
          >
            <ThemedText style={[styles.modeTabText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
              REEL
            </ThemedText>
          </Pressable>
        </View>
        {/* Bottom safe area spacer */}
        <View style={{ height: insets.bottom }} />
      </View>

      <UploadProgressOverlay
        visible={isUploading}
        overallProgress={overallProgress}
        currentFileIndex={currentFileIndex}
        totalFiles={selectedMedia.length}
        isDark={isDarkTheme}
        colors={colors}
      />
    </View>
  );
}


// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeContainer: { flex: 1 },

  // ── Header (POST) ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: { padding: 5, minWidth: 44, justifyContent: 'center' },
  headerTitle: { fontFamily: Fonts.bold, fontSize: 18 },
  scrollContent: { paddingBottom: 20 },

  // ── POST preview ──
  previewContainer: { width: SCREEN_WIDTH, height: PREVIEW_HEIGHT, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  placeholderWrapper: { alignItems: 'center', gap: 10 },
  placeholderText: { fontSize: 14, fontFamily: Fonts.regular },
  mediaButtonsRow: { position: 'absolute', bottom: 15, flexDirection: 'row', gap: 12, zIndex: 10 },
  pickerButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  pickerButtonText: { color: '#FFFFFF', fontSize: 13, fontFamily: Fonts.semiBold },
  indicatorBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8, zIndex: 10 },
  indicatorText: { color: '#FFFFFF', fontSize: 11, fontFamily: Fonts.semiBold },
  videoTypeBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: 'rgba(0, 0, 0, 0.65)', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },

  // ── POST form ──
  formContainer: { paddingHorizontal: 15, marginTop: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 15 },
  inputIcon: { marginRight: 15, marginTop: 2 },
  inputField: { flex: 1, fontSize: 15, fontFamily: Fonts.regular, padding: 0, textAlignVertical: 'top' },

  // ── Mode switcher ──
  modePickerContainer: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  modeBarOuter: { borderTopWidth: StyleSheet.hairlineWidth },
  modeBarInner: { flexDirection: 'row', height: 52, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  modeTabBtn: { flex: 1, height: 52, justifyContent: 'center', alignItems: 'center' },
  modePillWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modePillActive: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 20, backgroundColor: '#0095F6', alignItems: 'center', justifyContent: 'center' },
  modeTabText: { fontSize: 13, letterSpacing: 0.8, fontFamily: Fonts.semiBold },

  // ── Thumbnail strip ──
  thumbStrip: { height: THUMB_SIZE + 20, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)' },
  thumbStripContent: { paddingHorizontal: 15, gap: THUMB_GAP, alignItems: 'center' },
  thumbWrapper: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 8, overflow: 'visible', position: 'relative' },
  thumbPressable: { width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbVideoBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  orderBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  orderBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  thumbRemoveBtn: { position: 'absolute', top: -8, right: -8, zIndex: 10 },
  thumbAddBtn: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },

  // ── POST upload overlay ──
  uploadOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  uploadCard: { width: 290, padding: 24, borderRadius: 20, alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  uploadIconRing: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  uploadTitle: { fontFamily: Fonts.bold, fontSize: 16.5, textAlign: 'center' },
  uploadSubtitle: { fontSize: 13, fontFamily: Fonts.regular },
  progressTrack: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
  uploadPercent: { fontFamily: Fonts.bold, fontSize: 17 },

  // ── MediaPickStep ──
  pickScreen: { flex: 1, backgroundColor: '#000' },

  // top overlay bar
  pickTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  pickCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.50)',
    justifyContent: 'center', alignItems: 'center',
  },
  pickModePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 22, padding: 3,
  },
  pickModeOption: { paddingHorizontal: 16, paddingVertical: 7 },
  pickModeInactive: {
    color: 'rgba(255,255,255,0.65)', fontSize: 13,
    fontFamily: Fonts.semiBold, letterSpacing: 0.6,
  },
  pickModeActivePill: {
    backgroundColor: '#0095F6', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 7,
  },
  pickModeActiveText: {
    color: '#FFF', fontSize: 13,
    fontFamily: Fonts.bold, letterSpacing: 0.6,
  },

  // center hint
  pickCenterHint: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 48,
  },
  pickCenterIconRing: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  pickCenterTitle: {
    color: '#FFF', fontSize: 24, fontFamily: Fonts.bold,
    textAlign: 'center', marginBottom: 10,
  },
  pickCenterSub: {
    color: 'rgba(255,255,255,0.55)', fontSize: 14,
    fontFamily: Fonts.regular, textAlign: 'center', lineHeight: 22,
  },

  // duration badge
  pickDurationBadge: {
    position: 'absolute', right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.60)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  pickDurationText: { color: '#FFF', fontSize: 12, fontFamily: Fonts.semiBold },

  // bottom panel
  pickBottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 20, gap: 14,
    alignItems: 'center',
  },
  pickActionsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  pickActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  pickActionLabel: { color: '#FFF', fontSize: 15, fontFamily: Fonts.semiBold },
  pickNextBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    backgroundColor: '#0095F6', paddingVertical: 15, borderRadius: 16,
  },
  pickNextBtnText: { color: '#FFF', fontSize: 16, fontFamily: Fonts.bold },

  // kept for safety (legacy refs)
  gradientBorder: { ...StyleSheet.absoluteFill as any },
  videoPreviewContainer: { position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  durationBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  durationText: { color: '#FFF', fontSize: 12, fontFamily: Fonts.semiBold },
  pickStepContainer: { flex: 1, backgroundColor: '#000' },
  pickStepInner: { flex: 1 },
  heroArea: { width: SCREEN_WIDTH - 40, height: SCREEN_WIDTH - 40, borderRadius: 20, overflow: 'hidden', backgroundColor: '#111', marginBottom: 32, justifyContent: 'center', alignItems: 'center' },
  heroPlaceholder: { alignItems: 'center', gap: 12 },
  heroPlaceholderText: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.regular, fontSize: 16 },
  pickButtonsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  pickBtnText: { color: '#FFF', fontFamily: Fonts.semiBold, fontSize: 15 },
  nextBtnWrapper: { marginTop: 8 },
  nextBtn: { backgroundColor: '#0095F6', paddingVertical: 14, paddingHorizontal: 48, borderRadius: 28 },
  nextBtnText: { color: '#FFF', fontFamily: Fonts.bold, fontSize: 16 },
  switchToPostLink: { marginTop: 20 },
  switchToPostText: { color: 'rgba(255,255,255,0.6)', fontFamily: Fonts.regular, fontSize: 14 },

  // ── CaptionStep ──
  captionStep: { flex: 1 },
  captionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  shareButtonText: { fontSize: 16, fontFamily: Fonts.semiBold },
  captionScrollContent: { paddingBottom: 60 },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  captionAvatar: { width: 40, height: 40, borderRadius: 20, flexShrink: 0 },
  captionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  captionInputField: { flex: 1, fontSize: 15, fontFamily: Fonts.regular, padding: 0 },
  trendingSection: { paddingTop: 12, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  trendingLabel: { paddingHorizontal: 15, fontSize: 12, fontFamily: Fonts.medium, marginBottom: 10 },
  trendingPillsRow: { paddingHorizontal: 15, gap: 8 },
  soundPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  soundPillText: { fontSize: 13, fontFamily: Fonts.medium },
  uiOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  uiOnlyRowText: { fontSize: 15, fontFamily: Fonts.regular },

  // ── ProcessingStep ──
  processingStep: { flex: 1 },
  processingContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 28, paddingHorizontal: 24 },
  ringWrapper: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  ringCenter: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  processingStatusText: { fontSize: 20, fontFamily: Fonts.bold, textAlign: 'center' },
  processingProgressText: { fontSize: 32, fontFamily: Fonts.bold, textAlign: 'center', marginTop: 4 },
  processingActions: { flexDirection: 'column', gap: 12, width: '100%' },
  actionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: { color: '#FFF', fontFamily: Fonts.bold, fontSize: 16 },
});
