import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  FlatList,
  ScrollView,
  Platform,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  withSpring,
  LinearTransition,
  FadeIn,
  FadeInDown,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { Skeleton } from '@/components/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── SVG Illustration ──────────────────────────────────────────────────────────

const ConnectionIllustration = () => (
  <View style={styles.illustrationContainer}>
    <Svg width={180} height={120} viewBox="0 0 180 120">
      {/* Orange curved base */}
      <Path
        d="M 20,95 Q 90,72 160,95 L 148,110 Q 90,92 32,110 Z"
        fill="#FF7E29"
        stroke="#000000"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* Left polaroid frame (rotated -15 deg) */}
      <Path
        d="M 32,45 L 62,35 L 72,65 L 42,75 Z"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* Left frame inner (pink) */}
      <Path
        d="M 37,47 L 57,40 L 65,58 L 45,65 Z"
        fill="#FF2E93"
        stroke="#000000"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Left frame figure */}
      <Circle cx={51} cy={52} r={4.5} fill="#FFB7DA" stroke="#000000" strokeWidth={1.5} />
      <Path d="M 44,65 C 44,59 58,59 58,65 Z" fill="#FFB7DA" stroke="#000000" strokeWidth={1.5} />
      
      {/* Middle polaroid frame (center) */}
      <Path
        d="M 75,30 L 125,30 L 125,75 L 75,75 Z"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* Middle frame inner (orange-yellow) */}
      <Path
        d="M 80,35 L 120,35 L 120,65 L 80,65 Z"
        fill="#FFC72C"
        stroke="#000000"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Middle frame figures */}
      <Circle cx={92} cy={48} r={5} fill="#FF2E93" stroke="#000000" strokeWidth={1.5} />
      <Path d="M 85,65 C 85,57 99,57 99,65 Z" fill="#FF2E93" stroke="#000000" strokeWidth={1.5} />
      <Circle cx={108} cy={48} r={5} fill="#FF2E93" stroke="#000000" strokeWidth={1.5} />
      <Path d="M 101,65 C 101,57 115,57 115,65 Z" fill="#FF2E93" stroke="#000000" strokeWidth={1.5} />

      {/* Right polaroid frame (rotated 15 deg) */}
      <Path
        d="M 128,35 L 158,45 L 148,75 L 118,65 Z"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* Right frame inner (pink) */}
      <Path
        d="M 133,40 L 153,47 L 145,65 L 125,58 Z"
        fill="#FF2E93"
        stroke="#000000"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Right frame figure */}
      <Circle cx={139} cy={52} r={4.5} fill="#FFB7DA" stroke="#000000" strokeWidth={1.5} />
      <Path d="M 132,65 C 132,59 146,59 146,65 Z" fill="#FFB7DA" stroke="#000000" strokeWidth={1.5} />
    </Svg>
  </View>
);

// ─── Types & Mock Data ─────────────────────────────────────────────────────────

interface ConnectionUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isVerified?: boolean;
  subText?: string;
  isFollowing: boolean;
  isSubscribed?: boolean;
}

const MOCK_FOLLOWERS_SUGGESTED: ConnectionUser[] = [
  {
    id: 'f1',
    username: 'anchalprajapati289',
    name: 'Anchal Prajapati',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    isFollowing: false,
  },
  {
    id: 'f2',
    username: 'bhuvan.bam22',
    name: 'Bhuvan Bam',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'f3',
    username: 'therock',
    name: 'Dwayne Johnson',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'f4',
    username: 'indians',
    name: 'INDIANS',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'f5',
    username: 'rockysharma07',
    name: 'Ashish Ranjan',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'f6',
    username: 'iamhussainmansuri',
    name: 'Hussain Mansuri',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    isVerified: true,
    isFollowing: false,
  },
];

const MOCK_FOLLOWING_SUGGESTED: ConnectionUser[] = [
  {
    id: 'fg1',
    username: 'hrithikroshan',
    name: 'Hrithik Roshan',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'fg2',
    username: 'youneszarou',
    name: 'Younes Zarou',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'fg3',
    username: 'rashmika_mandanna',
    name: 'Rashmika Mandanna',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'fg4',
    username: 'katrinakaif',
    name: 'Katrina Kaif',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'fg5',
    username: 'voompla',
    name: 'Voompla',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'fg6',
    username: 'janhvikapoor',
    name: 'Janhvi Kapoor',
    subText: 'Popular',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    isVerified: true,
    isFollowing: false,
  },
];

