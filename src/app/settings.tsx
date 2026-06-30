/**
 * Settings Screen — /settings
 * Rebuilt to match the modern Instagram "Settings and activity" layout.
 * Includes real-time search filtering, Meta Accounts Center, and custom bottom-sheet dashboards
 * for Archive, Your Activity, Time Management, Close Friends, and Crossposting.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter, Stack } from 'expo-router';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface SettingItem {
  id: string;
  icon?: string;
  iconType?: 'feather' | 'ionicons' | 'material' | 'antdesign';
  label: string;
  sublabel?: string;
  value?: string;
  route?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  blueDot?: boolean;
  color?: string;
}

interface SettingSection {
  title: string;
  showMetaLogo?: boolean;
  items: SettingItem[];
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false);

  useEffect(() => {
    setIsPrivate(user?.isPrivate ?? false);
  }, [user?.isPrivate]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [closeFriendsCount, setCloseFriendsCount] = useState(0);

  // Bottom Sheet States
  const [activeSheet, setActiveSheet] = useState<null | 'accounts_center' | 'archive' | 'activity' | 'time_management' | 'close_friends' | 'crossposting' | 'tablet'>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const finalizeDismiss = () => {
    setShowSheetModal(false);
    setActiveSheet(null);
  };

  const dismissSheet = () => {
    haptics.light();
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(finalizeDismiss)();
      }
    });
  };

  useEffect(() => {
    if (activeSheet !== null) {
      setShowSheetModal(true);
      translateY.value = SCREEN_HEIGHT;
      backdropOpacity.value = 0;
      translateY.value = withTiming(0, { duration: 280 });
      backdropOpacity.value = withTiming(1, { duration: 280 });
    }
  }, [activeSheet]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        const progress = Math.max(0, 1 - e.translationY / 300);
        backdropOpacity.value = progress;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 800) {
        backdropOpacity.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 180 }, (finished) => {
          if (finished) {
            runOnJS(finalizeDismiss)();
          }
        });
      } else {
        backdropOpacity.value = withTiming(1, { duration: 150 });
        translateY.value = withTiming(0, { duration: 150 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: `rgba(0, 0, 0, ${backdropOpacity.value * 0.5})`,
    };
  });

  // Time Management Settings
  const [dailyLimit, setDailyLimit] = useState<'off' | '30m' | '1h' | '2h'>('off');
  const [quietMode, setQuietMode] = useState(false);

  // Crossposting Settings
  const [fbShare, setFbShare] = useState(false);
  const [waShare, setWaShare] = useState(false);

  // Close Friends List (Mock Users)
  const [closeFriendsList, setCloseFriendsList] = useState([
    { id: '1', name: 'Alex Johnson', username: 'alex_j', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop', selected: false },
    { id: '2', name: 'Marcus Sterling', username: 'marcus_s', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop', selected: false },
    { id: '3', name: 'Sarah Vance', username: 'sarah_v', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop', selected: false },
    { id: '4', name: 'David Chen', username: 'david_c', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop', selected: false },
  ]);

  const handlePrivacyToggle = async (val: boolean) => {
    haptics.light();
    setIsPrivate(val);
    try {
      await api.patch('/auth/profile', { isPrivate: val });
    } catch {
      setIsPrivate(!val);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            haptics.medium();
            await logout();
            router.replace('/(auth)/login' as any);
          },
        },
      ],
    );
  };

  // Toggle close friend item
  const toggleCloseFriend = (id: string) => {
    haptics.light();
    setCloseFriendsList(prev => prev.map(friend => {
      if (friend.id === id) {
        return { ...friend, selected: !friend.selected };
      }
      return friend;
    }));
  };

  const saveCloseFriends = () => {
    const selectedCount = closeFriendsList.filter(f => f.selected).length;
    setCloseFriendsCount(selectedCount);
    dismissSheet();
    haptics.success();
  };

  // Archive Feed Data
  const archiveStories = useMemo(() => [
    { id: 's1', date: 'Jun 28', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&auto=format&fit=crop' },
    { id: 's2', date: 'Jun 24', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300&auto=format&fit=crop' },
    { id: 's3', date: 'May 18', image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300&auto=format&fit=crop' },
    { id: 's4', date: 'Apr 11', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&auto=format&fit=crop' },
  ], []);

  const handleOpenPlayStore = (packageName: string, appName: string) => {
    haptics.light();
    showToast({ message: `Opening ${appName}...`, type: 'info' });
    const webUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
    Linking.openURL(webUrl).catch(() => {
      showToast({ message: 'Could not open store link.', type: 'error' });
    });
  };

  // Settings Configuration Structure
  const sectionsData = useMemo<SettingSection[]>(() => {
    const handleComingSoon = (feature: string) => {
      haptics.light();
      showToast({ message: `${feature} is coming soon!`, type: 'info' });
    };

    return [
      {
        title: 'How you use Instagram',
        items: [
          { id: 'saved', icon: 'bookmark', iconType: 'feather', label: 'Saved', onPress: () => router.push({ pathname: '/(tabs)/profile', params: { tab: 'saved' } } as any) },
          { id: 'archive', icon: 'clock', iconType: 'feather', label: 'Archive', onPress: () => setActiveSheet('archive') },
          { id: 'activity', icon: 'activity', iconType: 'feather', label: 'Your activity', onPress: () => setActiveSheet('activity') },
          { id: 'notifications', icon: 'bell', iconType: 'feather', label: 'Notifications', onPress: () => router.push('/notification-preferences' as any) },
          { id: 'time', icon: 'hourglass-outline', iconType: 'ionicons', label: 'Time management', onPress: () => router.push('/time-management' as any) },
          { id: 'tablet', icon: 'tablet', iconType: 'feather', label: 'Instagram for tablets', onPress: () => setActiveSheet('tablet') },
        ],
      },
      {
        title: 'Who can see your content',
        items: [
          {
            id: 'privacy',
            icon: 'lock',
            iconType: 'feather',
            label: 'Account privacy',
            value: isPrivate ? 'Private' : 'Public',
            onPress: () => {
              haptics.light();
              router.push('/account-privacy' as any);
            }
          },
          { id: 'friends', icon: 'star', iconType: 'feather', label: 'Close Friends', value: String(closeFriendsCount), onPress: () => setActiveSheet('close_friends') },
          { id: 'crossposting', icon: 'share-2', iconType: 'feather', label: 'Crossposting', onPress: () => { haptics.light(); router.push('/sharing-across-apps' as any); } },
          { id: 'blocked', icon: 'slash', iconType: 'feather', label: 'Blocked', value: '0', onPress: () => handleComingSoon('Blocked accounts') },
          { id: 'story_live', icon: 'video', iconType: 'feather', label: 'Story, live and location', onPress: () => handleComingSoon('Story, live and location') },
          { id: 'friends_feed', icon: 'users', iconType: 'feather', label: 'Activity in Friends feed', onPress: () => { haptics.light(); router.push('/friends-feed-activity' as any); } },
        ],
      },
      {
        title: 'How others can interact with you',
        items: [
          { id: 'messages', icon: 'message-circle', iconType: 'feather', label: 'Messages and story replies', onPress: () => handleComingSoon('Messages and story replies') },
          { id: 'tags', icon: 'at-sign', iconType: 'feather', label: 'Tags and mentions', onPress: () => handleComingSoon('Tags and mentions') },
          { id: 'comments', icon: 'message-square', iconType: 'feather', label: 'Comments', onPress: () => handleComingSoon('Comments') },
          { id: 'sharing', icon: 'repeat', iconType: 'feather', label: 'Sharing', onPress: () => handleComingSoon('Sharing') },
          { id: 'restricted', icon: 'alert-circle', iconType: 'feather', label: 'Restricted', value: '0', onPress: () => handleComingSoon('Restricted accounts') },
          { id: 'limit', icon: 'alert-triangle', iconType: 'feather', label: 'Limit interactions', value: 'Off', onPress: () => handleComingSoon('Limit interactions') },
          { id: 'words', icon: 'type', iconType: 'feather', label: 'Hidden Words', onPress: () => handleComingSoon('Hidden Words') },
          { id: 'invite', icon: 'user-plus', iconType: 'feather', label: 'Follow and invite friends', onPress: () => handleComingSoon('Follow and invite friends') },
        ],
      },
      {
        title: 'What you see',
        items: [
          { id: 'favorites', icon: 'star', iconType: 'feather', label: 'Favorites', value: '0', onPress: () => handleComingSoon('Favorites') },
          { id: 'muted', icon: 'bell-off', iconType: 'feather', label: 'Muted accounts', value: '2', onPress: () => handleComingSoon('Muted accounts') },
          { id: 'content_pref', icon: 'sliders', iconType: 'feather', label: 'Content preferences', onPress: () => handleComingSoon('Content preferences') },
          { id: 'likes', icon: 'heart', iconType: 'feather', label: 'Like and share counts', onPress: () => handleComingSoon('Like and share counts') },
        ],
      },
      {
        title: 'Your app and media',
        items: [
          { id: 'permissions', icon: 'smartphone', iconType: 'feather', label: 'Device permissions', onPress: () => handleComingSoon('Device permissions') },
          { id: 'archiving', icon: 'download', iconType: 'feather', label: 'Archiving and downloading', onPress: () => handleComingSoon('Archiving and downloading') },
          { id: 'accessibility', icon: 'accessibility-outline', iconType: 'ionicons', label: 'Accessibility', onPress: () => handleComingSoon('Accessibility') },
          { id: 'language', icon: 'globe', iconType: 'feather', label: 'Language and translations', onPress: () => handleComingSoon('Language and translations') },
          { id: 'data_usage', icon: 'bar-chart-2', iconType: 'feather', label: 'Data usage and media quality', onPress: () => handleComingSoon('Data usage and media quality') },
          { id: 'website_perms', icon: 'globe', iconType: 'feather', label: 'App website permissions', onPress: () => { haptics.light(); router.push('/app-website-permissions' as any); } },
        ],
      },
      {
        title: 'Family Center',
        items: [
          { id: 'supervision', icon: 'people-outline', iconType: 'ionicons', label: 'Supervision for Teen Accounts', onPress: () => handleComingSoon('Supervision for Teen Accounts') },
        ],
      },
      {
        title: 'Your insights and tools',
        items: [
          { id: 'account_type', icon: 'bar-chart', iconType: 'feather', label: 'Account type and tools', onPress: () => { haptics.light(); router.push('/account-type-tools' as any); } },
          { id: 'subscriptions', icon: 'refresh-cw', iconType: 'feather', label: 'Subscriptions', onPress: () => handleComingSoon('Subscriptions') },
        ],
      },
      {
        title: 'Your orders and fundraisers',
        items: [
          { id: 'orders', icon: 'credit-card', iconType: 'feather', label: 'Orders and payments', onPress: () => handleComingSoon('Orders and payments') },
        ],
      },
      {
        title: 'More info and support',
        items: [
          { id: 'help', icon: 'help-circle', iconType: 'feather', label: 'Help', onPress: () => handleComingSoon('Help Center') },
          { id: 'meta_ai_support', icon: 'aperture', iconType: 'feather', label: 'Meta AI support assistant', onPress: () => handleComingSoon('Meta AI support assistant') },
          { id: 'privacy_center', icon: 'shield', iconType: 'feather', label: 'Privacy Center', onPress: () => Linking.openURL('https://privacycenter.instagram.com/policy/') },
          { id: 'status', icon: 'user', iconType: 'feather', label: 'Account Status', onPress: () => { haptics.light(); router.push('/account-status' as any); } },
          { id: 'about', icon: 'info', iconType: 'feather', label: 'About', onPress: () => { haptics.light(); router.push('/about' as any); } },
        ],
      },
      {
        title: 'Also from Meta',
        items: [
          {
            id: 'meta_ai',
            icon: 'aperture',
            iconType: 'feather',
            label: 'Meta AI',
            sublabel: 'Get answers, advice and generate images',
            blueDot: true,
            onPress: () => handleComingSoon('Meta AI')
          },
          {
            id: 'whatsapp',
            icon: 'logo-whatsapp',
            iconType: 'ionicons',
            label: 'WhatsApp',
            sublabel: 'Message privately with friends and family',
            onPress: () => handleOpenPlayStore('com.whatsapp', 'WhatsApp')
          },
          {
            id: 'edits',
            icon: 'video',
            iconType: 'feather',
            label: 'Edits',
            sublabel: 'Create videos with powerful editing tools',
            blueDot: true,
            onPress: () => handleOpenPlayStore('com.instagram.basel', 'Edits')
          },
          {
            id: 'threads',
            icon: 'at-sign',
            iconType: 'feather',
            label: 'Threads',
            sublabel: 'Share ideas and join conversations',
            onPress: () => handleOpenPlayStore('com.instagram.barcelona', 'Threads')
          },
          {
            id: 'facebook',
            icon: 'logo-facebook',
            iconType: 'ionicons',
            label: 'Facebook',
            sublabel: 'Explore things you love',
            onPress: () => handleOpenPlayStore('com.facebook.katana', 'Facebook')
          },
          {
            id: 'messenger',
            icon: 'message-circle',
            iconType: 'feather',
            label: 'Messenger',
            sublabel: 'Chat and share seamlessly with friends',
            onPress: () => handleOpenPlayStore('com.facebook.orca', 'Messenger')
          },
          {
            id: 'instants',
            icon: 'zap',
            iconType: 'feather',
            label: 'Instants',
            sublabel: 'Share photos with friends',
            onPress: () => handleOpenPlayStore('com.instagram.moonshot', 'Instants')
          },
        ]
      },
      {
        title: 'Login',
        items: [
          {
            id: 'add_account',
            label: 'Add account',
            color: '#0095F6',
            showChevron: false,
            onPress: () => handleComingSoon('Add account')
          },
          {
            id: 'logout',
            label: 'Log out',
            color: '#FF3B30',
            showChevron: false,
            onPress: handleLogout
          }
        ]
      }
    ];
  }, [isPrivate, closeFriendsCount, isLoggingOut, handleOpenPlayStore]);

  // Filtering settings items based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery) return sectionsData;
    return sectionsData
      .map(section => {
        const filteredItems = section.items.filter(item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return { ...section, items: filteredItems };
      })
      .filter(section => section.items.length > 0);
  }, [searchQuery, sectionsData]);

  // Render Row Icon helper
  const renderIcon = (iconName: string, type: 'feather' | 'ionicons' | 'material' | 'antdesign') => {
    const iconColor = isDark ? '#FFFFFF' : '#000000';
    if (type === 'feather') return <Feather name={iconName as any} size={20} color={iconColor} />;
    if (type === 'ionicons') return <Ionicons name={iconName as any} size={20} color={iconColor} />;
    if (type === 'material') return <MaterialCommunityIcons name={iconName as any} size={20} color={iconColor} />;
    return <AntDesign name={iconName as any} size={20} color={iconColor} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Settings and activity</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBox, { backgroundColor: isDark ? '#262626' : '#F2F2F7' }]}>
            <Ionicons name="search" size={18} color={isDark ? '#A8A8A8' : '#737373'} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              placeholderTextColor={isDark ? '#8E8E8F' : '#8E8E8F'}
              style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
            />
          </View>
        </View>

        {/* ─── META ACCOUNTS CENTER (Always rendered first if not searching) ─── */}
        {!searchQuery && (
          <View style={styles.accountsSection}>
            <View style={styles.accountsHeader}>
              <Text style={[styles.accountsTitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>Your account</Text>
              {/* Meta Branding */}
              <View style={styles.metaRow}>
                <Image
                  source={require('@/assets/images/meta.png')}
                  style={[
                    styles.metaIcon,
                    { tintColor: isDark ? '#FFFFFF' : '#0064E0' },
                  ]}
                  resizeMode="contain"
                />
                <Text style={[styles.metaText, { color: isDark ? '#FFFFFF' : '#0064E0' }]}>Meta</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setActiveSheet('accounts_center')}
              style={[styles.accountsRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.accountsIconContainer}>
                <Ionicons name="person-circle-outline" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountsLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Accounts Center</Text>
                <Text style={[styles.accountsSublabel, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                  Password, security, personal details, connected experiences, ad preferences
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8E8E8F" />
            </Pressable>

            {/* Solid grey separator band */}
            <View style={[styles.separatorBand, { backgroundColor: isDark ? '#121212' : '#F2F2F7' }]} />
          </View>
        )}

        {/* ─── GROUPED SECTIONS ─── */}
        {filteredSections.map((section, sIndex) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay(sIndex * 80).duration(400)}
          >
            <Text style={[styles.sectionTitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>{section.title}</Text>
            
            <View style={styles.sectionItems}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    haptics.light();
                    item.onPress?.();
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: pressed ? (isDark ? '#1A1A1A' : '#F5F5F5') : 'transparent',
                    }
                  ]}
                >
                  {item.icon && item.iconType && (
                    <View style={styles.rowIcon}>
                      {renderIcon(item.icon, item.iconType)}
                    </View>
                  )}
                  <View style={{ flex: 1, justifyContent: 'center', paddingVertical: item.sublabel ? 4 : 0 }}>
                    {item.id === 'logout' && isLoggingOut ? (
                      <ActivityIndicator size="small" color="#FF3B30" style={{ alignSelf: 'flex-start' }} />
                    ) : (
                      <Text 
                        style={[
                          styles.rowLabel, 
                          { 
                            flex: 0, 
                            color: item.color || (item.destructive ? '#FF3B30' : (isDark ? '#FFFFFF' : '#000000')) 
                          }
                        ]}
                      >
                        {item.label}
                      </Text>
                    )}
                    {item.sublabel && (
                      <Text style={[styles.rowSublabel, { color: isDark ? '#A8A8A8' : '#737373', marginTop: 2, fontSize: 13, fontFamily: Fonts.regular }]}>
                        {item.sublabel}
                      </Text>
                    )}
                  </View>
                  
                  {item.value && (
                    <Text style={[styles.rowValue, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                      {item.value}
                    </Text>
                  )}
                  {item.blueDot && (
                    <View style={styles.blueDot} />
                  )}
                  {item.showChevron !== false && (
                    <Ionicons name="chevron-forward" size={16} color="#8E8E8F" style={{ marginLeft: 6 }} />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Divider Band between sections */}
            {sIndex < filteredSections.length - 1 && (
              <View style={[styles.separatorBand, { backgroundColor: isDark ? '#121212' : '#F2F2F7' }]} />
            )}
          </Animated.View>
        ))}

      </ScrollView>

      {/* ────────────────────────────────────────────────────────────────────────
          DASHBOARD OVERLAY MODALS (PRODUCTION LEVEL DETAIL SHEETS)
      ──────────────────────────────────────────────────────────────────────── */}

      {/* Sheet Container Wrapper */}
      <Modal
        visible={showSheetModal}
        transparent={true}
        animationType="none"
        onRequestClose={dismissSheet}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Animated.View style={[styles.modalOverlay, backdropStyle]}>
            <Pressable style={styles.dismissOverlay} onPress={dismissSheet} />
            
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  styles.sheetContent,
                  { 
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    paddingBottom: insets.bottom + 100
                  },
                  sheetStyle
                ]}
              >
            {/* Grabber Handle */}
            <View style={[styles.grabber, { backgroundColor: isDark ? '#3A3A3C' : '#E0E0E0' }]} />

            {/* Header controls inside Sheet */}
            {activeSheet !== 'tablet' && (
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {activeSheet === 'accounts_center' && 'Accounts Center'}
                  {activeSheet === 'archive' && 'Archive'}
                  {activeSheet === 'activity' && 'Your activity'}
                  {activeSheet === 'time_management' && 'Time management'}
                  {activeSheet === 'close_friends' && 'Close Friends'}
                  {activeSheet === 'crossposting' && 'Crossposting'}
                </Text>
                <Pressable onPress={dismissSheet} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                </Pressable>
              </View>
            )}

            {activeSheet === 'tablet' ? (
              /* Tablet QR sheet — no ScrollView so container shrink-wraps */
              <View style={styles.tabletSheetBody}>
                <Image
                  source={require('@/assets/images/instagram_tablet_qr.png')}
                  style={styles.tabletQrImage}
                  resizeMode="contain"
                />
                <Text style={[styles.tabletTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  Get the Instagram tablet app
                </Text>
                <Text style={[styles.tabletDesc, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                  Use your tablet to scan the QR code and download Instagram from the Play Store.
                </Text>
                <Pressable
                  onPress={() => { haptics.success(); }}
                  style={({ pressed }) => [styles.tabletSaveBtn, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <Text style={styles.tabletSaveBtnText}>Save QR code</Text>
                </Pressable>
                 <Pressable
                  onPress={dismissSheet}
                  style={styles.tabletDoneBtn}
                >
                  <Text style={styles.tabletDoneBtnText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetBody}
              >
                
                {/* 1. Accounts Center Dashboard */}
                {activeSheet === 'accounts_center' && (
                  <View>
                    <View style={styles.accountsAlertPill}>
                      <Image
                        source={require('@/assets/images/meta.png')}
                        style={[
                          styles.metaIconLarge,
                          { tintColor: isDark ? '#FFFFFF' : '#0064E0' },
                        ]}
                        resizeMode="contain"
                      />
                      <Text style={[styles.accountsAlertText, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                        Manage connected experiences across Meta technologies like Facebook, Instagram, and Horizon.
                      </Text>
                    </View>
                    
                    <View style={styles.sheetList}>
                      {[
                        { title: 'Profiles', desc: 'Manage avatars, sync profile info', icon: 'people-outline' },
                        { title: 'Personal details', desc: 'Contact info, birthday, account ownership', icon: 'card-outline' },
                        { title: 'Password and security', desc: 'Change password, 2-factor, login alerts', icon: 'shield-checkmark-outline' },
                        { title: 'Ad preferences', desc: 'Manage ads topics, profile details used for ads', icon: 'logo-facebook' },
                      ].map(opt => (
                        <Pressable key={opt.title} style={styles.sheetRow}>
                          <Ionicons name={opt.icon as any} size={22} color={colors.primary} style={{ marginRight: 12 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.sheetRowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>{opt.title}</Text>
                            <Text style={[styles.sheetRowDesc, { color: isDark ? '#A8A8A8' : '#737373' }]}>{opt.desc}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#8E8E8F" />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* 2. Archive Dashboard */}
                {activeSheet === 'archive' && (
                  <View>
                    <Text style={[styles.archiveDescription, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                      Only you can see your archived stories and posts after they disappear.
                    </Text>
                    
                    <View style={styles.storiesGrid}>
                      {archiveStories.map(story => (
                        <View key={story.id} style={styles.archiveThumbnailWrapper}>
                          <Image source={{ uri: story.image }} style={styles.archiveThumbnail} />
                          <View style={styles.archiveDateBadge}>
                            <Text style={styles.archiveDateText}>{story.date}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 3. Your Activity Dashboard */}
                {activeSheet === 'activity' && (
                  <View>
                    <Text style={[styles.activitySubtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                      One place to manage your photos, comments, likes, and history.
                    </Text>

                    {/* Summary Card */}
                    <View style={[styles.activitySummaryCard, { backgroundColor: isDark ? '#262626' : '#F2F2F7' }]}>
                      <View style={styles.activitySummaryColumn}>
                        <Text style={[styles.activitySummaryNum, { color: isDark ? '#FFFFFF' : '#000000' }]}>142</Text>
                        <Text style={[styles.activitySummaryText, { color: isDark ? '#A8A8A8' : '#737373' }]}>Likes</Text>
                      </View>
                      <View style={styles.activitySummaryColumn}>
                        <Text style={[styles.activitySummaryNum, { color: isDark ? '#FFFFFF' : '#000000' }]}>38</Text>
                        <Text style={[styles.activitySummaryText, { color: isDark ? '#A8A8A8' : '#737373' }]}>Comments</Text>
                      </View>
                      <View style={styles.activitySummaryColumn}>
                        <Text style={[styles.activitySummaryNum, { color: isDark ? '#FFFFFF' : '#000000' }]}>219</Text>
                        <Text style={[styles.activitySummaryText, { color: isDark ? '#A8A8A8' : '#737373' }]}>Reels Watched</Text>
                      </View>
                    </View>

                    {/* Time Bar Chart */}
                    <Text style={[styles.activityChartTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Screen Time (Daily Average)</Text>
                    <View style={styles.chartContainer}>
                      {[
                        { day: 'M', min: 45 },
                        { day: 'T', min: 30 },
                        { day: 'W', min: 60 },
                        { day: 'T', min: 25 },
                        { day: 'F', min: 50 },
                        { day: 'S', min: 80 },
                        { day: 'S', min: 95 },
                      ].map(item => (
                        <View key={item.day} style={styles.chartCol}>
                          <View style={styles.chartTrack}>
                            <View style={[styles.chartFill, { height: `${(item.min / 100) * 100}%`, backgroundColor: colors.primary }]} />
                          </View>
                          <Text style={[styles.chartDay, { color: isDark ? '#A8A8A8' : '#737373' }]}>{item.day}</Text>
                          <Text style={styles.chartMin}>{item.min}m</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 4. Time Management Dashboard */}
                {activeSheet === 'time_management' && (
                  <View>
                    <View style={[styles.timeRow, { borderBottomColor: colors.divider }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.timeLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Set Daily Limit</Text>
                        <Text style={[styles.timeDesc, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                          We will remind you to close the app once you reach your daily limit.
                        </Text>
                      </View>
                      <View style={styles.timeSelector}>
                        {(['off', '30m', '1h', '2h'] as const).map(lim => (
                          <Pressable
                            key={lim}
                            onPress={() => {
                              haptics.light();
                              setDailyLimit(lim);
                            }}
                            style={[
                              styles.timePill,
                              {
                                backgroundColor: dailyLimit === lim ? colors.primary : (isDark ? '#262626' : '#F2F2F7'),
                              }
                            ]}
                          >
                            <Text style={[styles.timePillText, { color: dailyLimit === lim ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000') }]}>
                              {lim.toUpperCase()}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <View style={styles.timeRow}>
                      <View style={{ flex: 1, marginRight: 16 }}>
                        <Text style={[styles.timeLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Quiet Mode</Text>
                        <Text style={[styles.timeDesc, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                          Silence push notifications during study or sleep. Your status badge will show "In Quiet Mode".
                        </Text>
                      </View>
                      <Switch
                        value={quietMode}
                        onValueChange={val => {
                          haptics.light();
                          setQuietMode(val);
                        }}
                        trackColor={{ false: '#E0E0E0', true: colors.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>
                )}

                {/* 5. Close Friends Editor */}
                {activeSheet === 'close_friends' && (
                  <View>
                    <Text style={[styles.friendsSubtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                      We do not notify people when you add or remove them from this list.
                    </Text>
                    
                    <View style={styles.friendsList}>
                      {closeFriendsList.map(friend => (
                        <Pressable
                          key={friend.id}
                          onPress={() => toggleCloseFriend(friend.id)}
                          style={styles.friendRow}
                        >
                          <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.friendName, { color: isDark ? '#FFFFFF' : '#000000' }]}>{friend.name}</Text>
                            <Text style={[styles.friendUser, { color: isDark ? '#A8A8A8' : '#737373' }]}>@{friend.username}</Text>
                          </View>
                          <View style={[
                            styles.checkbox,
                            {
                              borderColor: friend.selected ? colors.primary : '#8E8E8F',
                              backgroundColor: friend.selected ? colors.primary : 'transparent',
                            }
                          ]}>
                            {friend.selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                          </View>
                        </Pressable>
                      ))}
                    </View>

                    <Pressable onPress={saveCloseFriends} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                      <Text style={styles.actionBtnText}>Done</Text>
                    </Pressable>
                  </View>
                )}

                {/* 6. Crossposting Settings */}
                {activeSheet === 'crossposting' && (
                  <View>
                    <Text style={[styles.friendsSubtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                      Automatically share your photos, stories, and reels across Meta platforms.
                    </Text>

                    <View style={styles.timeRow}>
                      <View style={{ flex: 1, marginRight: 16 }}>
                        <Text style={[styles.timeLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Share to Facebook</Text>
                        <Text style={[styles.timeDesc, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                          Auto-post feed posts and active stories directly to your linked Facebook profile.
                        </Text>
                      </View>
                      <Switch
                        value={fbShare}
                        onValueChange={val => { haptics.light(); setFbShare(val); }}
                        trackColor={{ false: '#E0E0E0', true: colors.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    <View style={styles.timeRow}>
                      <View style={{ flex: 1, marginRight: 16 }}>
                        <Text style={[styles.timeLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Share to WhatsApp status</Text>
                        <Text style={[styles.timeDesc, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                          Auto-share active stories directly to WhatsApp statuses.
                        </Text>
                      </View>
                      <Switch
                        value={waShare}
                        onValueChange={val => { haptics.light(); setWaShare(val); }}
                        trackColor={{ false: '#E0E0E0', true: colors.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>
                )}

              </ScrollView>
            )}
          </Animated.View>
          </GestureDetector>
        </Animated.View>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
    position: 'relative',
  },
  headerBackBtn: {
    position: 'absolute',
    left: 12,
    bottom: 8,
    padding: 6,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    padding: 0,
  },

  // Meta Accounts Center Section
  accountsSection: {
    paddingTop: 8,
  },
  accountsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  accountsTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    width: 20,
    height: 18,
    marginRight: 4,
  },
  metaIconLarge: {
    width: 24,
    height: 15,
    marginRight: 6,
  },
  metaText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  accountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  accountsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountsLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16.5,
    marginBottom: 3,
  },
  accountsSublabel: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },

  // Divider Band
  separatorBand: {
    height: 8,
    width: '100%',
  },

  // Sections
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionItems: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  rowValue: {
    fontFamily: Fonts.regular,
    fontSize: 15,
  },

  // Logout
  logoutContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#FF3B30',
  },

  // Modal Sheet overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    maxHeight: SCREEN_HEIGHT * 0.85,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    marginBottom: -100,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
  },
  sheetTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
  },
  closeBtn: {
    padding: 4,
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // 1. Accounts Center Inside modal
  accountsAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 100, 224, 0.08)',
    marginBottom: 16,
    gap: 8,
  },
  accountsAlertText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  sheetList: {
    gap: 16,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sheetRowLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    marginBottom: 2,
  },
  sheetRowDesc: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },

  // 2. Archive Stories Inside modal
  archiveDescription: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  archiveThumbnailWrapper: {
    width: (SCREEN_WIDTH - 50) / 2,
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  archiveThumbnail: {
    width: '100%',
    height: '100%',
  },
  archiveDateBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  archiveDateText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },

  // 3. Your Activity Inside modal
  activitySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  activitySummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  activitySummaryColumn: {
    alignItems: 'center',
  },
  activitySummaryNum: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    marginBottom: 4,
  },
  activitySummaryText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
  },
  activityChartTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 20,
  },
  chartCol: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 60) / 7,
  },
  chartTrack: {
    height: 80,
    width: 14,
    backgroundColor: 'rgba(128,128,128,0.15)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  chartFill: {
    width: '100%',
    borderRadius: 7,
  },
  chartDay: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  chartMin: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: '#8E8E8F',
  },

  // 4. Time Management
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  timeLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    marginBottom: 4,
  },
  timeDesc: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  timeSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  timePill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timePillText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },

  // 5. Close Friends Editor
  friendsSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  friendsList: {
    gap: 12,
    marginBottom: 24,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  friendName: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  friendUser: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 15,
  },

  // 7. Instagram for Tablets — QR Sheet
  tabletScrollBody: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  tabletSheetBody: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tabletQrImage: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    marginBottom: 24,
    borderRadius: 16,
  },
  tabletTitle: {
    fontFamily: Fonts.bold,
    fontSize: 19,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  tabletDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },
  tabletSaveBtn: {
    width: '100%',
    backgroundColor: '#3897F0',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3897F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabletSaveBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  tabletDoneBtn: {
    paddingTop: 4,
    paddingBottom: 0,
    paddingHorizontal: 16,
  },
  tabletDoneBtnText: {
    color: '#3897F0',
    fontFamily: Fonts.semiBold,
    fontSize: 15.5,
  },
  rowSublabel: {
    fontSize: 12.5,
    fontFamily: Fonts.regular,
  },
  blueDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#3797EF',
    marginLeft: 8,
    marginRight: 2,
    alignSelf: 'center',
  },
});
