import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Pressable, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';

export interface BannerNotification {
  id: string;
  type:
    | 'FOLLOW'
    | 'FOLLOW_REQUEST'
    | 'FOLLOW_REQUEST_ACCEPTED'
    | 'LIKE_POST'
    | 'LIKE_REEL'
    | 'COMMENT_POST'
    | 'COMMENT_REEL';
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  message: string;
  postId?: string | null;
  reelId?: string | null;
}

interface NotificationBannerProps {
  notification: BannerNotification | null;
  onDismiss: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      // Slide in
      translateY.value = withTiming(0, {
        duration: 350,
        easing: Easing.out(Easing.back(1.2)),
      });
      opacity.value = withTiming(1, { duration: 250 });

      // Auto-dismiss after 4 seconds
      const timeout = setTimeout(() => {
        dismissBanner();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [notification]);

  const dismissBanner = () => {
    translateY.value = withTiming(-120, { duration: 250, easing: Easing.in(Easing.ease) });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setVisible)(false);
      runOnJS(onDismiss)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (!notification) return;
    dismissBanner();

    // Navigate based on notification type
    if (notification.type === 'LIKE_POST' || notification.type === 'COMMENT_POST') {
      if (notification.postId) {
        router.push(`/post/${notification.postId}` as any);
      } else {
        router.push('/notifications');
      }
    } else if (notification.type === 'LIKE_REEL' || notification.type === 'COMMENT_REEL') {
      // Navigate to reels tab
      router.push({ pathname: '/(tabs)', params: { tab: 'reels' } });
    } else if (
      notification.type === 'FOLLOW' ||
      notification.type === 'FOLLOW_REQUEST' ||
      notification.type === 'FOLLOW_REQUEST_ACCEPTED'
    ) {
      router.push(`/profile?userId=${notification.actor.id}` as any);
    } else {
      router.push('/notifications');
    }
  };

  if (!visible || !notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'FOLLOW':
        return { name: 'person-add', color: '#0095F6' };
      case 'FOLLOW_REQUEST':
        return { name: 'person-add-outline', color: '#FF9500' };
      case 'FOLLOW_REQUEST_ACCEPTED':
        return { name: 'checkmark-circle', color: '#34C759' };
      case 'LIKE_POST':
      case 'LIKE_REEL':
        return { name: 'heart', color: '#FF3040' };
      case 'COMMENT_POST':
      case 'COMMENT_REEL':
        return { name: 'chatbubble', color: '#0095F6' };
      default:
        return { name: 'notifications', color: '#0095F6' };
    }
  };

  const icon = getIcon();

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.wrapper, { paddingTop: insets.top + 4 }]}
      pointerEvents="box-none"
    >
      <Pressable onPress={handlePress}>
        <Animated.View
          style={[
            styles.container,
            animatedStyle,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? '#2C2C2E' : '#E5E5E5',
              shadowColor: '#000',
            },
          ]}
        >
          {/* Actor Avatar */}
          <Image
            source={{
              uri: notification.actor.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            }}
            style={styles.avatar}
            contentFit="cover"
          />

          {/* Icon badge */}
          <View style={[styles.iconBadge, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <Ionicons name={icon.name as any} size={12} color={icon.color} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              <Text style={styles.boldText}>{notification.actor.username}</Text>
            </Text>
            <Text
              style={[styles.body, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {notification.message}
            </Text>
          </View>

          {/* Dismiss button */}
          <Pressable onPress={dismissBanner} hitSlop={8} style={styles.dismissBtn}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 64,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  iconBadge: {
    position: 'absolute',
    left: 36,
    bottom: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  boldText: {
    fontFamily: Fonts.bold,
  },
  body: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 8,
  },
});