const MOCK_SUBSCRIPTIONS_SUGGESTED: ConnectionUser[] = [
  {
    id: 's1',
    username: 'exam_amplifier',
    name: 'Exam Amplifier | Govt J...',
    avatar: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150',
    isFollowing: false,
    isSubscribed: false,
  },
  {
    id: 's2',
    username: '_sumayela',
    name: 'شمانلہ 🕊️',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isFollowing: false,
    isSubscribed: false,
  },
  {
    id: 's3',
    username: 'luiz.e.leticia',
    name: 'Luiz Guilherme Segala S...',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    isFollowing: false,
    isSubscribed: false,
  },
  {
    id: 's4',
    username: 'aviationjobs_am',
    name: 'Aviación / Empleos / No...',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    isFollowing: false,
    isSubscribed: false,
  },
  {
    id: 's5',
    username: 'fiqihpernikahan',
    name: 'Fiqih Pernikahan - Kelas ...',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    isFollowing: false,
    isSubscribed: false,
  },
  {
    id: 's6',
    username: 'rookrides',
    name: 'rook rides',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    isFollowing: false,
    isSubscribed: false,
  },
  {
    id: 's7',
    username: 'chikaagustine27',
    name: 'Queen Chika Agustine ♛',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    isFollowing: false,
    isSubscribed: false,
  },
  {
    id: 's8',
    username: 'rajveer_00105909',
    name: 'Avinash Yadav',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isFollowing: false,
    isSubscribed: false,
  },
];

