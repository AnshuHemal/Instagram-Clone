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
} from 'react-native';
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

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  const translateY = useSharedValue(0);
  const dragStartY = useSharedValue(0);

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

  // Animate progress bar filling and trigger viewing logger on load
  useEffect(() => {
    if (visible && activeStory) {
      setIsPaused(false);
      
      if (activeStory.mediaType === 'VIDEO') {
        progress.value = 0;
      } else {
        // Image progress animation (5 seconds)
        progress.value = 0;
        progress.value = withTiming(
          1,
          { duration: 5000, easing: Easing.linear },
          (finished) => {
            if (finished) {
              runOnJS(handleNextStory)();
            }
          }
        );
      }
      onStoryViewed(activeStory.id);
    } else {
      progress.value = 0;
      cancelAnimation(progress);
    }
  }, [groupIndex, storyIndex, visible, activeStory, resetCounter]);

  // Handle Pause/Resume for image stories
  useEffect(() => {
    if (!visible || !activeStory) return;

    if (activeStory.mediaType === 'IMAGE') {
      if (isPaused) {
        cancelAnimation(progress);
      } else {
        // Resume image progress timing from current progress
        const remainingPercent = 1 - progress.value;
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
    }
  }, [isPaused, visible, activeStory]);

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
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
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
                <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
                  <Ionicons name="close" size={26} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
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
});
