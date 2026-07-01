import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Pressable,
  FlatList,
  Dimensions,
  Share,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
  SlideInRight,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  FadeOut,
  LinearTransition,
  useAnimatedProps,
  useDerivedValue,
  useAnimatedReaction,
  withRepeat,
  Easing,
  SharedValue,
  runOnJS,
  SharedValue as ReanimatedSharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '@/contexts/ThemeContext';
import { GradientPullRefresh } from '@/components/GradientPullRefresh';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ProfileSkeleton } from '@/components/Skeleton';
import { AccountSwitcherSheet } from '@/components/AccountSwitcherSheet';
import { CreateBottomSheet } from '@/components/CreateBottomSheet';
import { AvatarBottomSheet } from '@/components/AvatarBottomSheet';
import { AddPhotoBottomSheet } from '@/components/AddPhotoBottomSheet';
import { LibrarySelectModal } from '@/components/LibrarySelectModal';
import { ShareProfileModal } from '@/components/ShareProfileModal';
import { useToast } from '@/contexts/ToastContext';
import { useTabPager } from '@/contexts/TabPagerContext';
import { useStories } from '@/contexts/StoriesContext';
import * as ImagePicker from 'expo-image-picker';
import { MOCK_STORIES } from '@/constants/mockData';
import { FollowButton } from '@/components/FollowButton';
import { followService, UserProfileResponse } from '@/services/follow';
import { blockService, MutualFollower } from '@/services/block';
import { api } from '@/services/api';
import { haptics } from '@/utils/haptics';
import { PostCard } from '@/components/PostCard';
import { ReelItem } from '@/components/ReelItem';
import { useSaved } from '@/contexts/SavedContext';
import { StoryPlayerModal } from '@/components/StoryPlayerModal';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';


import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = SCREEN_WIDTH / 3;

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileTab = 'posts' | 'reels' | 'tagged' | 'saved';

interface FollowSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isVerified?: boolean;
  mutualFollowers?: number;
  isFollowing: boolean;
}

// ─── Mock follow suggestions (will be replaced with real API later) ───────────

const FOLLOW_SUGGESTIONS: FollowSuggestion[] = MOCK_STORIES.map((s, i) => ({
  id: s.id,
  username: s.username,
  displayName: s.username.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  avatar: s.avatar,
  isVerified: i % 2 === 0,
  mutualFollowers: Math.floor(Math.random() * 20) + 1,
  isFollowing: false,
}));

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated count number that springs from 0 to target value */
const AnimatedCount = ({ targetValue }: { targetValue: number }) => {
  const count = useSharedValue(0);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    count.value = 0;
    count.value = withTiming(targetValue, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [targetValue]);

  const derived = useDerivedValue(() => Math.round(count.value));

  useAnimatedReaction(
    () => derived.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayCount)(current);
      }
    }
  );

  return <>{displayCount.toLocaleString()}</>;
};

/** Stat box: number + label — Instagram-style layout */
const StatBox = ({
  count,
  label,
  onPress,
  textColor,
  labelColor,
  delay,
}: {
  count: number;
  label: string;
  onPress?: () => void;
  textColor: string;
  labelColor?: string;
  delay?: number;
}) => (
  <Animated.View entering={FadeInDown.duration(400).delay(delay ?? 0)}>
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.statBox,
        { opacity: pressed && onPress ? 0.5 : 1 },
      ]}
    >
      <ThemedText style={[styles.statCount, { color: textColor }]}>
        <AnimatedCount targetValue={count} />
      </ThemedText>
      <ThemedText style={[styles.statLabel, { color: labelColor ?? textColor }]}>
        {label}
      </ThemedText>
    </Pressable>
  </Animated.View>
);

/** Follow suggestion card */
const SuggestionCard = ({
  item,
  onFollow,
  onDismiss,
  colors,
  isDark,
}: {
  item: FollowSuggestion;
  onFollow: (id: string) => void;
  onDismiss: (id: string) => void;
  colors: any;
  isDark: boolean;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleFollow = () => {
    scale.value = withSpring(0.94, { damping: 12 }, () => {
      scale.value = withSpring(1);
    });
    onFollow(item.id);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.suggestionCard,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9',
          borderColor: isDark ? '#2C2C2E' : '#E5E5E5',
        },
      ]}
    >
      {/* Dismiss */}
      <Pressable onPress={() => onDismiss(item.id)} style={styles.dismissButton} hitSlop={8}>
        <Ionicons name="close" size={14} color={colors.textSecondary} />
      </Pressable>

      {/* Avatar */}
      <Image source={{ uri: item.avatar }} style={styles.suggestionAvatar} />

      {/* Name row */}
      <View style={styles.suggestionNameRow}>
        <ThemedText
          numberOfLines={1}
          style={[styles.suggestionUsername, { color: colors.text }]}
        >
          {item.username}
        </ThemedText>
        {item.isVerified && (
          <MaterialCommunityIcons name="check-decagram" size={13} color="#0095F6" />
        )}
      </View>

      {/* Mutual followers */}
      {item.mutualFollowers ? (
        <ThemedText
          numberOfLines={1}
          style={[styles.suggestionMutual, { color: colors.textSecondary }]}
        >
          {item.mutualFollowers} mutual follower{item.mutualFollowers > 1 ? 's' : ''}
        </ThemedText>
      ) : null}

      {/* Follow button */}
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handleFollow}
          style={[
            styles.followButton,
            item.isFollowing
              ? {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: isDark ? '#555' : '#DBDBDB',
              }
              : { backgroundColor: '#0095F6' },
          ]}
        >
          <ThemedText
            style={[
              styles.followButtonText,
              { color: item.isFollowing ? colors.text : '#FFFFFF' },
            ]}
          >
            {item.isFollowing ? 'Following' : 'Follow'}
          </ThemedText>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