export default function ConnectionsScreen() {
  const router = useRouter();
  const { tab: initialTab } = useLocalSearchParams<{ tab: string }>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // Determine initial active index
  const getInitialIndex = () => {
    if (initialTab === 'following') return 1;
    if (initialTab === 'subscriptions') return 2;
    if (initialTab === 'flagged') return 3;
    return 0;
  };

  const [activeIndex, setActiveIndex] = useState(getInitialIndex);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  // Suggested Lists states
  const [followersSug, setFollowersSug] = useState<ConnectionUser[]>(MOCK_FOLLOWERS_SUGGESTED);
  const [followingSug, setFollowingSug] = useState<ConnectionUser[]>(MOCK_FOLLOWING_SUGGESTED);
  const [subSug, setSubSug] = useState<ConnectionUser[]>(MOCK_SUBSCRIPTIONS_SUGGESTED);

  const viewPagerRef = useRef<Animated.ScrollView>(null);
  const tabScrollViewRef = useRef<ScrollView>(null);

  // Plain JS ref — for scrollToTabButton (JS thread only)
  const measuredLayouts = useRef<{ x: number; width: number }[]>([]);

  // 8 individual scalar shared values — individual scalars ARE tracked by Reanimated worklets
  const tabX0 = useSharedValue(0);
  const tabX1 = useSharedValue(SCREEN_WIDTH / 4);
  const tabX2 = useSharedValue(SCREEN_WIDTH / 2);
  const tabX3 = useSharedValue((SCREEN_WIDTH / 4) * 3);
  const tabW0 = useSharedValue(SCREEN_WIDTH / 4);
  const tabW1 = useSharedValue(SCREEN_WIDTH / 4);
  const tabW2 = useSharedValue(SCREEN_WIDTH / 4);
  const tabW3 = useSharedValue(SCREEN_WIDTH / 4);

  // Called from onLayout — updates both the JS ref and the UI-thread scalars
  const updateTabLayout = useCallback((index: number, x: number, width: number) => {
    measuredLayouts.current[index] = { x, width };
    // Update the individual scalars so the worklet sees them immediately
    if (index === 0) { tabX0.value = x; tabW0.value = width; }
    else if (index === 1) { tabX1.value = x; tabW1.value = width; }
    else if (index === 2) { tabX2.value = x; tabW2.value = width; }
    else if (index === 3) { tabX3.value = x; tabW3.value = width; }
  }, []);

  // scrollX drives both paging and the live indicator position
  const scrollX = useSharedValue(activeIndex * SCREEN_WIDTH);

  // Live indicator — interpolates between measured tab positions as finger scrolls
  const underlineStyle = useAnimatedStyle(() => {
    const pos = scrollX.value / SCREEN_WIDTH; // 0..3 float

    let tx: number;
    let w: number;

    if (pos <= 0) {
      tx = tabX0.value; w = tabW0.value;
    } else if (pos <= 1) {
      tx = tabX0.value + (tabX1.value - tabX0.value) * pos;
      w  = tabW0.value + (tabW1.value - tabW0.value) * pos;
    } else if (pos <= 2) {
      const p = pos - 1;
      tx = tabX1.value + (tabX2.value - tabX1.value) * p;
      w  = tabW1.value + (tabW2.value - tabW1.value) * p;
    } else if (pos <= 3) {
      const p = pos - 2;
      tx = tabX2.value + (tabX3.value - tabX2.value) * p;
      w  = tabW2.value + (tabW3.value - tabW2.value) * p;
    } else {
      tx = tabX3.value; w = tabW3.value;
    }

    return { transform: [{ translateX: tx }], width: w };
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Sync when tab param changes while screen is mounted
  useEffect(() => {
    const targetIndex = getInitialIndex();
    if (targetIndex !== activeIndex) {
      setActiveIndex(targetIndex);
      viewPagerRef.current?.scrollTo({ x: targetIndex * SCREEN_WIDTH, animated: true });
    }
  }, [initialTab]);

  // Jump pager to the correct initial page BEFORE first paint — no flash, no setTimeout
  useLayoutEffect(() => {
    const targetIndex = getInitialIndex();
    if (targetIndex > 0) {
      // scrollTo with animated:false is synchronous enough before paint
      viewPagerRef.current?.scrollTo({ x: targetIndex * SCREEN_WIDTH, animated: false });
    }
  }, []);

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    viewPagerRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    scrollToTabButton(index);
  };

  const onScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
      scrollToTabButton(index);
    }
  };

  const scrollToTabButton = (index: number) => {
    const layout = measuredLayouts.current[index];
    if (layout && layout.width > 0) {
      tabScrollViewRef.current?.scrollTo({
        x: layout.x - SCREEN_WIDTH / 2 + layout.width / 2,
        animated: true,
      });
    }
  };


  const handleFollowToggle = (listType: 'followers' | 'following' | 'subs', id: string) => {
    if (listType === 'followers') {
      setFollowersSug(prev =>
        prev.map(item => (item.id === id ? { ...item, isFollowing: !item.isFollowing } : item))
      );
    } else if (listType === 'following') {
      setFollowingSug(prev =>
        prev.map(item => (item.id === id ? { ...item, isFollowing: !item.isFollowing } : item))
      );
    } else {
      setSubSug(prev =>
        prev.map(item => (item.id === id ? { ...item, isSubscribed: !item.isSubscribed } : item))
      );
    }
  };

  const handleDismiss = (listType: 'followers' | 'following', id: string) => {
    if (listType === 'followers') {
      setFollowersSug(prev => prev.filter(item => item.id !== id));
    } else {
      setFollowingSug(prev => prev.filter(item => item.id !== id));
    }
  };

  // Rendering individual suggested list cards
  const renderItemCard = ({ item, listType }: { item: ConnectionUser; listType: 'followers' | 'following' }) => {
    return (
      <Animated.View
        layout={LinearTransition}
        exiting={FadeOut.duration(200)}
        style={styles.cardRow}
      >
        <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
        
        <View style={styles.cardInfo}>
          <View style={styles.usernameRow}>
            <ThemedText style={[styles.usernameText, { color: colors.text, fontFamily: Fonts.semiBold }]}>
              {item.username}
            </ThemedText>
            {item.isVerified && (
              <MaterialCommunityIcons name="check-decagram" size={14} color="#0095F6" style={{ marginLeft: 3 }} />
            )}
          </View>
          <ThemedText style={[styles.nameText, { color: colors.textSecondary }]}>
            {item.name}
          </ThemedText>
          {item.subText && (
            <ThemedText style={[styles.subTextLabel, { color: colors.textSecondary }]}>
              {item.subText}
            </ThemedText>
          )}
        </View>

        <View style={styles.actionBlock}>
          <Pressable
            onPress={() => handleFollowToggle(listType, item.id)}
            style={[
              styles.actionBtn,
              item.isFollowing
                ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: isDark ? '#3A3A3C' : '#DBDBDB' }
                : { backgroundColor: '#3897F0' }
            ]}
          >
            <ThemedText
              style={[
                styles.actionBtnText,
                { color: item.isFollowing ? colors.text : '#FFFFFF' }
              ]}
            >
              {item.isFollowing ? 'Following' : 'Follow'}
            </ThemedText>
          </Pressable>
          
          <Pressable onPress={() => handleDismiss(listType, item.id)} style={styles.dismissBtn} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  const renderSubscriptionCard = ({ item }: { item: ConnectionUser }) => {
    return (
      <Animated.View style={styles.cardRow}>
        <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />

        <View style={styles.cardInfo}>
          <ThemedText style={[styles.usernameText, { color: colors.text, fontFamily: Fonts.semiBold }]}>
            {item.username}
          </ThemedText>
          <ThemedText style={[styles.nameText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.name}
          </ThemedText>
        </View>

        <Pressable
          onPress={() => handleFollowToggle('subs', item.id)}
          style={[
            styles.subActionBtn,
            item.isSubscribed
              ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: isDark ? '#3A3A3C' : '#DBDBDB' }
              : { backgroundColor: '#3897F0' }
          ]}
        >
          <ThemedText
            style={[
              styles.actionBtnText,
              { color: item.isSubscribed ? colors.text : '#FFFFFF' }
            ]}
          >
            {item.isSubscribed ? 'Subscribed' : 'Subscribe'}
          </ThemedText>
        </Pressable>
      </Animated.View>
    );
  };

  const renderListOrLoading = (data: any, listType: 'followers' | 'following', title: string, subtitle: string) => {
    if (!isReady) {
      return (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{ marginBottom: 4 }}>
              <Skeleton variant="user" />
            </View>
          ))}
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(300)}>
            <ConnectionIllustration />
            <ThemedText style={[styles.title, { color: colors.text, fontFamily: Fonts.bold }]}>
              {title}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </ThemedText>
            {data.length > 0 && (
              <ThemedText style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                Suggested for you
              </ThemedText>
            )}
          </Animated.View>
        }
        renderItem={({ item }) => renderItemCard({ item, listType })}
      />
    );
  };

  const renderSubscriptionsOrLoading = () => {
    if (!isReady) {
      return (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{ marginBottom: 4 }}>
              <Skeleton variant="user" />
            </View>
          ))}
        </View>
      );
    }
    return (
      <FlatList
        data={subSug}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(300)}>
            <ThemedText style={[styles.subSectionTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>
              Suggested subscriptions
            </ThemedText>
          </Animated.View>
        }
        renderItem={({ item }) => renderSubscriptionCard({ item })}
      />
    );
  };

  const renderFlaggedOrLoading = () => {
    if (!isReady) {
      return (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{ marginBottom: 4 }}>
              <Skeleton variant="user" />
            </View>
          ))}
        </View>
      );
    }
    return (
      <Animated.View entering={FadeInDown.duration(350)} style={styles.flaggedContainer}>
        <ThemedText style={[styles.titleFlagged, { color: colors.text, fontFamily: Fonts.bold }]}>
          No flagged requests
        </ThemedText>
        <ThemedText style={[styles.subtitleFlagged, { color: colors.textSecondary }]}>
          If profiles that are likely to be spam or irrelevant try to follow you, you can delete or confirm them here.{' '}
          <ThemedText style={styles.learnMoreLink}>Learn more.</ThemedText>
        </ThemedText>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5E5' }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/profile');
            }
          }}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
          {user?.username}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Scrollable Tab Bar ── */}
      <View style={[styles.tabBarContainer, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5E5' }]}>
        <ScrollView
          ref={tabScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {/* Tab 0: Followers */}
          <Pressable
            onPress={() => handleTabPress(0)}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              updateTabLayout(0, x, width);
              if (activeIndex === 0) {
                tabScrollViewRef.current?.scrollTo({
                  x: x - SCREEN_WIDTH / 2 + width / 2,
                  animated: false,
                });
              }
            }}
            style={styles.tabButton}
          >
            <ThemedText
              style={[
                styles.tabText,
                { color: activeIndex === 0 ? colors.text : colors.textSecondary },
                activeIndex === 0 && styles.tabTextActive,
              ]}
            >
              {user?.followersCount || 0} Followers
            </ThemedText>
          </Pressable>

          {/* Tab 1: Following */}
          <Pressable
            onPress={() => handleTabPress(1)}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              updateTabLayout(1, x, width);
              if (activeIndex === 1) {
                tabScrollViewRef.current?.scrollTo({
                  x: x - SCREEN_WIDTH / 2 + width / 2,
                  animated: false,
                });
              }
            }}
            style={styles.tabButton}
          >
            <ThemedText
              style={[
                styles.tabText,
                { color: activeIndex === 1 ? colors.text : colors.textSecondary },
                activeIndex === 1 && styles.tabTextActive,
              ]}
            >
              {user?.followingCount || 0} Following
            </ThemedText>
          </Pressable>

          {/* Tab 2: Subscriptions */}
          <Pressable
            onPress={() => handleTabPress(2)}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              updateTabLayout(2, x, width);
              if (activeIndex === 2) {
                tabScrollViewRef.current?.scrollTo({
                  x: x - SCREEN_WIDTH / 2 + width / 2,
                  animated: false,
                });
              }
            }}
            style={styles.tabButton}
          >
            <ThemedText
              style={[
                styles.tabText,
                { color: activeIndex === 2 ? colors.text : colors.textSecondary },
                activeIndex === 2 && styles.tabTextActive,
              ]}
            >
              Subscriptions
            </ThemedText>
          </Pressable>

          {/* Tab 3: Flagged */}
          <Pressable
            onPress={() => handleTabPress(3)}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              updateTabLayout(3, x, width);
              if (activeIndex === 3) {
                tabScrollViewRef.current?.scrollTo({
                  x: x - SCREEN_WIDTH / 2 + width / 2,
                  animated: false,
                });
              }
            }}
            style={styles.tabButton}
          >
            <ThemedText
              style={[
                styles.tabText,
                { color: activeIndex === 3 ? colors.text : colors.textSecondary },
                activeIndex === 3 && styles.tabTextActive,
              ]}
            >
              Flagged
            </ThemedText>
          </Pressable>

          {/* Animated Line Indicator */}
          <Animated.View
            style={[
              styles.underlineIndicator,
              { backgroundColor: colors.text },
              underlineStyle,
            ]}
          />
        </ScrollView>
      </View>

      {/* ── ViewPager Horizontal Lists Pager ── */}
      <Animated.ScrollView
        ref={viewPagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={{ width: SCREEN_WIDTH * 4 }}
        bounces={false}
        overScrollMode="never"
      >
        {/* Page 0: Followers */}
        <View style={{ width: SCREEN_WIDTH }}>
          {renderListOrLoading(
            followersSug,
            'followers',
            'Followers',
            "You'll see all the people who follow you here."
          )}
        </View>

        {/* Page 1: Following */}
        <View style={{ width: SCREEN_WIDTH }}>
          {renderListOrLoading(
            followingSug,
            'following',
            'People you follow',
            "Once you follow people, you'll see them here."
          )}
        </View>

        {/* Page 2: Subscriptions */}
        <View style={{ width: SCREEN_WIDTH }}>
          {renderSubscriptionsOrLoading()}
        </View>

        {/* Page 3: Flagged */}
        <View style={{ width: SCREEN_WIDTH }}>
          {renderFlaggedOrLoading()}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontFamily: Fonts.bold,
  },
  tabBarContainer: {
    height: 46,
    borderBottomWidth: 0.5,
  },
  tabBarScroll: {
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
  },
  tabButton: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13.5,
    fontFamily: Fonts.regular,
  },
  tabTextActive: {
    fontFamily: Fonts.semiBold,
  },
  underlineIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    borderRadius: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 28,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    paddingLeft: 16,
    marginBottom: 12,
    marginTop: 10,
  },
  subSectionTitle: {
    fontSize: 15,
    paddingLeft: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cardAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 13.5,
    lineHeight: 17,
  },
  nameText: {
    fontSize: 13,
    lineHeight: 16,
    marginTop: 1,
  },
  subTextLabel: {
    fontSize: 12,
    lineHeight: 15,
    marginTop: 1,
  },
  actionBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    paddingHorizontal: 20,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
  },
  subActionBtn: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  dismissBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flaggedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 150,
  },
  titleFlagged: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitleFlagged: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 19,
  },
  learnMoreLink: {
    color: '#3897F0',
    fontFamily: Fonts.semiBold,
  },
});
