import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Image, Pressable, Dimensions, Animated, Easing, Platform, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { ReelShimmer } from './ReelShimmer';
import { CommentsSheet } from './CommentsSheet';
import { ShareSheetModal } from './ShareSheetModal';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { FollowButton } from './FollowButton';

export interface Reel {
  id: string;
  userId?: string;
  username: string;
  avatar: string;
  imageUrl: string;
  description: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  musicName: string;
  views: string;
  hlsUrl?: string;
  durationSeconds?: number;
  isFollowing?: boolean;
  isRequested?: boolean;
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
    isPrivate: boolean;
  };
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');

// 1. Dynamic check for expo-video (SDK 51+ standard)
let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (e) {
  // Silent fallback
}

// Declarative video component using new expo-video standard
const VideoPlayerExpoVideo = ({ hlsUrl, isPlaying, isActive, isScreenFocused, isMuted, posterUrl, onProgress, onPlayerReady, onStatusChange }: any) => {
  const cleanUrl = hlsUrl?.replace('.mp4.m3u8', '.m3u8');
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    if (!ExpoVideo || !cleanUrl) return;

    let p: any = null;
    try {
      p = ExpoVideo.createVideoPlayer(cleanUrl);
      p.loop = true;
      p.muted = isMuted;
      p.showNowPlayingNotification = false;
      p.timeUpdateEventInterval = 0.05; // 50ms updates for smooth seekbar line
      if (isPlaying) {
        p.play();
      } else {
        p.pause();
      }
      setPlayer(p);
    } catch (e: any) {
      console.error('Error creating standard player in ReelItem:', e.message);
    }

    return () => {
      if (p) {
        try {
          p.pause();
        } catch (e) {}

        // Release with delay so VideoView has time to unmount cleanly
        setTimeout(() => {
          try {
            p.release();
          } catch (e) {}
        }, 5000);
      }
    };
  }, [cleanUrl]);

  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

  // Handle play/pause
  useEffect(() => {
    if (player) {
      if (isPlaying) {
        player.play();
      } else {
        player.pause();
      }
    }
    return () => {
      if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
    };
  }, [isPlaying, player]);

  // Seek back to start ONLY when first focusing or changing active items
  useEffect(() => {
    if (player && isActive && isScreenFocused) {
      player.currentTime = 0;
    }
  }, [isActive, isScreenFocused, player]);

  // Expose player instance to the parent ReelItem for manual seeking control
  useEffect(() => {
    if (onPlayerReady && player) {
      onPlayerReady(player);
    }
  }, [player, onPlayerReady]);

  // Track player loading status
  useEffect(() => {
    if (!player) return;

    if (onStatusChange) {
      onStatusChange(player.status);
    }

    const subscription = player.addListener('statusChange', ({ status }: any) => {
      if (onStatusChange) {
        onStatusChange(status);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, onStatusChange, isActive]);

  // Track progress using manual addListener inside useEffect
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

  return (
    <ExpoVideo.VideoView
      key={`expo-video-view-${cleanUrl}`}
      style={StyleSheet.absoluteFill}
      player={player}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

// Declarative video component using new expo-video standard for preloaded player
const VideoPlayerExpoVideoPreloaded = ({ player, reelId, isPlaying, isActive, isScreenFocused, isMuted, onProgress, onStatusChange }: any) => {
  useEffect(() => {
    if (player) {
      player.muted = isMuted;
      player.showNowPlayingNotification = false;
      player.timeUpdateEventInterval = 0.05; // 50ms updates for smooth seekbar line
    }
  }, [isMuted, player]);

  // Handle play/pause
  useEffect(() => {
    if (player) {
      if (isPlaying) {
        player.play();
      } else {
        player.pause();
      }
    }
    return () => {
      if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
    };
  }, [isPlaying, player]);

  // Seek back to start ONLY when first focusing or changing active items
  useEffect(() => {
    if (player && isActive && isScreenFocused) {
      player.currentTime = 0;
    }
  }, [isActive, isScreenFocused, player]);

  // Track player loading status
  useEffect(() => {
    if (!player) return;

    if (onStatusChange) {
      onStatusChange(player.status);
    }

    const subscription = player.addListener('statusChange', ({ status }: any) => {
      if (onStatusChange) {
        onStatusChange(status);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, onStatusChange, isActive]);

  // Track progress using manual addListener inside useEffect
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

  return (
    <ExpoVideo.VideoView
      key={`expo-video-view-preloaded-${reelId}`}
      style={StyleSheet.absoluteFill}
      player={player}
      contentFit="cover"
      nativeControls={false}
    />
  );
};


interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  isScreenFocused?: boolean;
  onLikeToggle: (id: string) => void;
  height: number;
  preloadedPlayer?: any;
  bottomOffset?: number;
}

export const ReelItem = React.memo(({
  reel,
  isActive,
  isScreenFocused = true,
  onLikeToggle,
  height,
  preloadedPlayer,
  bottomOffset,
}: ReelItemProps) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const finalBottomOffset = bottomOffset !== undefined ? bottomOffset : insets.bottom;

  const isPlayerReady = (player: any) => {
    if (!player) return false;
    try {
      return player.status === 'readyToPlay';
    } catch (e) {
      return false;
    }
  };
  
  const [isFollowed, setIsFollowed] = useState(false);
  const [localLiked, setLocalLiked] = useState(reel.isLiked);
  const [localLikesCount, setLocalLikesCount] = useState(reel.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(reel.commentsCount);
  const [lastTap, setLastTap] = useState(0);
  const singleTapTimeoutRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPausedByHold, setIsPausedByHold] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playerStatus, setPlayerStatus] = useState<string>(() => {
    const isReadyNow = isPlayerReady(preloadedPlayer);
    return isReadyNow ? 'readyToPlay' : 'loading';
  });
  const [showShimmer, setShowShimmer] = useState(true);
  const shimmerOpacity = useRef(new Animated.Value(1)).current;

  // Synchronously adjust state during render if active state or preloaded player changes to prevent visual flash
  const [prevIsActive, setPrevIsActive] = useState(isActive);
  const [prevPreloadedPlayer, setPrevPreloadedPlayer] = useState(preloadedPlayer);

  if (isActive !== prevIsActive || preloadedPlayer !== prevPreloadedPlayer) {
    setPrevIsActive(isActive);
    setPrevPreloadedPlayer(preloadedPlayer);
    setIsPaused(false);
    
    const isReadyNow = isPlayerReady(preloadedPlayer);
    if (isActive) {
      setPlayerStatus(isReadyNow ? 'readyToPlay' : 'loading');
      setShowShimmer(true);
      shimmerOpacity.setValue(1);
    } else {
      setShowShimmer(true);
      shimmerOpacity.setValue(1);
      setPlayerStatus(isReadyNow ? 'readyToPlay' : 'loading');
    }
  }

  // React to video status changes and perform transition fade-out
  useEffect(() => {
    if (!isActive) {
      setShowShimmer(true);
      shimmerOpacity.setValue(1);
      const isReadyNow = isPlayerReady(preloadedPlayer);
      setPlayerStatus(isReadyNow ? 'readyToPlay' : 'loading');
      return;
    }

    if (playerStatus === 'readyToPlay') {
      // Smooth fade-out of loading shimmer skeleton
      Animated.timing(shimmerOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setShowShimmer(false);
      });
    } else if (playerStatus === 'loading' || playerStatus === 'idle') {
      setShowShimmer(true);
      shimmerOpacity.setValue(1);
    }
  }, [playerStatus, isActive, preloadedPlayer]);

  // Refs for hold-to-pause timeout
  const holdTimeout = useRef<any>(null);

  
  // Precision View Tracking Refs
  const viewFired = useRef(false);
  const completedFired = useRef(false);
  const accumulatedTime = useRef(0);
  const lastStartPlay = useRef(0);
  const viewTimeout = useRef<any>(null);

  // Reset view tracking refs when active state changes
  useEffect(() => {
    if (isActive) {
      viewFired.current = false;
      completedFired.current = false;
      accumulatedTime.current = 0;
      lastStartPlay.current = 0;
      if (viewTimeout.current) {
        clearTimeout(viewTimeout.current);
        viewTimeout.current = null;
      }
    }
  }, [isActive]);

  // Animations
  const rotateValue = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const pausedControlsOpacity = useRef(new Animated.Value(0)).current;

  // Interactive Seekbar & Player state refs
  const activePlayerRef = useRef<any>(null);
  const isScrubbingRef = useRef<boolean>(false);

  // Seekbar micro-animations (scale track height and show dot on grab)
  const seekbarScaleY = useRef(new Animated.Value(1)).current;
  const handleScale = useRef(new Animated.Value(0)).current;

  const isPlaying = isActive && isScreenFocused && !isPausedByHold && !isPaused;



  useEffect(() => {
    if (isPaused) {
      Animated.timing(pausedControlsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      pausedControlsOpacity.setValue(0);
    }
  }, [isPaused]);

  // Progress update handler that ignores updates while the user is actively dragging/scrubbing
  const handleProgressUpdate = (ratio: number) => {
    if (!isScrubbingRef.current) {
      setProgress(ratio);
    }
  };

  // Perform seek command on active video player
  const handleSeek = (ratio: number) => {
    const boundedRatio = Math.max(0, Math.min(1, ratio));
    setProgress(boundedRatio);

    if (ExpoVideo) {
      const playerInstance = preloadedPlayer || activePlayerRef.current;
      if (playerInstance && playerInstance.duration) {
        playerInstance.currentTime = boundedRatio * playerInstance.duration;
      }
    }
  };

  // Touch handlers for interactive scrubbing
  const handleSeekTouch = (event: any) => {
    isScrubbingRef.current = true;
    
    // Smoothly scale up the visible seekbar line and pop in the scrub dot
    Animated.parallel([
      Animated.timing(seekbarScaleY, {
        toValue: 2.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(handleScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();

    const touchX = event.nativeEvent.pageX;
    const ratio = touchX / WINDOW_WIDTH;
    handleSeek(ratio);
  };

  const handleSeekRelease = () => {
    isScrubbingRef.current = false;
    
    // Smoothly scale down the seekbar line and scale out the scrub handle
    Animated.parallel([
      Animated.timing(seekbarScaleY, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(handleScale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Sync prop changes (e.g. from parent refreshing) to local state
  useEffect(() => {
    setLocalLiked(reel.isLiked);
    setLocalLikesCount(reel.likesCount);
    setLocalCommentsCount(reel.commentsCount);
  }, [reel.isLiked, reel.likesCount, reel.commentsCount]);

  // Music Disc Spinning Animation
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      rotateValue.setValue(0);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isPlaying]);

  // Precision View Tracking Trigger
  useEffect(() => {
    const handleThreeSecondView = async () => {
      if (!viewFired.current) {
        viewFired.current = true;
        // Fire immediate 3s watch event
        await recordViewAPI(3000, false);
      }
    };

    if (isPlaying) {
      lastStartPlay.current = Date.now();
      
      // Schedule the 3-second watch trigger
      if (!viewFired.current) {
        const remainingTime = Math.max(0, 3000 - accumulatedTime.current);
        viewTimeout.current = setTimeout(() => {
          handleThreeSecondView();
        }, remainingTime);
      }
    } else {
      // Clear 3-second timeout
      if (viewTimeout.current) {
        clearTimeout(viewTimeout.current);
        viewTimeout.current = null;
      }

      if (lastStartPlay.current > 0) {
        const sessionDuration = Date.now() - lastStartPlay.current;
        accumulatedTime.current += sessionDuration;
        lastStartPlay.current = 0;

        // Perform scroll-away flush if they watched for at least 3s total but it didn't fire yet
        if (accumulatedTime.current >= 3000 && !viewFired.current) {
          viewFired.current = true;
          recordViewAPI(accumulatedTime.current, false);
        }

        // Check completion state (80% watched)
        const playerInstance = preloadedPlayer || activePlayerRef.current;
        const durationSeconds = playerInstance?.duration || reel.durationSeconds || 30;
        const durationMs = durationSeconds * 1000;

        if (accumulatedTime.current >= durationMs * 0.8 && !completedFired.current) {
          completedFired.current = true;
          recordViewAPI(accumulatedTime.current, true);
        }
      }
    }

    return () => {
      if (viewTimeout.current) {
        clearTimeout(viewTimeout.current);
        viewTimeout.current = null;
      }
      if (lastStartPlay.current > 0) {
        const sessionDuration = Date.now() - lastStartPlay.current;
        const totalTime = accumulatedTime.current + sessionDuration;

        // Flush 3-second view if not fired
        if (totalTime >= 3000 && !viewFired.current) {
          viewFired.current = true;
          recordViewAPI(totalTime, false);
        }

        // Flush completion if not fired
        const playerInstance = preloadedPlayer || activePlayerRef.current;
        const durationSeconds = playerInstance?.duration || reel.durationSeconds || 30;
        const durationMs = durationSeconds * 1000;

        if (totalTime >= durationMs * 0.8 && !completedFired.current) {
          completedFired.current = true;
          recordViewAPI(totalTime, true);
        }
        
        lastStartPlay.current = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const recordViewAPI = async (watchTimeMs: number, completed: boolean) => {
    try {
      await api.post(`/reels/${reel.id}/view`, {
        watchDurationMs: Math.round(watchTimeMs),
        completed,
        quality: '720p',
      });
    } catch {
      // Fail silently for view tracking
    }
  };

  const triggerLikeAnim = () => {
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeScale, {
        toValue: 1.0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerDoubleTapHeart = () => {
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1.2,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };



  // Cleanup hold timeout and tap timeouts on unmount
  useEffect(() => {
    return () => {
      if (holdTimeout.current) clearTimeout(holdTimeout.current);
      if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
    };
  }, []);

  const handlePressIn = () => {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    // Trigger hold-to-pause after 200ms of continuous press
    holdTimeout.current = setTimeout(() => {
      setIsPausedByHold(true);
    }, 200);
  };

  const handlePressOut = () => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }

    if (isPausedByHold) {
      // Was holding down, release to resume
      setIsPausedByHold(false);
    } else {
      // Short press, execute regular single/double tap logic
      handleReelPress();
    }
  };

  const handleReelPress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 280; // Delay window to register double taps cleanly

    if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY) {
      // Clear the single-tap toggle timeout to prevent a double-tap from pausing/resuming
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }

      if (!localLiked) {
        handleLike();
      }
      triggerDoubleTapHeart();
      setLastTap(0); // Reset tap reference
    } else {
      setLastTap(now);
      
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }

      singleTapTimeoutRef.current = setTimeout(() => {
        setIsPaused(prev => !prev);
        singleTapTimeoutRef.current = null;
      }, DOUBLE_PRESS_DELAY);
    }
  };

  const handleLike = async () => {
    const previousLiked = localLiked;
    const previousCount = localLikesCount;

    // Optimistic Update
    const newLiked = !previousLiked;
    setLocalLiked(newLiked);
    setLocalLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    onLikeToggle(reel.id);
    triggerLikeAnim();

    try {
      const res = await api.post(`/reels/${reel.id}/like`);
      const { liked, likesCount } = res.data.data;
      
      setLocalLiked(liked);
      setLocalLikesCount(likesCount);
    } catch (err) {
      // Rollback on fail
      setLocalLiked(previousLiked);
      setLocalLikesCount(previousCount);
      onLikeToggle(reel.id);
    }
  };

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderVideoPlayer = () => {
    if (!reel.hlsUrl) return null;

    if (ExpoVideo && isActive) {
      const currentPlayer = preloadedPlayer;
      if (currentPlayer) {
        return (
          <VideoPlayerExpoVideoPreloaded
            key={`preloaded-${reel.id}`}
            player={currentPlayer}
            reelId={reel.id}
            isPlaying={isPlaying}
            isActive={isActive}
            isScreenFocused={isScreenFocused}
            isMuted={isMuted}
            onProgress={handleProgressUpdate}
            onStatusChange={setPlayerStatus}
          />
        );
      }
      return (
        <VideoPlayerExpoVideo
          key={`standard-${reel.id}`}
          hlsUrl={reel.hlsUrl}
          isPlaying={isPlaying}
          isActive={isActive}
          isScreenFocused={isScreenFocused}
          isMuted={isMuted}
          posterUrl={reel.imageUrl}
          onProgress={handleProgressUpdate}
          onPlayerReady={(player: any) => {
            activePlayerRef.current = player;
          }}
          onStatusChange={setPlayerStatus}
        />
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Background Media with Tap handler */}
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={StyleSheet.absoluteFill}>
        {isActive && renderVideoPlayer()}
        <View style={styles.dimOverlay} />

        {/* Stable Poster Image Overlay (Prevents unmounting and JNI blinking on load) */}
        {showShimmer && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: isActive ? shimmerOpacity : 1,
                zIndex: 1,
                backgroundColor: '#000000',
              }
            ]}
            pointerEvents="none"
          >
            <ExpoImage
              source={{ uri: reel.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              transition={150}
            />
            {isActive && playerStatus === 'loading' && (
              <View style={styles.posterLoaderContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
          </Animated.View>
        )}
        
        {/* Animated Pop-up Center Heart */}
        <Animated.View
          style={[
            styles.doubleTapHeart,
            {
              transform: [{ scale: heartScale }],
              opacity: heartOpacity,
              zIndex: 10,
            },
          ]}
        >
          <Ionicons name="heart" size={100} color="#FFFFFF" />
        </Animated.View>

      </Pressable>

      {/* Paused Controls Row (Rendered outside parent Pressable so taps don't bubble) */}
      {isPaused && (
        <Animated.View style={[styles.pausedControlsContainer, { opacity: pausedControlsOpacity }]}>
          <Pressable
            onPress={() => {
              setIsPaused(false);
            }}
            style={styles.pausedControlHalf}
          >
            <Ionicons name="play" size={24} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </Pressable>

          <View style={styles.pausedControlDivider} />

          <Pressable
            onPress={() => {
              setIsMuted(!isMuted);
            }}
            style={styles.pausedControlHalf}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </Animated.View>
      )}

      {/* Right Action Buttons */}
      <View style={[styles.rightSidebar, { bottom: finalBottomOffset + 15 }]}>
        {/* Like Button */}
        <Pressable onPress={handleLike} style={styles.sidebarButton}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Ionicons
              name={localLiked ? 'heart' : 'heart-outline'}
              size={32}
              color={localLiked ? '#FF3040' : '#FFFFFF'}
            />
          </Animated.View>
          <ThemedText style={styles.sidebarText}>
            {localLikesCount.toLocaleString()}
          </ThemedText>
        </Pressable>

        {/* Comment Button */}
        <Pressable onPress={() => setShowComments(true)} style={styles.sidebarButton}>
          <Ionicons name="chatbubble-outline" size={30} color="#FFFFFF" />
          <ThemedText style={styles.sidebarText}>
            {localCommentsCount.toLocaleString()}
          </ThemedText>
        </Pressable>

        {/* Share Button */}
        <Pressable onPress={() => setShowShareModal(true)} style={styles.sidebarButton}>
          <Feather name="send" size={28} color="#FFFFFF" />
        </Pressable>

        {/* More Actions Options */}
        <Pressable style={styles.sidebarButton}>
          <Feather name="more-vertical" size={26} color="#FFFFFF" />
        </Pressable>

        {/* Rotating Music Disc */}
        <Animated.View style={[styles.musicDiscContainer, { transform: [{ rotate: spin }] }]}>
          <ExpoImage
            source={{ uri: reel.avatar }}
            style={styles.musicDiscImage}
            contentFit="cover"
          />
        </Animated.View>
      </View>

      {/* Bottom Text Details Overlay */}
      <View style={[styles.bottomOverlay, { bottom: finalBottomOffset + 15 }]}>
        <View style={styles.userRow}>
          <ExpoImage
            source={{ uri: reel.avatar }}
            style={styles.avatar}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            transition={200}
          />
          <ThemedText style={styles.usernameText}>
            {reel.username}
          </ThemedText>
          {user && (reel.userId || reel.author?.id) !== user.id && (
            <FollowButton
              targetUserId={reel.userId || reel.author?.id || ''}
              initialIsFollowing={reel.isFollowing ?? false}
              initialIsRequested={reel.isRequested ?? false}
              isPrivate={reel.author?.isPrivate ?? false}
              size="small"
            />
          )}
        </View>

        <ThemedText style={styles.descriptionText} numberOfLines={3}>
          {reel.description}
        </ThemedText>

        {/* Music Track Details Row */}
        <View style={styles.musicRow}>
          <Feather name="music" size={14} color="#FFFFFF" />
          <ThemedText style={styles.musicText} numberOfLines={1}>
            {reel.musicName}
          </ThemedText>
        </View>
      </View>

      {/* Playback Seekbar Line (Scrubbable with Micro-Animations) */}
      <View 
        style={[styles.seekbarContainer, { bottom: finalBottomOffset }]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleSeekTouch}
        onResponderMove={handleSeekTouch}
        onResponderRelease={handleSeekRelease}
        onResponderTerminate={handleSeekRelease}
      >
        <Animated.View style={[styles.seekbarTrack, { transform: [{ scaleY: seekbarScaleY }] }]}>
          <View style={[styles.seekbarProgress, { width: `${progress * 100}%` }]} />
        </Animated.View>
        <Animated.View 
          style={[
            styles.scrubHandle, 
            { 
              left: `${progress * 100}%`,
              transform: [
                { scale: handleScale },
                { translateX: -6 }
              ]
            }
          ]} 
        />
      </View>

      {/* Comments Sheet — rendered above the reel */}
      <CommentsSheet
        visible={showComments}
        postId={reel.id}
        entityType="reel"
        commentsCount={localCommentsCount}
        onClose={() => setShowComments(false)}
        onCommentAdded={(newCount) => setLocalCommentsCount(newCount)}
      />

      <ShareSheetModal
        visible={showShareModal}
        referenceType="reel"
        referenceId={reel.id}
        previewImageUrl={reel.imageUrl}
        previewCaption={reel.description}
        onClose={() => setShowShareModal(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: WINDOW_WIDTH,
    position: 'relative',
    backgroundColor: '#000000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    resizeMode: 'cover',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  rightSidebar: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  sidebarButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  musicDiscContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
    marginTop: 10,
  },
  musicDiscImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 15,
    bottom: 15,
    right: 80,
    zIndex: 10,
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  usernameText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  followButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  descriptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  musicText: {
    color: '#FFFFFF',
    fontSize: 13,
    maxWidth: 200,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  doubleTapHeart: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  pausedControlsContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    marginTop: -28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    width: 130,
    height: 56,
    zIndex: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  pausedControlHalf: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedControlDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  seekbarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 20, // Expanded touch responder area
    justifyContent: 'flex-end',
    zIndex: 20, // Above video content
  },
  seekbarTrack: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    width: '100%',
  },
  seekbarProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  scrubHandle: {
    position: 'absolute',
    bottom: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 4,
  },
  posterLoaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});