/** 3-tab content area icon tab */
const ContentTab = ({
  icon,
  onPress,
}: {
  icon: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}) => {
  return (
    <Pressable onPress={onPress} style={styles.contentTab}>
      {icon}
    </Pressable>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId: rawUserId } = useLocalSearchParams<{ userId?: string }>();
  const viewUserId = (rawUserId && rawUserId !== 'undefined' && rawUserId !== 'null') ? rawUserId : undefined;
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, refreshProfile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { setPagerScrollEnabled } = useTabPager();
  const { stories, uploadStory, viewStory } = useStories();
  const [playerVisible, setPlayerVisible] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [suggestions, setSuggestions] = useState(FOLLOW_SUGGESTIONS);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [reelsSort, setReelsSort] = useState<'latest' | 'most_viewed'>('latest');
  const [showReelsDropdown, setShowReelsDropdown] = useState(false);

  // Other user profile state
  const [viewProfile, setViewProfile] = useState<UserProfileResponse['user'] | null>(null);
  const [isViewLoading, setIsViewLoading] = useState(false);

  // Block / mute / mutual followers / tagged
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState<MutualFollower[]>([]);
  const [mutualTotal, setMutualTotal] = useState(0);
  const [taggedPosts, setTaggedPosts] = useState<any[]>([]);
  const [loadingTagged, setLoadingTagged] = useState(false);

  // Real user media posts & reels states
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userReels, setUserReels] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingReels, setLoadingReels] = useState(false);

  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [selectedReel, setSelectedReel] = useState<any | null>(null);

  const isOwnProfile = !viewUserId || viewUserId === user?.id;

  const { savedPostIds, toggleSave } = useSaved();
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const tabsList = useMemo<ProfileTab[]>(() => {
    return isOwnProfile
      ? ['posts', 'reels', 'tagged', 'saved']
      : ['posts', 'reels', 'tagged'];
  }, [isOwnProfile]);

  const totalTabs = tabsList.length;

  const visibleSavedPosts = useMemo(() => {
    return savedPosts.filter(p => savedPostIds.has(p.id));
  }, [savedPosts, savedPostIds]);

  const handleAddStory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your gallery to upload stories.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const type = asset.type === 'video' ? 'video' : 'image';

      showToast({
        title: 'Uploading Story',
        message: 'Your story is uploading to Cloudinary...',
        type: 'info',
      });

      const success = await uploadStory(asset.uri, type);

      if (success) {
        showToast({
          title: 'Story Shared',
          message: 'Your story has been shared successfully.',
          type: 'success',
        });
      } else {
        showToast({
          title: 'Upload Failed',
          message: 'Failed to upload your story. Please try again.',
          type: 'error',
        });
      }
    }
  };

  const scrollY = useSharedValue(0);
  const viewPagerRef = useRef<Animated.ScrollView>(null);
  const viewPagerScrollX = useSharedValue(0);



  // Fetch other user's profile
  useEffect(() => {
    if (viewUserId && viewUserId !== user?.id) {
      const fetchUserProfile = async () => {
        setIsViewLoading(true);
        try {
          const res = await followService.getUserProfile(viewUserId);
          if (res.success && res.user) {
            setViewProfile(res.user);
            // Sync block/mute status returned from API
            if ((res.user as any).isBlocked !== undefined) setIsBlocked(Boolean((res.user as any).isBlocked));
            if ((res.user as any).isMuted !== undefined) setIsMuted(Boolean((res.user as any).isMuted));
            // Fetch mutual followers
            try {
              const mutualRes = await blockService.getMutualFollowers(viewUserId);
              if (mutualRes.success) {
                setMutualFollowers(mutualRes.data);
                setMutualTotal(mutualRes.total);
              }
            } catch {}
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          showToast({ title: 'Error', message: 'Failed to load profile.', type: 'error' });
        } finally {
          setIsViewLoading(false);
        }
      };
      fetchUserProfile();
    }
  }, [viewUserId]);

  // Determine which profile data to display
  const profileUser = isOwnProfile
    ? user
    : viewProfile
      ? {
          ...user!,
          id: viewProfile.id,
          username: viewProfile.username,
          name: viewProfile.displayName,
          avatar: viewProfile.avatarUrl || '',
          bio: viewProfile.bio || '',
          followersCount: viewProfile.followersCount,
          followingCount: viewProfile.followingCount,
          postsCount: viewProfile.postsCount,
        }
      : user;

  const isProfilePrivate = isOwnProfile
    ? (user?.isPrivate ?? false)
    : (viewProfile?.isPrivate ?? false);

  const userStoryGroup = useMemo(() => {
    return stories.find((g) => g.userId === profileUser?.id);
  }, [stories, profileUser?.id]);

  const sortedReels = useMemo(() => {
    if (reelsSort === 'most_viewed') {
      return [...userReels].sort((a, b) => {
        const countA = parseInt(a.views.replace(/,/g, ''), 10) || 0;
        const countB = parseInt(b.views.replace(/,/g, ''), 10) || 0;
        return countB - countA;
      });
    }
    return userReels;
  }, [userReels, reelsSort]);

  const fetchUserMedia = useCallback(async () => {
    const targetUserId = viewUserId || user?.id;
    if (!targetUserId) return;

    setLoadingPosts(true);
    setLoadingReels(true);
    if (isOwnProfile) {
      setLoadingSaved(true);
    }

    try {
      const promises: Promise<any>[] = [
        api.get(`/posts/user/${targetUserId}`),
        api.get(`/reels/user/${targetUserId}`),
      ];
      if (isOwnProfile) {
        promises.push(api.get('/posts/saved', { params: { limit: 50 } }));
      }

      const [postsRes, reelsRes, savedRes] = await Promise.all(promises);

      if (postsRes.data?.success && postsRes.data?.data?.posts) {
        const mapped = postsRes.data.data.posts.map((post: any) => ({
          ...post,
          isLiked: !!post.isLiked,
        }));
        setUserPosts(mapped);
      }
      if (reelsRes.data?.success && reelsRes.data?.data?.reels) {
        const mapped = reelsRes.data.data.reels.map((item: any) => ({
          id: item.id,
          username: item.user?.username || profileUser?.username || 'anonymous',
          avatar: item.user?.avatarUrl || profileUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          imageUrl: item.thumbnailUrl || 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800',
          description: item.caption || '',
          likesCount: Number(item.likesCount || 0),
          commentsCount: Number(item.commentsCount || 0),
          isLiked: !!item.isLiked,
          musicName: item.audioName || 'Original Audio',
          views: Number(item.viewsCount || 0).toLocaleString(),
          hlsUrl: item.hlsUrl || undefined,
          durationSeconds: item.durationSeconds ? Number(item.durationSeconds) : undefined,
        }));
        setUserReels(mapped);
      }
      if (isOwnProfile && savedRes?.data?.success && savedRes?.data?.data) {
        setSavedPosts(savedRes.data.data);
      }
    } catch (err) {
      console.warn('[ProfileScreen] Failed to fetch user media:', err);
    } finally {
      setLoadingPosts(false);
      setLoadingReels(false);
      if (isOwnProfile) {
        setLoadingSaved(false);
      }
    }
  }, [viewUserId, user?.id, profileUser?.username, profileUser?.avatar, isOwnProfile]);

  useEffect(() => {
    fetchUserMedia();
  }, [fetchUserMedia]);

  // Fetch posts tagged with @username when tagged tab becomes active
  useEffect(() => {
    if (activeTab !== 'tagged' || !profileUser?.username) return;
    setLoadingTagged(true);
    api
      .get('/posts/search', { params: { q: `@${profileUser.username}` } })
      .then((res) => setTaggedPosts(res.data?.data ?? []))
      .catch(() => setTaggedPosts([]))
      .finally(() => setLoadingTagged(false));
  }, [activeTab, profileUser?.username]);

  const handleMoreOptions = () => {
    const tid = viewProfile?.id ?? viewUserId ?? '';
    const uname = viewProfile?.username ?? '';
    Alert.alert(uname, undefined, [
      {
        text: isBlocked ? 'Unblock' : 'Block',
        style: 'destructive',
        onPress: () => {
          haptics.medium();
          if (isBlocked) {
            blockService
              .unblockUser(tid)
              .then(() => {
                setIsBlocked(false);
                showToast({ title: 'Unblocked', message: `Unblocked ${uname}`, type: 'success' });
              })
              .catch(() => {});
          } else {
            Alert.alert(
              `Block ${uname}?`,
              "They won't be notified that you blocked them.",
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Block',
                  style: 'destructive',
                  onPress: () => {
                    blockService
                      .blockUser(tid)
                      .then(() => {
                        setIsBlocked(true);
                        showToast({ title: 'Blocked', message: `Blocked ${uname}`, type: 'info' });
                      })
                      .catch(() => {});
                  },
                },
              ],
            );
          }
        },
      },
      {
        text: isMuted ? 'Unmute' : 'Mute',
        onPress: () => {
          haptics.light();
          if (isMuted) {
            blockService
              .unmuteUser(tid)
              .then(() => {
                setIsMuted(false);
                showToast({ title: 'Unmuted', message: `Unmuted ${uname}`, type: 'success' });
              })
              .catch(() => {});
          } else {
            blockService
              .muteUser(tid)
              .then(() => {
                setIsMuted(true);
                showToast({ title: 'Muted', message: `Muted ${uname}'s posts`, type: 'info' });
              })
              .catch(() => {});
          }
        },
      },
      {
        text: 'Report',
        style: 'destructive',
        onPress: () =>
          showToast({ title: 'Reported', message: 'Thank you for your report.', type: 'info' }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onPostLikeToggle = async (postId: string) => {
    try {
      setUserPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1
          };
        }
        return p;
      }));
      setSavedPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1
          };
        }
        return p;
      }));
      setSelectedPost((prev: any) => {
        if (prev && prev.id === postId) {
          const isLiked = !prev.isLiked;
          return {
            ...prev,
            isLiked,
            likesCount: isLiked ? prev.likesCount + 1 : prev.likesCount - 1
          };
        }
        return prev;
      });
      await api.post(`/posts/${postId}/like`);
    } catch (err) {
      console.warn('Failed to toggle like:', err);
    }
  };

  const onPostCommentAdd = async (postId: string, text: string) => {
    try {
      const res = await api.post(`/posts/${postId}/comment`, { text });
      if (res.data?.success && res.data?.data) {
        setUserPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: (p.commentsCount || 0) + 1,
            };
          }
          return p;
        }));
        setSavedPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: (p.commentsCount || 0) + 1,
            };
          }
          return p;
        }));
        setSelectedPost((prev: any) => {
          if (prev && prev.id === postId) {
            return {
              ...prev,
              commentsCount: (prev.commentsCount || 0) + 1,
            };
          }
          return prev;
        });
        return res.data.data;
      }
    } catch (err) {
      console.warn('Failed to add comment:', err);
    }
    return null;
  };

  const onReelLikeToggle = async (reelId: string) => {
    try {
      setUserReels(prev => prev.map(r => {
        if (r.id === reelId) {
          const isLiked = !r.isLiked;
          return {
            ...r,
            isLiked,
            likesCount: isLiked ? r.likesCount + 1 : r.likesCount - 1
          };
        }
        return r;
      }));
      setSelectedReel((prev: any) => {
        if (prev && prev.id === reelId) {
          const isLiked = !prev.isLiked;
          return {
            ...prev,
            isLiked,
            likesCount: isLiked ? prev.likesCount + 1 : prev.likesCount - 1
          };
        }
        return prev;
      });
      await api.post(`/reels/${reelId}/like`);
    } catch (err) {
      console.warn('Failed to toggle reel like:', err);
    }
  };

  // Avatar action sheet
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [showAddPhotoSheet, setShowAddPhotoSheet] = useState(false);
  const [showLibrarySelectModal, setShowLibrarySelectModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const avatarRef = useRef<View>(null);
  const [avatarLayout, setAvatarLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const triggerShareModal = () => {
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      if (width && height) {
        setAvatarLayout({ x, y, width, height });
      } else {
        setAvatarLayout({ x: 16, y: 120, width: 90, height: 90 });
      }
      setShowShareModal(true);
    });
  };

  const openAvatarSheet = useCallback(() => {
    setShowAvatarSheet(true);
  }, []);

  const handleAvatarPress = () => {
    if (userStoryGroup) {
      const groupIdx = stories.findIndex((g) => g.userId === profileUser?.id);
      if (groupIdx !== -1) {
        setSelectedGroupIndex(groupIdx);
        setPlayerVisible(true);
      }
    } else if (isOwnProfile) {
      openAvatarSheet();
    } else {
      triggerShareModal();
    }
  };



  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const scrollHandlerViewPager = useAnimatedScrollHandler({
    onScroll: (event) => {
      viewPagerScrollX.value = event.contentOffset.x;
    },
  });

  const handleTabPress = (tab: ProfileTab) => {
    setActiveTab(tab);
    setShowReelsDropdown(false);
    const tabIndex = tabsList.indexOf(tab);
    if (tabIndex !== -1) {
      viewPagerRef.current?.scrollTo({ x: tabIndex * SCREEN_WIDTH, animated: true });
    }
  };

  const onViewPagerScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    const newTab = tabsList[pageIndex];
    if (newTab && activeTab !== newTab) {
      setActiveTab(newTab);
    }
  };

  const underlineStyle = useAnimatedStyle(() => {
    const tabWidth = SCREEN_WIDTH / totalTabs;
    const translation = interpolate(
      viewPagerScrollX.value,
      Array.from({ length: totalTabs }, (_, i) => i * SCREEN_WIDTH),
      Array.from({ length: totalTabs }, (_, i) => i * tabWidth),
      Extrapolation.CLAMP
    );
    return {
      width: tabWidth,
      transform: [{ translateX: translation }],
    };
  });

  // Subtle header opacity based on scroll
  const headerAnimStyle = useAnimatedStyle(() => ({
    borderBottomWidth: interpolate(scrollY.value, [0, 30], [0, 0.5], Extrapolation.CLAMP),
    borderBottomColor: isDark ? '#2C2C2E' : '#E5E5E5',
  }));

  const handleFollow = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFollowing: !s.isFollowing } : s))
    );
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${user?.username}'s Instagram profile!`,
        url: `https://instagram.com/${user?.username}`,
      });
    } catch (_) { }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleHamburger = () => {
    haptics.light();
    router.push('/settings' as any);
  };

  if (!user) return null;

  // Show skeleton when loading other user's profile
  if (!isOwnProfile && isViewLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
        edges={['left', 'right']}
      >
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }





  const hasBio = !!(profileUser?.bio && profileUser.bio.trim());
  const hasAvatar = !!(profileUser?.avatar && profileUser.avatar.trim());
  const hasPosts = userPosts.length > 0;
  const hasReels = userReels.length > 0;

  const tabIcon = (name: any, filledName: any, tab: ProfileTab) => (
    <Ionicons
      name={activeTab === tab ? filledName : name}
      size={22}
      color={activeTab === tab ? colors.text : colors.textSecondary}
    />
  );

  if (!profileUser) return null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right']}
    >
      {/* ── Reels Dropdown Backdrop ── */}
      {showReelsDropdown && (
        <Pressable
          style={[StyleSheet.absoluteFill, { zIndex: 998 }]}
          onPress={() => setShowReelsDropdown(false)}
        />
      )}
      {/* ── Sticky Header ── */}
      <Animated.View style={[styles.header, headerAnimStyle, { backgroundColor: colors.background, paddingTop: insets.top, height: 50 + insets.top }]}>
        {/* Left: Back or + new post */}
        {isOwnProfile ? (
          <Pressable
            style={styles.headerIconBtn}
            hitSlop={8}
            onPress={() => setShowCreateSheet(true)}
          >
            <Ionicons name="add" size={26} color={colors.text} />
          </Pressable>
        ) : (
          <Pressable
            style={styles.headerIconBtn}
            hitSlop={8}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </Pressable>
        )}

        <Pressable
          style={[styles.headerUsernameRow, { top: insets.top }]}
          hitSlop={8}
          onPress={() => isOwnProfile && setShowAccountSwitcher(true)}
        >
          {isProfilePrivate && (
            <Feather name="lock" size={16} color={colors.text} style={{ marginRight: 2 }} />
          )}
          <ThemedText style={[styles.headerUsername, { color: colors.text }]} numberOfLines={1}>
            {profileUser?.username}
          </ThemedText>
          {isOwnProfile && <Ionicons name="chevron-down" size={16} color={colors.text} style={{ marginTop: 2 }} />}
        </Pressable>

        {/* Right: Threads + Hamburger (own profile) or More (other profile) */}
        {isOwnProfile ? (
          <View style={styles.headerRightGroup}>
          <Pressable
            style={styles.headerIconBtn}
            hitSlop={8}
            onPress={() =>
              showToast({
                title: 'Threads',
                message: 'Threads application is not installed on this device.',
                type: 'info',
              })
            }
          >
            <MaterialCommunityIcons
              name="at"
              size={22}
              color={colors.text}
            />
          </Pressable>
          <Pressable style={styles.headerIconBtn} onPress={handleHamburger} hitSlop={8}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </Pressable>
        </View>
        ) : (
          <View style={styles.headerRightGroup}>
            <Pressable style={styles.headerIconBtn} hitSlop={8} onPress={handleMoreOptions}>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
            </Pressable>
          </View>
        )}
      </Animated.View>

      <GradientPullRefresh
        scrollY={scrollY}
        onRefresh={async () => {
          try {
            await Promise.all([
              refreshProfile(),
              fetchUserMedia(),
            ]);
          } catch (_) {}
        }}
      >
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
        >

        {/* ── Profile Info Row ── */}
        <Animated.View entering={FadeInDown.duration(350).delay(50)} style={styles.profileInfoRow}>
          <Pressable
            ref={avatarRef}
            style={({ pressed }) => [
              styles.avatarWrapper,
              { transform: [{ scale: pressed ? 0.96 : 1 }] }
            ]}
            onPress={handleAvatarPress}
            onLongPress={triggerShareModal}
            delayLongPress={180}
            hitSlop={4}
          >
            {userStoryGroup ? (
              userStoryGroup.isSeen ? (
                <View
                  style={[
                    styles.seenRingProfile,
                    {
                      width: 86,
                      height: 86,
                      borderRadius: 43,
                      borderColor: isDark ? '#38383a' : '#e1e1e1',
                    },
                  ]}
                >
                  {hasAvatar ? (
                    <Image source={{ uri: profileUser.avatar }} style={[styles.avatar, { width: 76, height: 76, borderRadius: 38 }]} />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        styles.avatarPlaceholder,
                        { width: 76, height: 76, borderRadius: 38, backgroundColor: isDark ? '#3A3A3C' : '#E8E8E8' },
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={46}
                        color={isDark ? '#636366' : '#A8A8A8'}
                        style={styles.avatarPersonIcon}
                      />
                    </View>
                  )}
                </View>
              ) : (
                <ExpoLinearGradient
                  colors={colors.storyRing as any}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.gradientRingProfile,
                    {
                      width: 86,
                      height: 86,
                      borderRadius: 43,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.innerRingProfile,
                      {
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    {hasAvatar ? (
                      <Image source={{ uri: profileUser.avatar }} style={[styles.avatar, { width: 76, height: 76, borderRadius: 38 }]} />
                    ) : (
                      <View
                        style={[
                          styles.avatar,
                          styles.avatarPlaceholder,
                          { width: 76, height: 76, borderRadius: 38, backgroundColor: isDark ? '#3A3A3C' : '#E8E8E8' },
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={46}
                          color={isDark ? '#636366' : '#A8A8A8'}
                          style={styles.avatarPersonIcon}
                        />
                      </View>
                    )}
                  </View>
                </ExpoLinearGradient>
              )
            ) : (
              // Regular avatar without stories
              hasAvatar ? (
                <Image source={{ uri: profileUser.avatar }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarPlaceholder,
                    { backgroundColor: isDark ? '#3A3A3C' : '#E8E8E8' },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={52}
                    color={isDark ? '#636366' : '#A8A8A8'}
                    style={styles.avatarPersonIcon}
                  />
                </View>
              )
            )}
            {isOwnProfile && !userStoryGroup && (
              <View style={[styles.storyPlusBadge, { backgroundColor: '#0095F6', borderColor: colors.background }]}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </View>
            )}
          </Pressable>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatBox
              count={profileUser.postsCount ?? 0}
              label="posts"
              textColor={colors.text}
              labelColor={colors.textSecondary}
              delay={80}
            />
            <StatBox
              count={profileUser.followersCount ?? 0}
              label="followers"
              textColor={colors.text}
              labelColor={colors.textSecondary}
              onPress={() => router.push({ pathname: '/connections', params: { tab: 'followers' } })}
              delay={120}
            />
            <StatBox
              count={profileUser.followingCount ?? 0}
              label="following"
              textColor={colors.text}
              labelColor={colors.textSecondary}
              onPress={() => router.push({ pathname: '/connections', params: { tab: 'following' } })}
              delay={160}
            />
          </View>
        </Animated.View>

        {/* ── Bio Block ── */}
        <Animated.View entering={FadeInDown.duration(350).delay(120)} style={styles.bioBlock}>
          <ThemedText style={[styles.displayName, { color: colors.text }]}>
            {profileUser.name || profileUser.username}
          </ThemedText>
          {hasBio ? (
            <ThemedText style={[styles.bioText, { color: colors.text }]}>{profileUser.bio}</ThemedText>
          ) : (
            <Pressable>
              <ThemedText style={styles.addBioLink}>Add bio</ThemedText>
            </Pressable>
          )}
          <Pressable style={styles.addBannersRow}>
            <Ionicons name="add" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.addBannersText, { color: colors.textSecondary }]}>
              Add banners
            </ThemedText>
          </Pressable>
        </Animated.View>

        {/* ── Action Buttons Row ── */}
        <Animated.View entering={FadeInDown.duration(350).delay(160)} style={styles.actionRow}>
          {isOwnProfile ? (
            <>
              <Pressable
                onPress={() => router.push('/edit-profile')}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: isDark ? '#262626' : '#EFEFEF' },
                  { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
              >
                <ThemedText style={[styles.actionBtnText, { color: colors.text }]}>Edit profile</ThemedText>
              </Pressable>
              <Pressable
                onPress={triggerShareModal}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: isDark ? '#262626' : '#EFEFEF' },
                  { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
              >
                <ThemedText style={[styles.actionBtnText, { color: colors.text }]}>Share profile</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setShowSuggestions(!showSuggestions)}
                style={[
                  styles.actionIconBtn,
                  {
                    backgroundColor: showSuggestions
                      ? (isDark ? '#3A3A3C' : '#DBDBDB')
                      : (isDark ? '#262626' : '#EFEFEF')
                  }
                ]}
              >
                <Ionicons
                  name={showSuggestions ? "person-add" : "person-add-outline"}
                  size={18}
                  color={colors.text}
                />
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.followBtnWrapper}>
                <FollowButton
                  targetUserId={viewUserId!}
                  initialIsFollowing={viewProfile?.isFollowing ?? false}
                  initialIsRequested={viewProfile?.isRequested ?? false}
                  isPrivate={viewProfile?.isPrivate ?? false}
                  size="medium"
                  variant="filled"
                  fullWidth
                  onFollowChange={(status, count) => {
                    setViewProfile(prev => prev ? {
                      ...prev,
                      isFollowing: status === 'following',
                      isRequested: status === 'requested',
                      followersCount: count ?? prev.followersCount,
                    } : prev);
                  }}
                />
              </View>
              <Pressable
                onPress={() => router.push({ pathname: '/(chat)/[id]', params: { id: viewUserId! } })}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: isDark ? '#262626' : '#EFEFEF' },
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <ThemedText style={[styles.actionBtnText, { color: colors.text }]}>Message</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.actionIconBtn, { backgroundColor: isDark ? '#262626' : '#EFEFEF' }]}
              >
                <Ionicons name="person-add-outline" size={18} color={colors.text} />
              </Pressable>
            </>
          )}
        </Animated.View>

        {/* Mutual followers row */}
        {!isOwnProfile && mutualFollowers.length > 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.mutualFollowersRow}>
            <View style={styles.mutualAvatarsStack}>
              {mutualFollowers.slice(0, 3).map((mf, idx) =>
                mf.avatarUrl ? (
                  <Image
                    key={mf.id}
                    source={{ uri: mf.avatarUrl }}
                    style={[styles.mutualAvatar, { left: idx * 14 }]}
                  />
                ) : (
                  <View
                    key={mf.id}
                    style={[
                      styles.mutualAvatar,
                      { left: idx * 14, backgroundColor: isDark ? '#3A3A3C' : '#E0E0E0', borderRadius: 11 },
                    ]}
                  />
                ),
              )}
            </View>
            <ThemedText
              style={[styles.mutualFollowersText, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {'Followed by '}
              <ThemedText style={{ color: colors.text, fontFamily: Fonts.semiBold, fontSize: 12 }}>
                {mutualFollowers[0]?.username}
              </ThemedText>
              {mutualFollowers.length > 1 && (
                <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {`, ${mutualFollowers[1]?.username}`}
                  {mutualTotal > 2 ? ` and ${mutualTotal - 2} more` : ''}
                </ThemedText>
              )}
            </ThemedText>
          </Animated.View>
        )}

        {/* ── Follow Suggestions ── */}
        {isOwnProfile && showSuggestions && suggestions.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(350)}
            exiting={FadeOut.duration(200)}
            layout={LinearTransition}
            style={styles.suggestionsSection}
          >
            <View style={styles.suggestionsSectionHeader}>
              <ThemedText style={[styles.suggestionsTitle, { color: colors.text }]}>
                Follow some accounts to get started
              </ThemedText>
              <Pressable onPress={() => setShowSuggestions(false)}>
                <ThemedText style={styles.seeAllLink}>See all</ThemedText>
              </Pressable>
            </View>
            <View
              onStartShouldSetResponderCapture={() => {
                setPagerScrollEnabled(false);
                return false;
              }}
              onTouchEnd={() => setPagerScrollEnabled(true)}
              onTouchCancel={() => setPagerScrollEnabled(true)}
            >
              <FlatList
                horizontal
                data={suggestions}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsList}
                nestedScrollEnabled={true}
                renderItem={({ item, index }) => (
                  <Animated.View entering={SlideInRight.duration(300).delay(index * 60)}>
                    <SuggestionCard
                      item={item}
                      onFollow={handleFollow}
                      onDismiss={handleDismiss}
                      colors={colors}
                      isDark={isDark}
                    />
                  </Animated.View>
                )}
              />
            </View>
          </Animated.View>
        )}

        {/* ── Tabs & Dropdown Wrapper ── */}
        <Animated.View layout={LinearTransition} style={{ zIndex: 10, position: 'relative' }}>
          {/* ── Content Tabs ── */}
          <Animated.View
            entering={FadeInDown.duration(350).delay(300)}
            style={[styles.contentTabsBar, { borderTopColor: isDark ? '#2C2C2E' : '#DBDBDB', borderBottomColor: isDark ? '#2C2C2E' : '#DBDBDB' }]}
          >
            {tabsList.map((tab) => {
              let icon;
              if (tab === 'posts') {
                icon = tabIcon('grid-outline', 'grid', 'posts');
              } else if (tab === 'reels') {
                icon = (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Image
                      source={require('@/assets/images/video.png')}
                      style={[
                        styles.tabImageIcon,
                        { tintColor: activeTab === 'reels' ? colors.text : colors.textSecondary }
                      ]}
                      resizeMode="contain"
                    />
                    {activeTab === 'reels' && (
                      <Ionicons
                        name={showReelsDropdown ? "chevron-up" : "chevron-down"}
                        size={12}
                        color={colors.text}
                      />
                    )}
                  </View>
                );
              } else if (tab === 'tagged') {
                icon = (
                  <Image
                    source={require('@/assets/images/profile.png')}
                    style={[
                      styles.tabImageIcon,
                      { tintColor: activeTab === 'tagged' ? colors.text : colors.textSecondary }
                    ]}
                    resizeMode="contain"
                  />
                );
              } else if (tab === 'saved') {
                icon = tabIcon('bookmark-outline', 'bookmark', 'saved');
              }

              return (
                <ContentTab
                  key={tab}
                  icon={icon}
                  isActive={activeTab === tab}
                  onPress={() => {
                    if (tab === 'reels' && activeTab === 'reels') {
                      setShowReelsDropdown(!showReelsDropdown);
                    } else {
                      handleTabPress(tab);
                    }
                  }}
                  colors={colors}
                />
              );
            })}
          </Animated.View>

          {/* ── Tab Underline Indicator ── */}
          <Animated.View
            style={[
              styles.tabUnderlineIndicator,
              underlineStyle,
            ]}
          >
            <View style={[styles.tabUnderlineLine, { backgroundColor: colors.text }]} />
          </Animated.View>

          {/* ── Reels Dropdown Menu ── */}
          {showReelsDropdown && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(100)}
              style={[
                styles.reelsDropdown,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  borderColor: isDark ? '#2C2C2E' : '#E5E5E5',
                  left: totalTabs === 4 ? '37.5%' : '50%',
                }
              ]}
            >
              {/* Option: Latest */}
              <Pressable
                onPress={() => {
                  setReelsSort('latest');
                  setShowReelsDropdown(false);
                }}
                style={styles.dropdownItem}
                android_ripple={{ color: isDark ? '#2C2C2E' : '#E5E5E5' }}
              >
                <ThemedText style={[styles.dropdownItemText, { color: colors.text }]}>
                  Latest
                </ThemedText>
                {reelsSort === 'latest' && (
                  <Ionicons name="checkmark" size={16} color={colors.text} />
                )}
              </Pressable>

              {/* Option: Most viewed */}
              <Pressable
                onPress={() => {
                  setReelsSort('most_viewed');
                  setShowReelsDropdown(false);
                }}
                style={styles.dropdownItem}
                android_ripple={{ color: isDark ? '#2C2C2E' : '#E5E5E5' }}
              >
                <ThemedText style={[styles.dropdownItemText, { color: colors.text }]}>
                  Most viewed
                </ThemedText>
                {reelsSort === 'most_viewed' && (
                  <Ionicons name="checkmark" size={16} color={colors.text} />
                )}
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── Content Area (ViewPager) ── */}
        <View
          style={styles.viewPager}
          onStartShouldSetResponderCapture={() => {
            setPagerScrollEnabled(false);
            return false;
          }}
          onTouchEnd={() => setPagerScrollEnabled(true)}
          onTouchCancel={() => setPagerScrollEnabled(true)}
        >
          <Animated.ScrollView
            ref={viewPagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandlerViewPager}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onViewPagerScrollEnd}
            contentContainerStyle={{ width: SCREEN_WIDTH * totalTabs }}
            nestedScrollEnabled={true}
          >
            {/* Page 1: Posts */}
            <View style={{ width: SCREEN_WIDTH }}>
              {hasPosts ? (
                <FlatList
                  data={userPosts}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  scrollEnabled={false}
                  renderItem={({ item }) => {
                    const hasMultipleMedia = item.media && item.media.length > 1;
                    const isVideo = item.media && item.media[0]?.mediaType === 'VIDEO';
                    return (
                      <Pressable
                        onPress={() => {
                          haptics.light();
                          router.push(`/post/${item.id}` as any);
                        }}
                        style={styles.gridItem}
                      >
                        <Image source={{ uri: item.media[0]?.mediaUrl }} style={styles.gridImage} />
                        {hasMultipleMedia && (
                          <View style={styles.gridBadge}>
                            <Feather name="layers" size={12} color="#FFFFFF" />
                          </View>
                        )}
                        {!hasMultipleMedia && isVideo && (
                          <View style={styles.gridBadge}>
                            <Ionicons name="play" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </Pressable>
                    );
                  }}
                />
              ) : (
                <Animated.View
                  entering={FadeInDown.duration(400).delay(100)}
                  layout={LinearTransition}
                  style={styles.emptyStateContainer}
                >
                  <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                    <Ionicons name="camera-outline" size={36} color={isDark ? '#555' : '#BDBDBD'} />
                  </View>
                  <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                    Create your first post
                  </ThemedText>
                  <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Make this space your own.
                  </ThemedText>
                  <Pressable
                    onPress={() => router.push('/create')}
                    style={styles.createButton}
                  >
                    <ThemedText style={styles.createButtonText}>Create</ThemedText>
                  </Pressable>
                </Animated.View>
              )}
            </View>

            {/* Page 2: Reels */}
            <View style={{ width: SCREEN_WIDTH }}>
              {hasReels ? (
                <FlatList
                  data={sortedReels}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => setSelectedReel(item)}
                      style={styles.reelGridItem}
                    >
                      <Image source={{ uri: item.imageUrl }} style={styles.reelGridImage} />
                      <View style={styles.reelViewsBadge}>
                        <Ionicons name="play-outline" size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
                        <ThemedText style={styles.reelViewsText}>{item.views}</ThemedText>
                      </View>
                    </Pressable>
                  )}
                />
              ) : (
                <Animated.View
                  entering={FadeInDown.duration(400).delay(80)}
                  layout={LinearTransition}
                  style={styles.emptyStateContainer}
                >
                  <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                    <Ionicons name="videocam-outline" size={36} color={isDark ? '#555' : '#BDBDBD'} />
                  </View>
                  <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                    Share your first reel
                  </ThemedText>
                  <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    {reelsSort === 'most_viewed'
                      ? 'Your most viewed short videos will appear here.'
                      : 'Short videos that inspire others.'}
                  </ThemedText>
                  <Pressable style={styles.createButton} onPress={() => router.push('/create')}>
                    <ThemedText style={styles.createButtonText}>Create reel</ThemedText>
                  </Pressable>
                </Animated.View>
              )}
            </View>

            {/* Page 3: Tagged */}
            <View style={{ width: SCREEN_WIDTH }}>
              {loadingTagged ? (
                <View style={styles.emptyStateContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : taggedPosts.length > 0 ? (
                <FlatList
                  data={taggedPosts}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  scrollEnabled={false}
                  renderItem={({ item }) => {
                    const thumb = item.media?.[0]?.mediaUrl ?? item.thumbnailUrl ?? '';
                    return (
                      <Pressable
                        style={styles.gridItem}
                        onPress={() => router.push(`/post/${item.id}` as any)}
                      >
                        <Image source={{ uri: thumb }} style={styles.gridImage} />
                        {item.media?.length > 1 && (
                          <View style={styles.multiMediaBadge}>
                            <Ionicons name="copy-outline" size={10} color="#FFF" />
                          </View>
                        )}
                      </Pressable>
                    );
                  }}
                />
              ) : (
                <Animated.View
                  entering={FadeInDown.duration(400).delay(80)}
                  layout={LinearTransition}
                  style={styles.emptyStateContainer}
                >
                  <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                    <Ionicons name="pricetag-outline" size={34} color={isDark ? '#555' : '#BDBDBD'} />
                  </View>
                  <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                    No tagged posts
                  </ThemedText>
                  <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    When people tag you, it'll appear here.
                  </ThemedText>
                </Animated.View>
              )}
            </View>

            {/* Page 4: Saved (only if own profile) */}
            {isOwnProfile && (
              <View style={{ width: SCREEN_WIDTH }}>
                {visibleSavedPosts.length > 0 ? (
                  <FlatList
                    data={visibleSavedPosts}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    scrollEnabled={false}
                    renderItem={({ item }) => {
                      const hasMultipleMedia = item.media && item.media.length > 1;
                      const isVideo = item.media && item.media[0]?.mediaType === 'VIDEO';
                      return (
                        <Pressable
                          onPress={() => {
                            haptics.light();
                            router.push(`/post/${item.id}` as any);
                          }}
                          style={styles.gridItem}
                        >
                          <Image source={{ uri: item.media[0]?.mediaUrl }} style={styles.gridImage} />
                          {hasMultipleMedia && (
                            <View style={styles.gridBadge}>
                              <Feather name="layers" size={12} color="#FFFFFF" />
                            </View>
                          )}
                          {!hasMultipleMedia && isVideo && (
                            <View style={styles.gridBadge}>
                              <Ionicons name="play" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </Pressable>
                      );
                    }}
                  />
                ) : (
                  <Animated.View
                    entering={FadeInDown.duration(400).delay(80)}
                    layout={LinearTransition}
                    style={styles.emptyStateContainer}
                  >
                    <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                      <Ionicons name="bookmark-outline" size={36} color={isDark ? '#555' : '#BDBDBD'} />
                    </View>
                    <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                      Save posts
                    </ThemedText>
                    <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                      Save photos and videos that you want to see again. No one will be notified, and only you can see what you've saved.
                    </ThemedText>
                  </Animated.View>
                )}
              </View>
            )}
          </Animated.ScrollView>
        </View>
      </Animated.ScrollView>
      </GradientPullRefresh>

      {/* ── Avatar Action Sheet ── */}
      <AvatarBottomSheet
        visible={showAvatarSheet}
        onClose={() => setShowAvatarSheet(false)}
        onSelectOption={(option) => {
          if (option === 'add_photo') {
            setShowAvatarSheet(false);
            // Open the photo options bottom sheet with a slight delay for smooth transition
            setTimeout(() => {
              setShowAddPhotoSheet(true);
            }, 280);
          } else if (option === 'add_story') {
            showToast({
              title: 'Coming soon',
              message: 'Story creation will be available shortly.',
              type: 'info',
            });
          }
        }}
      />

      {/* ── Add Photo Options Bottom Sheet ── */}
      <AddPhotoBottomSheet
        visible={showAddPhotoSheet}
        onClose={() => setShowAddPhotoSheet(false)}
        onSelectOption={(option) => {
          if (option === 'library') {
            setShowLibrarySelectModal(true);
          } else if (option === 'create_avatar') {
            showToast({
              title: 'Coming soon',
              message: 'Meta Avatar editor is under construction.',
              type: 'info',
            });
          } else {
            showToast({
              title: 'Coming soon',
              message: `${option.charAt(0).toUpperCase() + option.slice(1)} selection is coming soon.`,
              type: 'info',
            });
          }
        }}
      />

      {/* ── Library Select Modal ── */}
      <LibrarySelectModal
        visible={showLibrarySelectModal}
        onClose={() => setShowLibrarySelectModal(false)}
        onSelectPhoto={async (uri) => {
          try {
            const success = await updateProfile(user.name, user.bio, uri);
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

      {/* ── Account Switcher Bottom Sheet ── */}
      <AccountSwitcherSheet
        visible={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
        onAddAccount={() => {
          setShowAccountSwitcher(false);
        }}
        onAccountsCenter={() => {
          setShowAccountSwitcher(false);
        }}
      />

      {/* ── Create Bottom Sheet ── */}
      <CreateBottomSheet
        visible={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onSelectOption={(option) => {
          console.log('Selected option:', option);
          if (option === 'reel' || option === 'post') {
            router.push('/create');
          } else if (option === 'story') {
            handleAddStory();
          } else {
            Alert.alert(
              option.charAt(0).toUpperCase() + option.slice(1),
              `The ${option} creation feature is under development.`
            );
          }
        }}
      />

      <ShareProfileModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={user}
        colors={colors}
        isDark={isDark}
        sourceLayout={avatarLayout}
        onEditPhoto={() => {
          setShowShareModal(false);
          setTimeout(() => {
            setShowAddPhotoSheet(true);
          }, 300);
        }}
      />

      {/* Post Detail Modal */}
      {selectedPost && (
        <Modal
          visible={selectedPost !== null}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectedPost(null)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5E5' }]}>
              <Pressable onPress={() => setSelectedPost(null)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Posts</ThemedText>
              <View style={{ width: 40 }} />
            </View>
            
            {/* Detail Scroll */}
            <Animated.ScrollView showsVerticalScrollIndicator={false}>
              <PostCard
                post={selectedPost}
                onLikeToggle={onPostLikeToggle}
                onBookmarkToggle={() => {}}
                onAddComment={onPostCommentAdd}
              />
            </Animated.ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* Reel Detail Modal */}
      {selectedReel && (
        <Modal
          visible={selectedReel !== null}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectedReel(null)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: '#000000' }]} edges={['top', 'bottom']}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: '#2C2C2E', backgroundColor: '#000000' }]}>
              <Pressable onPress={() => setSelectedReel(null)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              <ThemedText style={[styles.modalTitle, { color: '#FFFFFF' }]}>Reels</ThemedText>
              <View style={{ width: 40 }} />
            </View>
            
            {/* Detail Content */}
            <View style={{ flex: 1, backgroundColor: '#000000' }}>
              <ReelItem
                reel={selectedReel}
                isActive={true}
                isScreenFocused={selectedReel !== null}
                onLikeToggle={onReelLikeToggle}
                height={Dimensions.get('window').height - 110}
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {/* ── Fullscreen Story Viewer ── */}
      <StoryPlayerModal
        visible={playerVisible}
        userGroups={stories}
        initialGroupIndex={selectedGroupIndex}
        onClose={() => setPlayerVisible(false)}
        onStoryViewed={viewStory}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    height: 50,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUsernameRow: {
    position: 'absolute',
    left: 80,
    right: 80,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  headerUsername: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── Profile Info
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 20,
  },
  avatarWrapper: {
    width: 86,
    height: 86,
    position: 'relative',
  },
  gradientRingProfile: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRingProfile: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  seenRingProfile: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  storyPlusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarPersonIcon: {
    marginTop: 10,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 70,
  },
  statCount: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    lineHeight: 22,
  },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 17,
  },

  // ── Bio
  bioBlock: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 2,
  },
  displayName: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    lineHeight: 20,
  },
  bioText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  addBioLink: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: '#0095F6',
  },
  addBannersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  addBannersText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },

  // ── Action buttons
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  followBtnWrapper: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionBtn: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
  },
  actionIconBtn: {
    width: 36,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Follow suggestions
  suggestionsSection: {
    marginBottom: 8,
  },
  suggestionsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    flex: 1,
    paddingRight: 8,
  },
  seeAllLink: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: '#0095F6',
  },
  suggestionsList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  suggestionCard: {
    width: 160,
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginTop: 4,
  },
  suggestionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  suggestionUsername: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    maxWidth: 110,
  },
  suggestionMutual: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    textAlign: 'center',
  },
  followButton: {
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  followButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
  },

  // ── Content tabs
  contentTabsBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    height: 44,
  },
  contentTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabUnderlineIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 1.5,
  },
  tabUnderlineLine: {
    height: 1.5,
    marginHorizontal: '15%',
    borderRadius: 1,
  },
  tabImageIcon: {
    width: 22,
    height: 22,
  },
  viewPager: {
    flex: 1,
    minHeight: 380,
  },
  reelsDropdown: {
    position: 'absolute',
    top: 44, // Sits right below the 44px tabs bar
    left: '50%',
    marginLeft: -90, // Center it under the Reels tab button (middle tab)
    width: 180,
    borderRadius: 14,
    borderWidth: 0.5,
    paddingVertical: 6,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
  },

  // ── Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // ── Empty state
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 28,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  createButton: {
    marginTop: 14,
    backgroundColor: '#0095F6',
    paddingHorizontal: 36,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  // ── Pull to refresh styles
  refreshBackgroundBar: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pullSpinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  refreshDrawer: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshSpinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Grid & Modals Custom Styles ──
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    padding: 0.5,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 3,
  },
  reelGridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE * 1.5,
    padding: 0.5,
    position: 'relative',
  },
  reelGridImage: {
    width: '100%',
    height: '100%',
  },
  reelViewsBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  reelViewsText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 10,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 48,
    borderBottomWidth: 0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  // ── Mutual followers ──
  mutualFollowersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  mutualAvatarsStack: {
    position: 'relative',
    width: 50,
    height: 24,
    flexShrink: 0,
  },
  mutualAvatar: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  mutualFollowersText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 16,
  },
  // ── Tagged grid item badge ──
  multiMediaBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    padding: 3,
  },
});
