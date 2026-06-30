/**
 * TabLayout
 *
 * Implements a production-level horizontal pager navigator for the main bottom bar
 * tabs (Home, Reels, Chat, Explore, Profile). Enables swipe-to-navigate left and
 * right with fluid Reanimated transitions, in addition to standard bottom tab bar taps.
 *
 * Features:
 * - Animated.ScrollView pager utilizing Native paging.
 * - Dynamic path segment checking to align with deep linking and standard router redirects.
 * - Lazy rendering: screens are mounted only when visited for optimal performance.
 * - Spring micro-animation on tab button clicks.
 * - Auto-pauses Reels audio/video when switching to other tabs.
 */

import { useSegments, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBadge } from '@/contexts/BadgeContext';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, Pressable, View, Text, Animated as RNAnimated, Dimensions, StyleSheet, BackHandler } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';

// Screen imports
import HomeScreen from './index';
import ReelsScreen from './reels';
import InboxScreen from './chat';
import ExploreScreen from './explore';
import ProfileScreen from './profile';
import { TabPagerProvider, useTabPager } from '@/contexts/TabPagerContext';
import { AccountSwitcherSheet } from '@/components/AccountSwitcherSheet';
import { haptics } from '@/utils/haptics';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tactile spring micro-animation for tab bar buttons
const TabBarButton = ({
  onPress,
  onLongPress,
  isActive,
  children,
}: {
  onPress: () => void;
  onLongPress?: () => void;
  isActive: boolean;
  children: React.ReactNode;
}) => {
  const scaleValue = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      RNAnimated.sequence([
        RNAnimated.timing(scaleValue, {
          toValue: 0.85,
          duration: 80,
          useNativeDriver: true,
        }),
        RNAnimated.spring(scaleValue, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={180}
      style={styles.tabButton}
    >
      <RNAnimated.View style={{ transform: [{ scale: scaleValue }], justifyContent: 'center', alignItems: 'center' }}>
        {children}
      </RNAnimated.View>
    </Pressable>
  );
};

type TabType = 'index' | 'reels' | 'chat' | 'explore' | 'profile';

export default function TabLayoutWrapper() {
  return (
    <TabPagerProvider>
      <TabLayout />
    </TabPagerProvider>
  );
}

function TabLayout() {
  const { pagerScrollEnabled } = useTabPager();
  const { colors } = useTheme();
  const { user, isLoading } = useAuth();
  const { notificationCount, chatCount, clearNotifications, clearChat } = useBadge();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];
  const { tab: tabParam } = useLocalSearchParams<{ tab: string }>();

  const [activeIndex, setActiveIndex] = useState(0);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  const scrollX = useSharedValue(0);
  const viewPagerRef = useRef<Animated.ScrollView>(null);

  // Sync route segments from outside (deep links, redirects)
  const lastSegment = segments[segments.length - 1];

  useEffect(() => {
    const routes: TabType[] = ['index', 'reels', 'chat', 'explore', 'profile'];
    
    // Check local search param tab first, then fall back to segment check
    let activeSegment: TabType = 'index';
    if (tabParam && routes.includes(tabParam as TabType)) {
      activeSegment = tabParam as TabType;
    } else {
      activeSegment = (!lastSegment || lastSegment === '(tabs)') ? 'index' : lastSegment as TabType;
    }
    const targetIndex = routes.indexOf(activeSegment);

    if (targetIndex !== -1 && targetIndex !== activeIndex) {
      setActiveIndex(targetIndex);
      viewPagerRef.current?.scrollTo({ x: targetIndex * SCREEN_WIDTH, animated: false });
    }
  }, [lastSegment, tabParam]);

  // Redirect to login if user is not authenticated, or to onboarding if mid-flow
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    if (!user.isOnboarded) {
      // User somehow landed on tabs before finishing onboarding — send them back
      const { getOnboardingRoute } = require('@/contexts/AuthContext');
      const targetRoute = getOnboardingRoute(user.onboardingStep);
      router.replace({ pathname: targetRoute as any, params: { isPhone: 'false' } });
    }
  }, [user, isLoading]);

  // Intercept Android hardware back button: go back to Home tab if on another tab, otherwise exit
  useEffect(() => {
    const handleBackButton = () => {
      // Only intercept if we are on the tabs screen itself
      const isOnTabs = segments.length === 1 && segments[0] === '(tabs)';
      if (!isOnTabs) {
        return false; // let normal navigation handle it (e.g. go back from connections)
      }

      if (activeIndex !== 0) {
        handleTabPress(0);
        return true; // prevent default back action
      }
      return false; // on home tab, let the default back action exit/close the app
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    return () => subscription.remove();
  }, [activeIndex, segments]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);

      // Update segment route path matching the active page index
      const routes = ['index', 'reels', 'chat', 'explore', 'profile'];
      router.setParams({ tab: routes[index] });
    }
  };

  // Calculate dynamic heights for safe area bottom spacing
  const paddingBottom = insets.bottom > 0 ? insets.bottom : 0;
  const tabHeight = 50 + insets.bottom;

  const activeColor = activeIndex === 1 ? '#FFFFFF' : colors.tabBarActive;
  const inactiveColor = activeIndex === 1 ? 'rgba(255, 255, 255, 0.4)' : colors.tabBarInactive;
  const tabBgColor = activeIndex === 1 ? '#000000' : colors.tabBarBackground;

  const tabBarStyle = useAnimatedStyle(() => {
    const isReels = activeIndex === 1;
    return {
      backgroundColor: withTiming(isReels ? '#000000' : colors.tabBarBackground, { duration: 220 }),
      borderTopColor: withTiming(isReels ? 'rgba(255, 255, 255, 0.12)' : colors.border, { duration: 220 }),
      borderTopWidth: 0.5,
      height: tabHeight,
      paddingBottom: paddingBottom,
      paddingTop: insets.bottom > 0 ? 8 : 0,
    };
  });

  if (isLoading || !user) {
    return null;
  }

  const handleTabPress = (index: number) => {
    haptics.onTabSwitch();
    setActiveIndex(index);
    viewPagerRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: false });
    const routes = ['index', 'reels', 'chat', 'explore', 'profile'];
    router.setParams({ tab: routes[index] });
    // Clear badge when user navigates to the relevant tab
    if (index === 2) clearChat();          // Chat tab
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={activeIndex === 1 ? 'light' : 'dark'} />
      {/* Horizontal Page Pager */}
      <Animated.ScrollView
        ref={viewPagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScrollEnd}
        scrollEnabled={pagerScrollEnabled}
        style={styles.pager}
        contentContainerStyle={{ width: SCREEN_WIDTH * 5 }}
        bounces={false}
        overScrollMode="never"
      >
        {/* Page 0: Home */}
        <View style={{ width: SCREEN_WIDTH, height: '100%', paddingBottom: activeIndex === 1 ? 0 : tabHeight }}>
          <ErrorBoundary><HomeScreen isTabActive={activeIndex === 0} /></ErrorBoundary>
        </View>

        {/* Page 1: Reels (Full screen underneath absolute tab bar) */}
        <View style={{ width: SCREEN_WIDTH, height: '100%', backgroundColor: '#000000' }}>
          <ErrorBoundary><ReelsScreen isTabActive={activeIndex === 1} /></ErrorBoundary>
        </View>

        {/* Page 2: Chat */}
        <View style={{ width: SCREEN_WIDTH, height: '100%', paddingBottom: activeIndex === 1 ? 0 : tabHeight }}>
          <ErrorBoundary><InboxScreen /></ErrorBoundary>
        </View>

        {/* Page 3: Explore */}
        <View style={{ width: SCREEN_WIDTH, height: '100%', paddingBottom: activeIndex === 1 ? 0 : tabHeight }}>
          <ErrorBoundary><ExploreScreen /></ErrorBoundary>
        </View>

        {/* Page 4: Profile */}
        <View style={{ width: SCREEN_WIDTH, height: '100%', paddingBottom: activeIndex === 1 ? 0 : tabHeight }}>
          <ErrorBoundary><ProfileScreen /></ErrorBoundary>
        </View>
      </Animated.ScrollView>

      {/* Floating Bottom Tab Bar */}
      <Animated.View style={[styles.tabBar, tabBarStyle]}>
        {/* Button 0: Home */}
        <TabBarButton onPress={() => handleTabPress(0)} isActive={activeIndex === 0}>
          <Image
            source={activeIndex === 0 
              ? require('@/assets/images/tabIcons/home_filled.svg') 
              : require('@/assets/images/tabIcons/home_outline.svg')
            }
            style={[styles.tabIcon, { tintColor: activeIndex === 0 ? activeColor : inactiveColor }]}
            contentFit="contain"
          />
        </TabBarButton>

        {/* Button 1: Reels */}
        <TabBarButton onPress={() => handleTabPress(1)} isActive={activeIndex === 1}>
          <Image
            source={activeIndex === 1 
              ? require('@/assets/images/tabIcons/reels_filled.png') 
              : require('@/assets/images/tabIcons/reels_outline.png')
            }
            style={[styles.tabIcon, { tintColor: activeIndex === 1 ? activeColor : inactiveColor }]}
            contentFit="contain"
          />
        </TabBarButton>

        {/* Button 2: Chat */}
        <TabBarButton onPress={() => handleTabPress(2)} isActive={activeIndex === 2}>
          <View style={styles.chatIconContainer}>
            <Image
              source={activeIndex === 2 
                ? require('@/assets/images/tabIcons/messenger_filled.png') 
                : require('@/assets/images/tabIcons/messenger_outline.png')
              }
              style={[styles.tabIcon, { tintColor: activeIndex === 2 ? activeColor : inactiveColor }]}
              contentFit="contain"
            />
            {chatCount > 0 && (
              <View style={[styles.badgeDot, { borderColor: tabBgColor }]}>
                {chatCount > 9 && (
                  <Text style={styles.badgeText}>{chatCount > 99 ? '99' : chatCount}</Text>
                )}
              </View>
            )}
          </View>
        </TabBarButton>

        {/* Button 3: Explore */}
        <TabBarButton onPress={() => handleTabPress(3)} isActive={activeIndex === 3}>
          <Ionicons
            name={activeIndex === 3 ? 'search' : 'search-outline'}
            size={24}
            color={activeIndex === 3 ? activeColor : inactiveColor}
          />
        </TabBarButton>

        {/* Button 4: Profile */}
        <TabBarButton
          onPress={() => handleTabPress(4)}
          onLongPress={() => setShowAccountSwitcher(true)}
          isActive={activeIndex === 4}
        >
          <View style={styles.profileIconContainer}>
            {user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: activeIndex === 4 ? 1.5 : 0,
                  borderColor: activeColor,
                }}
                contentFit="cover"
              />
            ) : (
              <Ionicons
                name={activeIndex === 4 ? 'person' : 'person-outline'}
                size={24}
                color={activeIndex === 4 ? activeColor : inactiveColor}
              />
            )}
            {notificationCount > 0 && (
              <View style={[styles.badgeDot, { borderColor: tabBgColor }]}>
                {notificationCount > 9 && (
                  <Text style={styles.badgeText}>{notificationCount > 99 ? '99' : notificationCount}</Text>
                )}
              </View>
            )}
          </View>
        </TabBarButton>
      </Animated.View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  chatIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3040',
    borderWidth: 1.5,
  },
  // Live badge dot — grows to show count when > 9
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#FF3040',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '800',
    lineHeight: 8,
  },
});
