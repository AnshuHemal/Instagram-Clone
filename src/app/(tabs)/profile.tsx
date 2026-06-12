import React, { useState, useCallback, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '@/contexts/ThemeContext';
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
import { MOCK_STORIES } from '@/constants/mockData';
import { FollowButton } from '@/components/FollowButton';
import { followService, UserProfileResponse } from '@/services/follow';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PullToRefreshSpinner = ({
  progress,
  size = 38,
  isDark,
}: {
  progress: SharedValue<number>;
  size?: number;
  isDark: boolean;
}) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - Math.min(1, progress.value));
    return {
      strokeDashoffset,
    };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="instaRefreshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4F5BD5" />
          <Stop offset="35%" stopColor="#962FBF" />
          <Stop offset="65%" stopColor="#D62976" />
          <Stop offset="100%" stopColor="#FA7E1E" />
        </LinearGradient>
      </Defs>
      {/* Background circle outline */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={isDark ? '#3A3A3C' : '#E5E5E5'}
        strokeWidth={strokeWidth}
        opacity={isDark ? 0.3 : 0.6}
        fill="none"
      />
      {/* Animated drawing circle */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#instaRefreshGrad)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        fill="none"
      />
    </Svg>
  );
};
import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = SCREEN_WIDTH / 3;

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileTab = 'posts' | 'reels' | 'tagged';

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
  const router = useRouter();
  const { userId: viewUserId } = useLocalSearchParams<{ userId?: string }>();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, refreshProfile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { setPagerScrollEnabled } = useTabPager();

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

  const isOwnProfile = !viewUserId || viewUserId === user?.id;

  const scrollY = useSharedValue(0);
  const viewPagerRef = useRef<Animated.ScrollView>(null);
  const viewPagerScrollX = useSharedValue(0);

  // ── Pull-to-refresh state ──
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingShared = useSharedValue(false);
  const refreshProgress = useSharedValue(0);
  const spinValue = useSharedValue(0);
  const refreshBarHeight = useSharedValue(0);

  // Fetch other user's profile
  useEffect(() => {
    if (viewUserId && viewUserId !== user?.id) {
      const fetchUserProfile = async () => {
        setIsViewLoading(true);
        try {
          const res = await followService.getUserProfile(viewUserId);
          if (res.success && res.user) {
            setViewProfile(res.user);
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

  // Gesture detection values
  const PULL_THRESHOLD = 80;
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dragY = useSharedValue(0);
  const gestureActive = useSharedValue(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshingShared.value) return;
    isRefreshingShared.value = true;
    setIsRefreshing(true);

    // Open animated bar and start spinner
    refreshBarHeight.value = withSpring(64, { damping: 14, stiffness: 180 });
    refreshProgress.value  = withTiming(1, { duration: 250 });
    spinValue.value = 0;
    spinValue.value = withRepeat(
      withTiming(360, { duration: 600, easing: Easing.linear }),
      -1,
      false
    );

    // Fetch fresh profile data from API
    try {
      await refreshProfile();
    } catch (_) {
      // silently swallow — refreshProfile already warns internally
    }

    // Collapse bar
    refreshBarHeight.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) });
    refreshProgress.value  = withTiming(0, { duration: 200 });
    spinValue.value        = 0;
    isRefreshingShared.value = false;
    runOnJS(setIsRefreshing)(false);
  }, [refreshProfile]);

  // Pan gesture — purely for pull detection, does NOT translate ScrollView
  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e) => {
      startX.value = e.changedTouches[0].x;
      startY.value = e.changedTouches[0].y;
      dragY.value = 0;
      gestureActive.value = false;
    })
    .onTouchesMove((e, state) => {
      if (gestureActive.value) return; // already active, let onUpdate handle it
      const dx = Math.abs(e.changedTouches[0].x - startX.value);
      const dy = e.changedTouches[0].y - startY.value;

      // Fail immediately on horizontal gestures to allow child horizontal scrolling
      if (dx > 10 && dx > Math.abs(dy)) {
        state.fail();
        return;
      }

      if (scrollY.value <= 0 && dy > 8 && !isRefreshingShared.value) {
        gestureActive.value = true;
        state.activate();
      } else if (scrollY.value > 0 || dy < -5) {
        state.fail();
      }
    })
    .onUpdate((e) => {
      if (!isRefreshingShared.value) {
        dragY.value = Math.max(0, e.translationY);
      }
    })
    .onEnd(() => {
      const pulled = dragY.value;
      dragY.value = 0;
      gestureActive.value = false;
      if (pulled > PULL_THRESHOLD && !isRefreshingShared.value) {
        runOnJS(handleRefresh)();
      }
    });

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
    const tabIndex = tab === 'posts' ? 0 : tab === 'reels' ? 1 : 2;
    viewPagerRef.current?.scrollTo({ x: tabIndex * SCREEN_WIDTH, animated: true });
  };

  const onViewPagerScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    const tabs: ProfileTab[] = ['posts', 'reels', 'tagged'];
    const newTab = tabs[pageIndex];
    if (newTab && activeTab !== newTab) {
      setActiveTab(newTab);
    }
  };

  const underlineStyle = useAnimatedStyle(() => {
    const translation = interpolate(
      viewPagerScrollX.value,
      [0, SCREEN_WIDTH, SCREEN_WIDTH * 2],
      [0, SCREEN_WIDTH / 3, (SCREEN_WIDTH / 3) * 2],
      Extrapolation.CLAMP
    );
    return {
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
    Alert.alert('Settings', '', [
      { text: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode', onPress: toggleTheme },
      { text: 'Log out', style: 'destructive', onPress: handleLogout },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (!user) return null;

  // Show skeleton when loading other user's profile
  if (!isOwnProfile && isViewLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  // ── Animated styles ──
  const pullProgress = useDerivedValue(() => refreshProgress.value);

  const refreshBarAnimStyle = useAnimatedStyle(() => ({
    height: isRefreshingShared.value
      ? refreshBarHeight.value
      : Math.min(refreshBarHeight.value, dragY.value * 0.55),
    overflow: 'hidden' as const,
  }));

  const spinnerAnimStyle = useAnimatedStyle(() => {
    const h = isRefreshingShared.value ? refreshBarHeight.value : dragY.value * 0.55;
    const opacity = interpolate(h, [0, 40], [0, 1], Extrapolation.CLAMP);
    const scale  = interpolate(h, [0, 44], [0.5, 1], Extrapolation.CLAMP);
    const dragRot = !isRefreshingShared.value ? interpolate(dragY.value, [0, PULL_THRESHOLD], [0, 360], Extrapolation.CLAMP) : 0;
    return {
      opacity,
      transform: [
        { scale },
        { rotate: `${isRefreshingShared.value ? spinValue.value : dragRot}deg` },
      ],
    };
  });



  const hasBio = !!(profileUser?.bio && profileUser.bio.trim());
  const hasAvatar = !!(profileUser?.avatar && profileUser.avatar.trim());
  const hasPosts = false; // Will be replaced with real API data

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
      edges={['top', 'left', 'right']}
    >
      {/* ── Reels Dropdown Backdrop ── */}
      {showReelsDropdown && (
        <Pressable
          style={[StyleSheet.absoluteFill, { zIndex: 998 }]}
          onPress={() => setShowReelsDropdown(false)}
        />
      )}
      {/* ── Sticky Header ── */}
      <Animated.View style={[styles.header, headerAnimStyle, { backgroundColor: colors.background }]}>
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

        {/* Center: username + chevron */}
        <Pressable
          style={styles.headerUsernameRow}
          hitSlop={8}
          onPress={() => isOwnProfile && setShowAccountSwitcher(true)}
        >
          <ThemedText style={[styles.headerUsername, { color: colors.text }]} numberOfLines={1}>
            {profileUser.username}
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
            <Pressable style={styles.headerIconBtn} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
            </Pressable>
          </View>
        )}
      </Animated.View>

      {/* ── Refresh bar (between header and content) ── */}
      <Animated.View style={[styles.refreshBackgroundBar, refreshBarAnimStyle]}>
        <Animated.View style={[styles.pullSpinnerContainer, spinnerAnimStyle]}>
          <PullToRefreshSpinner progress={pullProgress} isDark={isDark} />
        </Animated.View>
      </Animated.View>

      {/* ── Scrollable body (GestureDetector for pull-down detection only) ── */}
      <GestureDetector gesture={panGesture}>
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
            style={styles.avatarWrapper}
            onPress={openAvatarSheet}
            onLongPress={triggerShareModal}
            delayLongPress={180}
            hitSlop={4}
          >
            {hasAvatar ? (
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
            )}
            <View style={[styles.storyPlusBadge, { backgroundColor: '#000000', borderColor: colors.background }]}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </View>
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
              <FollowButton
                targetUserId={viewUserId!}
                initialIsFollowing={viewProfile?.isFollowing ?? false}
                size="large"
                variant="filled"
                showIcon
                onFollowChange={(following, count) => {
                  setViewProfile(prev => prev ? {
                    ...prev,
                    isFollowing: following,
                    followersCount: count ?? prev.followersCount,
                  } : prev);
                }}
              />
              <Pressable
                onPress={() => router.push({ pathname: '/(chat)/[id]', params: { id: viewUserId! } })}
                style={[styles.actionBtn, { backgroundColor: isDark ? '#262626' : '#EFEFEF' }]}
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
            <ContentTab
              icon={tabIcon('grid-outline', 'grid', 'posts')}
              isActive={activeTab === 'posts'}
              onPress={() => handleTabPress('posts')}
              colors={colors}
            />
            <ContentTab
              icon={
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
              }
              isActive={activeTab === 'reels'}
              onPress={() => {
                if (activeTab === 'reels') {
                  setShowReelsDropdown(!showReelsDropdown);
                } else {
                  handleTabPress('reels');
                }
              }}
              colors={colors}
            />
            <ContentTab
              icon={
                <Image
                  source={require('@/assets/images/profile.png')}
                  style={[
                    styles.tabImageIcon,
                    { tintColor: activeTab === 'tagged' ? colors.text : colors.textSecondary }
                  ]}
                  resizeMode="contain"
                />
              }
              isActive={activeTab === 'tagged'}
              onPress={() => handleTabPress('tagged')}
              colors={colors}
            />
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
            contentContainerStyle={{ width: SCREEN_WIDTH * 3 }}
            nestedScrollEnabled={true}
          >
            {/* Page 1: Posts */}
            <View style={{ width: SCREEN_WIDTH }}>
              {hasPosts ? (
                <View style={styles.gridContainer}>
                  {/* Real posts would go here */}
                </View>
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
                <Pressable style={styles.createButton}>
                  <ThemedText style={styles.createButtonText}>Create reel</ThemedText>
                </Pressable>
              </Animated.View>
            </View>

            {/* Page 3: Tagged */}
            <View style={{ width: SCREEN_WIDTH }}>
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
            </View>
          </Animated.ScrollView>
        </View>
      </Animated.ScrollView>
      </GestureDetector>

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
    fontFamily: Fonts.bold,
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
    fontFamily: Fonts.bold,
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
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
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
    width: SCREEN_WIDTH / 3,
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
    fontFamily: Fonts.bold,
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
});
