import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Pressable,
  Dimensions,
  Modal,
  ActivityIndicator,
  Platform,
  TextInput,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useStories } from '@/contexts/StoriesContext';
import { haptics } from '@/utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { UserStoryGroup } from '@/contexts/StoriesContext';
import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dynamic check for expo-video
let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (e) {
  // Silent fallback
}

const getRelativeTime = (isoString: string) => {
  if (!isoString) return '';
  try {
    const past = new Date(isoString).getTime();
    const now = Date.now();
    const diffSecs = Math.floor((now - past) / 1000);
    if (diffSecs < 60) return 'now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  } catch (e) {
    return '';
  }
};

interface StoryPlayerModalProps {
  visible: boolean;
  userGroups: UserStoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onStoryViewed: (storyId: string) => void;
}

const StoryVideoItem: React.FC<{
  mediaUrl: string;
  isActive: boolean;
  isPaused: boolean;
  onProgress: (progress: number) => void;
  onEnd: () => void;
}> = ({ mediaUrl, isActive, isPaused, onProgress, onEnd }) => {
  const [player, setPlayer] = useState<any>(null);
  const [playerStatus, setPlayerStatus] = useState<string>('loading');

  useEffect(() => {
    if (!ExpoVideo || !mediaUrl) return;

    let p: any = null;
    try {
      p = ExpoVideo.createVideoPlayer(mediaUrl);
      p.loop = false;
      p.muted = false;
      p.showNowPlayingNotification = false;
      p.timeUpdateEventInterval = 0.05; // 50ms updates for smooth progress bar
      if (isActive && !isPaused) {
        p.play();
      } else {
        p.pause();
      }
      setPlayer(p);
      setPlayerStatus(p.status);
    } catch (err) {
      console.error('Error creating video player in StoryPlayerModal:', err);
    }

    return () => {
      if (p) {
        try {
          p.pause();
        } catch (e) {}
        setTimeout(() => {
          try {
            p.release();
          } catch (e) {}
        }, 3000);
      }
    };
  }, [mediaUrl]);

  useEffect(() => {
    if (player) {
      if (isActive && !isPaused) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, isPaused, player]);

  // Track statusChange listener
  useEffect(() => {
    if (!player) return;
    const subscription = player.addListener('statusChange', ({ status }: any) => {
      setPlayerStatus(status);
    });
    return () => {
      subscription.remove();
    };
  }, [player]);

  // Track progress using timeUpdate listener
  useEffect(() => {
    if (!player) return;
    const subscription = player.addListener('timeUpdate', (payload: any) => {
      if (player.duration && onProgress) {
        onProgress(payload.currentTime / player.duration);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [player, onProgress]);

  // Track video completion
  useEffect(() => {
    if (!player) return;
    const subscription = player.addListener('playToEnd', () => {
      if (onEnd) {
        onEnd();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [player, onEnd]);

  if (!ExpoVideo) {
    return (
      <View style={styles.videoPlaceholder}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <ExpoVideo.VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      {playerStatus !== 'readyToPlay' && (
        <View style={[StyleSheet.absoluteFill, styles.videoLoadingOverlay]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

export const StoryPlayerModal: React.FC<StoryPlayerModalProps> = ({
  visible,
  userGroups,
  initialGroupIndex,
  onClose,
  onStoryViewed,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { deleteStory } = useStories();
  const { user: currentUser } = useAuth();

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  const [viewersList, setViewersList] = useState<{ id: string; username: string; avatarUrl: string | null; viewedAt: string }[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const [viewersLoading, setViewersLoading] = useState(false);
  const viewersSheetY = useSharedValue(SCREEN_HEIGHT);

  const [replyText, setReplyText] = useState('');

  const [stickers, setStickers] = useState<{ id: string; text: string; x: number; y: number }[]>([]);
  const [showStickerInput, setShowStickerInput] = useState(false);
  const [stickerInputText, setStickerInputText] = useState('');

  const translateY = useSharedValue(0);
  const dragStartY = useSharedValue(0);

  // Animated style for viewers bottom sheet
  const viewersSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: viewersSheetY.value }],
  }));

  // Fetch viewers
  const fetchViewers = async (storyId: string) => {
    setViewersLoading(true);
    try {
      const res = await api.get(`/stories/${storyId}/viewers`);
      setViewersList(res.data?.data || []);
    } catch (_) {
    } finally {
      setViewersLoading(false);
    }
  };

  // Send reply → go to DM
  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || !activeGroup || !activeStory) return;
    setReplyText('');
    setIsPaused(false);
    try {
      const convRes = await api.post('/chat/conversations', { userId: activeGroup.userId });
      const conversationId = convRes.data?.data?.id || convRes.data?.id;
      if (conversationId) {
        await api.post(`/chat/conversations/${conversationId}/messages`, {
          text,
          storyId: activeStory.id,
        });
        router.push({ pathname: '/(chat)/[id]', params: { id: conversationId } } as any);
        onClose();
      }
    } catch (err) {
      console.error('[StoryPlayer] Reply failed:', err);
    }
  };

  // Sync index when group changes or open
  useEffect(() => {
    if (visible && initialGroupIndex >= 0 && initialGroupIndex < userGroups.length) {
      setGroupIndex(initialGroupIndex);
      // Find the first unread story in the chosen group
      const group = userGroups[initialGroupIndex];
      const firstUnseenIdx = group.stories.findIndex((s) => !s.isSeen);
      setStoryIndex(firstUnseenIdx >= 0 ? firstUnseenIdx : 0);
    }
  }, [visible, initialGroupIndex]);

  const activeGroup = useMemo(() => {
    if (groupIndex >= 0 && groupIndex < userGroups.length) {
      return userGroups[groupIndex];
    }
    return null;
  }, [groupIndex, userGroups]);

  const activeStory = useMemo(() => {
    if (activeGroup && storyIndex >= 0 && storyIndex < activeGroup.stories.length) {
      return activeGroup.stories[storyIndex];
    }
    return null;
  }, [activeGroup, storyIndex]);

  // Derived: is this story owned by the current user?
  const isOwnStory = activeGroup?.userId === currentUser?.id;

  // Reanimated progress bar control
  const progress = useSharedValue(0);

  const handleNextStory = () => {
    if (!activeGroup) return;

    if (storyIndex < activeGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else {
      // Transition to the next user group if available
      if (groupIndex < userGroups.length - 1) {
        setGroupIndex((prev) => prev + 1);
        setStoryIndex(0);
      } else {
        onClose();
      }
    }
  };

  const handlePrevStory = () => {
    if (!activeGroup) return;

    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else {
      // Transition to the previous user group if available
      if (groupIndex > 0) {
        const prevGroup = userGroups[groupIndex - 1];
        setGroupIndex((prev) => prev - 1);
        setStoryIndex(prevGroup.stories.length - 1);
      } else {
        // Reset progress if at the absolute start
        setResetCounter((prev) => prev + 1);
      }
    }
  };

  const lastStoryIdRef = useRef<string | null>(null);

  // Unified effect for story progress timer and logger
  useEffect(() => {
    if (!visible || !activeStory) {
      progress.value = 0;
      cancelAnimation(progress);
      lastStoryIdRef.current = null;
      setIsPaused(false);
      return;
    }

    let isNewStory = false;
    if (lastStoryIdRef.current !== activeStory.id) {
      onStoryViewed(activeStory.id);
      lastStoryIdRef.current = activeStory.id;
      progress.value = 0;
      isNewStory = true;
      setIsPaused(false);
    }

    if (activeStory.mediaType === 'IMAGE') {
      if (isPaused) {
        cancelAnimation(progress);
      } else {
        const startProgress = isNewStory ? 0 : (progress.value >= 1 ? 0 : progress.value);
        progress.value = startProgress;

        const remainingPercent = 1 - startProgress;
        const remainingDuration = remainingPercent * 5000;

        progress.value = withTiming(
          1,
          { duration: remainingDuration, easing: Easing.linear },
          (finished) => {
            if (finished) {
              runOnJS(handleNextStory)();
            }
          }
        );
      }
    } else {
      cancelAnimation(progress);
    }

    return () => {
      cancelAnimation(progress);
    };
  }, [groupIndex, storyIndex, visible, activeStory, isPaused]);

  // Touch and Hold Gesture variables
  const pressStartTime = useRef<number>(0);
  const isHolding = useRef<boolean>(false);

  const handlePressIn = () => {
    pressStartTime.current = Date.now();
    isHolding.current = true;
    setIsPaused(true);
  };

  const handlePressOut = () => {
    isHolding.current = false;
    const duration = Date.now() - pressStartTime.current;
    if (duration >= 300) {
      // Resume playback after releasing long-press
      setIsPaused(false);
    }
  };

  const handlePress = (evt: any) => {
    const duration = Date.now() - pressStartTime.current;
    if (duration < 300) {
      // Treat as a tap: left 1/3 goes back, right 2/3 goes forward
      const x = evt.nativeEvent.locationX;
      const thirdWidth = SCREEN_WIDTH / 3;
      if (x < thirdWidth) {
        handlePrevStory();
      } else {
        handleNextStory();
      }
    }
  };

  // Swipe gesture handling for dismissal
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateY.value = Math.max(0, dragStartY.value + e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 500) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(translateY.value, [0, 250], [1, 0], Extrapolation.CLAMP),
  }));

  const activeProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!visible || !activeGroup || !activeStory) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop background */}
        <View style={StyleSheet.absoluteFill} />

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.playerSheet, animatedSheetStyle]}>
            {/* Pressable media surface */}
            <Pressable
              style={styles.mediaContainer}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handlePress}
            >
              {activeStory.mediaType === 'VIDEO' ? (
                <StoryVideoItem
                  key={`${activeStory.id}-${resetCounter}`}
                  mediaUrl={activeStory.mediaUrl}
                  isActive={visible}
                  isPaused={isPaused}
                  onProgress={(p) => {
                    progress.value = p;
                  }}
                  onEnd={handleNextStory}
                />
              ) : (
                <Image
                  key={`${activeStory.id}-${resetCounter}`}
                  source={{ uri: activeStory.mediaUrl }}
                  style={styles.storyImage}
                  resizeMode="contain"
                />
              )}
            </Pressable>

            {/* Header Overlay details */}
            <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
              {/* Segmented Progress bar indicators */}
              <View style={styles.progressBarRow}>
                {activeGroup.stories.map((story, idx) => {
                  return (
                    <View key={story.id} style={styles.progressBarTrack}>
                      {idx < storyIndex ? (
                        <View style={styles.progressBarComplete} />
                      ) : idx === storyIndex ? (
                        <Animated.View style={[styles.progressBarFill, activeProgressStyle]} />
                      ) : (
                        <View style={styles.progressBarEmpty} />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* User row */}
              <View style={styles.userRow}>
                <Image source={{ uri: activeGroup.avatar }} style={styles.userAvatar} />
                <ThemedText style={styles.username}>{activeGroup.username}</ThemedText>
                <ThemedText style={styles.timestamp}>
                  {` • ${getRelativeTime(activeStory.createdAt)}`}
                </ThemedText>
                {isOwnStory && (
                  <>
                    <Pressable
                      onPress={() => { haptics.light(); setIsPaused(true); setShowStickerInput(true); }}
                      style={styles.headerActionBtn}
                      hitSlop={10}
                    >
                      <Ionicons name="text-outline" size={20} color="rgba(255,255,255,0.85)" />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        haptics.light();
                        Alert.alert('Delete Story', 'Remove this story permanently?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              if (!activeStory) return;
                              const ok = await deleteStory(activeStory.id);
                              if (ok) handleNextStory();
                            },
                          },
                        ]);
                      }}
                      style={styles.headerActionBtn}
                      hitSlop={10}
                    >
                      <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.85)" />
                    </Pressable>
                  </>
                )}
                <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
                  <Ionicons name="close" size={26} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {/* ── Text sticker overlays ── */}
            {stickers.map(sticker => (
              <View key={sticker.id} style={[styles.stickerOverlay, { left: sticker.x, top: sticker.y }]}>
                <Text style={styles.stickerText}>{sticker.text}</Text>
              </View>
            ))}

            {/* ── Sticker input ── */}
            {showStickerInput && (
              <View style={styles.stickerInputContainer}>
                <TextInput
                  autoFocus
                  placeholder="Add text..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={stickerInputText}
                  onChangeText={setStickerInputText}
                  style={styles.stickerTextInput}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (stickerInputText.trim()) {
                      setStickers(prev => [...prev, {
                        id: Date.now().toString(),
                        text: stickerInputText.trim(),
                        x: SCREEN_WIDTH / 2 - 60,
                        y: SCREEN_HEIGHT * 0.35,
                      }]);
                    }
                    setStickerInputText('');
                    setShowStickerInput(false);
                    setIsPaused(false);
                  }}
                />
              </View>
            )}

            {/* ── Viewers bar (own stories only) ── */}
            {isOwnStory && !showStickerInput && (
              <Pressable
                style={[styles.viewersBar, { bottom: Math.max(insets.bottom + 16, 32) }]}
                onPress={() => {
                  haptics.light();
                  fetchViewers(activeStory!.id);
                  setShowViewers(true);
                  viewersSheetY.value = withSpring(0, { damping: 22, stiffness: 200 });
                }}
              >
                <Ionicons name="eye-outline" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.viewersCountText}>
                  {viewersList.length} {viewersList.length === 1 ? 'viewer' : 'viewers'}
                </Text>
                <Ionicons name="chevron-up" size={13} color="rgba(255,255,255,0.65)" />
              </Pressable>
            )}

            {/* ── Reply bar (other people's stories only) ── */}
            {!isOwnStory && !showStickerInput && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={[styles.replyBarWrapper, { bottom: Math.max(insets.bottom + 12, 24) }]}
              >
                <View style={styles.replyBar}>
                  <TextInput
                    placeholder={`Reply to ${activeGroup?.username ?? ''}…`}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={replyText}
                    onChangeText={setReplyText}
                    style={styles.replyInput}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => { if (!replyText.trim()) setIsPaused(false); }}
                    returnKeyType="send"
                    onSubmitEditing={handleSendReply}
                  />
                  {replyText.trim() ? (
                    <Pressable onPress={handleSendReply} style={styles.replySendBtn}>
                      <Ionicons name="send" size={17} color="#FFF" />
                    </Pressable>
                  ) : (
                    <Pressable hitSlop={8} onPress={() => {}}>
                      <Ionicons name="heart-outline" size={22} color="rgba(255,255,255,0.85)" />
                    </Pressable>
                  )}
                </View>
              </KeyboardAvoidingView>
            )}

            {/* ── Viewers bottom sheet ── */}
            {showViewers && (
              <Animated.View style={[styles.viewersSheet, viewersSheetStyle]}>
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => {
                    viewersSheetY.value = withTiming(SCREEN_HEIGHT, { duration: 220 });
                    setTimeout(() => setShowViewers(false), 230);
                  }}
                />
                <View style={[styles.viewersContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                  <View style={styles.viewersHandle} />
                  <Text style={[styles.viewersTitle, { color: isDark ? '#FFF' : '#000' }]}>
                    {viewersList.length} {viewersList.length === 1 ? 'Viewer' : 'Viewers'}
                  </Text>
                  {viewersLoading ? (
                    <ActivityIndicator size="small" color="#0095F6" style={{ marginVertical: 20 }} />
                  ) : viewersList.length === 0 ? (
                    <Text style={{ color: isDark ? '#8E8E8F' : '#737373', textAlign: 'center', paddingVertical: 20, fontFamily: Fonts.regular, fontSize: 14 }}>
                      No views yet
                    </Text>
                  ) : (
                    <FlatList
                      data={viewersList}
                      keyExtractor={item => item.id}
                      style={{ maxHeight: 300 }}
                      renderItem={({ item }) => (
                        <View style={styles.viewerRow}>
                          <Image
                            source={{ uri: item.avatarUrl || 'https://ui-avatars.com/api/?name=U&size=80' }}
                            style={styles.viewerAvatar}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.viewerUsername, { color: isDark ? '#FFF' : '#000' }]}>
                              {item.username}
                            </Text>
                            <Text style={[styles.viewerTime, { color: isDark ? '#8E8E8F' : '#737373' }]}>
                              {getRelativeTime(item.viewedAt)} ago
                            </Text>
                          </View>
                        </View>
                      )}
                    />
                  )}
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
  playerSheet: {
    flex: 1,
  },
  mediaContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  videoLoadingOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    left: 0,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 100,
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 4,
    height: 3,
    marginBottom: 12,
    width: '100%',
  },
  progressBarTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 1.5,
    flex: 1,
    height: 3,
    overflow: 'hidden',
  },
  progressBarComplete: {
    backgroundColor: '#FFFFFF',
    height: '100%',
    width: '100%',
  },
  progressBarFill: {
    backgroundColor: '#FFFFFF',
    height: '100%',
  },
  progressBarEmpty: {
    backgroundColor: 'transparent',
    height: '100%',
    width: '0%',
  },
  userRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  userAvatar: {
    borderColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    height: 36,
    width: 36,
  },
  username: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 14,
    marginLeft: 10,
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: Fonts.regular,
    fontSize: 13,
    marginLeft: 5,
  },
  closeButton: {
    marginLeft: 'auto',
    padding: 4,
  },

  // Header action buttons (delete, sticker)
  headerActionBtn: {
    padding: 4,
    marginLeft: 8,
  },

  // Sticker overlays
  stickerOverlay: {
    position: 'absolute',
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stickerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.bold,
  },

  // Sticker input
  stickerInputContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    zIndex: 150,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 16,
    padding: 14,
  },
  stickerTextInput: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    paddingVertical: 6,
  },

  // Viewers bar (bottom of screen for own stories)
  viewersBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 100,
  },
  viewersCountText: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    flex: 1,
  },

  // Viewers bottom sheet
  viewersSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    zIndex: 200,
    justifyContent: 'flex-end',
  },
  viewersContent: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 36,
  },
  viewersHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.35)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  viewersTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginBottom: 14,
    textAlign: 'center',
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  viewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  viewerUsername: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  viewerTime: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    marginTop: 1,
  },

  // Reply bar (bottom of screen for other people's stories)
  replyBarWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 100,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.regular,
    paddingVertical: 4,
  },
  replySendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
