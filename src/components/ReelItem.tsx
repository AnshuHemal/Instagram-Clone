import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Image, Pressable, Dimensions, Animated, Easing, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { ReelShimmer } from './ReelShimmer';
import { Reel } from '@/constants/mockData';
import { api } from '@/services/api';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

// 1. Dynamic check for expo-video (SDK 51+ standard)
let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (e) {
  // Silent fallback
}

// 2. Dynamic check for legacy expo-av
let ExpoAV: any = null;
try {
  ExpoAV = require('expo-av');
} catch (e) {
  // Silent fallback
}

// Declarative video component using new expo-video standard
const VideoPlayerExpoVideo = ({ hlsUrl, isPlaying, isActive, isScreenFocused, isMuted, posterUrl, onProgress, onPlayerReady, onStatusChange }: any) => {
  const cleanUrl = hlsUrl?.replace('.mp4.m3u8', '.m3u8');
  const player = ExpoVideo.useVideoPlayer(cleanUrl, (p: any) => {
    p.loop = true;
    p.muted = isMuted;
    p.showNowPlayingNotification = false;
    p.timeUpdateEventInterval = 0.05; // 50ms updates for smooth seekbar line
    if (isPlaying) {
      p.play();
    } else {
      p.pause();
    }
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying]);

  // Seek back to start ONLY when first focusing or changing active items
  useEffect(() => {
    if (isActive && isScreenFocused) {
      player.currentTime = 0;
    }
  }, [isActive, isScreenFocused]);

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
      style={StyleSheet.absoluteFill}
      player={player}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

// Declarative video component using new expo-video standard for preloaded player
const VideoPlayerExpoVideoPreloaded = ({ player, isPlaying, isActive, isScreenFocused, isMuted, onProgress, onStatusChange }: any) => {
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
      style={StyleSheet.absoluteFill}
      player={player}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

// Declarative video component using legacy expo-av
const VideoPlayerExpoAV = ({ hlsUrl, isPlaying, isActive, isScreenFocused, isMuted, posterUrl, videoRef, onProgress, onStatusChange }: any) => {
  const cleanUrl = hlsUrl?.replace('.mp4.m3u8', '.m3u8');
  const cleanPosterUrl = posterUrl?.replace('.mp4.jpg', '.jpg');

  // Handle play/pause
  useEffect(() => {
    if (videoRef?.current) {
      if (isPlaying) {
        videoRef.current.playAsync().catch(() => {});
      } else {
        videoRef.current.pauseAsync().catch(() => {});
      }
    }
  }, [isPlaying]);

  // Seek back to start ONLY when first focusing or changing active items
  useEffect(() => {
    if (videoRef?.current && isActive && isScreenFocused) {
      videoRef.current.setPositionAsync(0).catch(() => {});
    }
  }, [isActive, isScreenFocused]);

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (onStatusChange) {
        onStatusChange(status.isBuffering ? 'loading' : 'readyToPlay');
      }
      if (status.durationMillis && onProgress) {
        onProgress(status.positionMillis / status.durationMillis);
      }
    } else {
      if (onStatusChange) {
        onStatusChange('loading');
      }
    }
  };

  return (
    <ExpoAV.Video
      ref={videoRef}
      source={{ uri: cleanUrl }}
      style={StyleSheet.absoluteFill}
      resizeMode={ExpoAV.ResizeMode?.COVER || 'cover'}
      shouldPlay={isPlaying}
      isLooping={true}
      isMuted={isMuted}
      useNativeControls={false}
      posterSource={{ uri: cleanPosterUrl }}
      usePoster={true}
      posterStyle={styles.backgroundImage}
      onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      progressUpdateIntervalMillis={100} // 100ms updates
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
}

export const ReelItem = React.memo(({
  reel,
  isActive,
  isScreenFocused = true,
  onLikeToggle,
  height,
  preloadedPlayer,
}: ReelItemProps) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabHeight = Platform.OS === 'ios' 
    ? 50 + insets.bottom 
    : 60 + (insets.bottom > 0 ? insets.bottom - 5 : 8);
  
  const [isFollowed, setIsFollowed] = useState(false);
  const [localLiked, setLocalLiked] = useState(reel.isLiked);
  const [localLikesCount, setLocalLikesCount] = useState(reel.likesCount);
  const [lastTap, setLastTap] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showMuteBadge, setShowMuteBadge] = useState(false);
  const [isPausedByHold, setIsPausedByHold] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playerStatus, setPlayerStatus] = useState<string>(() => {
    const isReadyNow = preloadedPlayer && preloadedPlayer.status === 'readyToPlay';
    return isReadyNow ? 'readyToPlay' : 'loading';
  });
  const [showShimmer, setShowShimmer] = useState(() => {
    const isReadyNow = preloadedPlayer && preloadedPlayer.status === 'readyToPlay';
    return !isReadyNow;
  });
  const shimmerOpacity = useRef(
    new Animated.Value(preloadedPlayer && preloadedPlayer.status === 'readyToPlay' ? 0 : 1)
  ).current;

  // Synchronously adjust state during render if active state or preloaded player changes to prevent visual flash
  const [prevIsActive, setPrevIsActive] = useState(isActive);
  const [prevPreloadedPlayer, setPrevPreloadedPlayer] = useState(preloadedPlayer);

  if (isActive !== prevIsActive || preloadedPlayer !== prevPreloadedPlayer) {
    setPrevIsActive(isActive);
    setPrevPreloadedPlayer(preloadedPlayer);
    
    const isReadyNow = preloadedPlayer && preloadedPlayer.status === 'readyToPlay';
    if (isActive) {
      if (isReadyNow) {
        setPlayerStatus('readyToPlay');
        setShowShimmer(false);
        shimmerOpacity.setValue(0);
      } else {
        setPlayerStatus('loading');
        setShowShimmer(true);
        shimmerOpacity.setValue(1);
      }
    } else {
      setShowShimmer(!isReadyNow);
      shimmerOpacity.setValue(isReadyNow ? 0 : 1);
      setPlayerStatus(isReadyNow ? 'readyToPlay' : 'loading');
    }
  }

  // React to video status changes and perform transition fade-out
  useEffect(() => {
    if (!isActive) {
      // Check if the preloaded player is already ready to avoid flashing shimmer
      const isReadyNow = preloadedPlayer && preloadedPlayer.status === 'readyToPlay';
      setShowShimmer(!isReadyNow);
      shimmerOpacity.setValue(isReadyNow ? 0 : 1);
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

  // Video Ref for legacy player
  const avVideoRef = useRef<any>(null);
  
  // Track View Duration
  const viewStartTime = useRef<number | null>(null);

  // Animations
  const rotateValue = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const muteBadgeOpacity = useRef(new Animated.Value(0)).current;

  // Interactive Seekbar & Player state refs
  const activePlayerRef = useRef<any>(null);
  const isScrubbingRef = useRef<boolean>(false);

  // Seekbar micro-animations (scale track height and show dot on grab)
  const seekbarScaleY = useRef(new Animated.Value(1)).current;
  const handleScale = useRef(new Animated.Value(0)).current;

  const isPlaying = isActive && isScreenFocused && !isPausedByHold;

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
    } else if (ExpoAV && avVideoRef.current) {
      avVideoRef.current.getStatusAsync().then((status: any) => {
        if (status.isLoaded && status.durationMillis) {
          avVideoRef.current.setPositionAsync(boundedRatio * status.durationMillis).catch(() => {});
        }
      }).catch(() => {});
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
  }, [reel.isLiked, reel.likesCount]);

  // Audio Mode Setup for legacy expo-av
  useEffect(() => {
    const setupAudio = async () => {
      if (!ExpoAV || !ExpoAV.Audio) return;
      try {
        await ExpoAV.Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
        });
      } catch (err) {
        // Suppress audio configuration errors
      }
    };
    setupAudio();
  }, []);

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

  // View analytics tracking trigger
  useEffect(() => {
    if (isPlaying) {
      viewStartTime.current = Date.now();
    } else {
      if (viewStartTime.current !== null) {
        const duration = Date.now() - viewStartTime.current;
        if (duration >= 1500) {
          recordViewAPI(duration);
        }
        viewStartTime.current = null;
      }
    }

    return () => {
      if (viewStartTime.current !== null) {
        const duration = Date.now() - viewStartTime.current;
        if (duration >= 1500) {
          recordViewAPI(duration);
        }
        viewStartTime.current = null;
      }
    };
  }, [isPlaying]);

  const recordViewAPI = async (watchTimeMs: number) => {
    try {
      const completed = watchTimeMs >= 15000;
      await api.post(`/reels/${reel.id}/view`, {
        watchDurationMs: Math.round(watchTimeMs),
        completed,
        quality: '720p',
      });
    } catch (err) {
      // Fail silently for views tracker calls
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

  const triggerMuteBadgeAnim = () => {
    setShowMuteBadge(true);
    muteBadgeOpacity.setValue(0);
    
    Animated.sequence([
      Animated.timing(muteBadgeOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(600),
      Animated.timing(muteBadgeOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowMuteBadge(false);
    });
  };

  // Cleanup hold timeout on unmount
  useEffect(() => {
    return () => {
      if (holdTimeout.current) clearTimeout(holdTimeout.current);
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
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY) {
      if (!localLiked) {
        handleLike();
      }
      triggerDoubleTapHeart();
    } else {
      setLastTap(now);
      // Only trigger mute animations if a native video player is active
      const hasNativeVideo = !!ExpoVideo || !!ExpoAV;
      if (hasNativeVideo) {
        const nextMuteState = !isMuted;
        setIsMuted(nextMuteState);
        triggerMuteBadgeAnim();
      }
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
    if (!reel.hlsUrl) {
      return <Image source={{ uri: reel.imageUrl }} style={styles.backgroundImage} />;
    }

    if (ExpoVideo) {
      if (preloadedPlayer) {
        return (
          <VideoPlayerExpoVideoPreloaded
            player={preloadedPlayer}
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

    if (ExpoAV) {
      return (
        <VideoPlayerExpoAV
          hlsUrl={reel.hlsUrl}
          isPlaying={isPlaying}
          isActive={isActive}
          isScreenFocused={isScreenFocused}
          isMuted={isMuted}
          posterUrl={reel.imageUrl}
          videoRef={avVideoRef}
          onProgress={handleProgressUpdate}
          onStatusChange={setPlayerStatus}
        />
      );
    }

    // Default static image fallback
    return <Image source={{ uri: reel.imageUrl }} style={styles.backgroundImage} />;
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Background Media with Tap handler */}
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={StyleSheet.absoluteFill}>
        {renderVideoPlayer()}
        <View style={styles.dimOverlay} />
        
        {/* Animated Pop-up Center Heart */}
        <Animated.View
          style={[
            styles.doubleTapHeart,
            {
              transform: [{ scale: heartScale }],
              opacity: heartOpacity,
            },
          ]}
        >
          <Ionicons name="heart" size={100} color="#FFFFFF" />
        </Animated.View>

        {/* Animated Sound Status Badge */}
        {showMuteBadge && (
          <Animated.View
            style={[
              styles.muteBadge,
              { opacity: muteBadgeOpacity },
            ]}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={24} color="#FFFFFF" />
          </Animated.View>
        )}
      </Pressable>

      {/* Right Action Buttons */}
      <View style={[styles.rightSidebar, { bottom: tabHeight + 15 }]}>
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
        <Pressable style={styles.sidebarButton}>
          <Ionicons name="chatbubble-outline" size={30} color="#FFFFFF" />
          <ThemedText style={styles.sidebarText}>
            {reel.commentsCount.toLocaleString()}
          </ThemedText>
        </Pressable>

        {/* Share Button */}
        <Pressable style={styles.sidebarButton}>
          <Feather name="send" size={28} color="#FFFFFF" />
        </Pressable>

        {/* More Actions Options */}
        <Pressable style={styles.sidebarButton}>
          <Feather name="more-vertical" size={26} color="#FFFFFF" />
        </Pressable>

        {/* Rotating Music Disc */}
        <Animated.View style={[styles.musicDiscContainer, { transform: [{ rotate: spin }] }]}>
          <Image source={{ uri: reel.avatar }} style={styles.musicDiscImage} />
        </Animated.View>
      </View>

      {/* Bottom Text Details Overlay */}
      <View style={[styles.bottomOverlay, { bottom: tabHeight + 15 }]}>
        <View style={styles.userRow}>
          <Image source={{ uri: reel.avatar }} style={styles.avatar} />
          <ThemedText style={styles.usernameText}>
            {reel.username}
          </ThemedText>
          <Pressable
            onPress={() => setIsFollowed(!isFollowed)}
            style={[
              styles.followButton,
              isFollowed && { borderColor: 'rgba(255, 255, 255, 0.4)', backgroundColor: 'transparent' },
            ]}
          >
            <ThemedText style={styles.followButtonText}>
              {isFollowed ? 'Following' : 'Follow'}
            </ThemedText>
          </Pressable>
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
        style={[styles.seekbarContainer, { bottom: tabHeight }]}
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

      {/* Dynamic Loading Shimmer Skeleton Overlay */}
      {isActive && showShimmer && (
        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            { 
              opacity: shimmerOpacity, 
              zIndex: 30 
            }
          ]} 
          pointerEvents="none"
        >
          <ReelShimmer />
        </Animated.View>
      )}
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
  muteBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    bottom: -5, // Centered on the 2px track that rests at bottom: 0
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
});
