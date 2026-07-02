import React, { useRef, useState } from 'react';
import { StyleSheet, View, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Notification } from '@/services/notifications';
import { timeAgo } from '@/utils/timeAgo';
import { useRouter } from 'expo-router';
import { followService } from '@/services/follow';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
  onDelete?: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;
  const swipeableRef = useRef<Swipeable>(null);

  const [isFollowingState, setIsFollowingState] = useState(notification.actor.isFollowing ?? false);

  const handleFollowPress = async () => {
    try {
      const previous = isFollowingState;
      setIsFollowingState(!previous);
      if (previous) {
        await followService.unfollowUser(notification.actor.id);
      } else {
        await followService.followUser(notification.actor.id);
      }
    } catch (err) {
      console.error('Failed to toggle follow in notification item:', err);
      setIsFollowingState(prev => !prev);
    }
  };

  const handleMessagePress = () => {
    router.push({
      pathname: '/(tabs)/chat',
      params: { userId: notification.actor.id, username: notification.actor.username }
    } as any);
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    try {
      if (notification.type === 'LIKE_POST' || notification.type === 'COMMENT_POST') {
        if (notification.postId) router.push(`/post/${notification.postId}` as any);
      } else if (notification.type === 'LIKE_REEL' || notification.type === 'COMMENT_REEL') {
        if (notification.reelId) {
          router.push(`/reel/${notification.reelId}` as any);
        } else {
          router.push('/(tabs)/reels' as any);
        }
      } else if (
        notification.type === 'FOLLOW' ||
        notification.type === 'FOLLOW_REQUEST' ||
        notification.type === 'FOLLOW_REQUEST_ACCEPTED'
      ) {
        router.push(`/profile?userId=${notification.actor.id}` as any);
      }
    } catch (err) {
      console.warn('[NotificationItem] Local navigation failed:', err);
    }
  };

  const renderRightActions = () => (
    <Pressable
      onPress={() => {
        swipeableRef.current?.close();
        onDelete?.(notification.id);
      }}
      style={styles.deleteAction}
    >
      <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
    </Pressable>
  );

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'FOLLOW':
        return <Ionicons name="person-add" size={16} color="#0095F6" />;
      case 'FOLLOW_REQUEST':
        return <Ionicons name="person-add-outline" size={16} color="#FF9500" />;
      case 'FOLLOW_REQUEST_ACCEPTED':
        return <Ionicons name="checkmark-circle" size={16} color="#34C759" />;
      case 'LIKE_POST':
      case 'LIKE_REEL':
        return <Ionicons name="heart" size={16} color="#FF3040" />;
      case 'COMMENT_POST':
      case 'COMMENT_REEL':
        return <Ionicons name="chatbubble" size={14} color="#0095F6" />;
      default:
        return null;
    }
  };

  const getAvatarBorder = () => {
    if (notification.type === 'FOLLOW') {
      return { borderColor: '#0095F6', borderWidth: 2 };
    }
    if (notification.type === 'FOLLOW_REQUEST') {
      return { borderColor: '#FF9500', borderWidth: 2 };
    }
    if (notification.type === 'FOLLOW_REQUEST_ACCEPTED') {
      return { borderColor: '#34C759', borderWidth: 2 };
    }
    return {};
  };

  const thumbnailUrl = notification.postThumbnailUrl || notification.reelThumbnailUrl;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
          onDelete?.(notification.id);
        }
      }}
      overshootRight={false}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.container,
            {
              backgroundColor: !notification.read
                ? (isDark ? '#1A1A1A' : '#F0F8FF')
                : 'transparent',
            },
          ]}
        >
          {/* Avatar */}
          <View style={[styles.avatarContainer, getAvatarBorder()]}>
            <Image
              source={{
                uri: notification.actor.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={[styles.iconBadge, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              {getNotificationIcon()}
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <ThemedText style={[styles.message, { color: colors.text }]} numberOfLines={2}>
              <ThemedText type="smallBold" style={{ color: colors.text }}>
                {notification.actor.username}
              </ThemedText>
              {' '}{notification.message}
            </ThemedText>
            <ThemedText style={[styles.time, { color: colors.textSecondary }]}>
              {timeAgo(notification.createdAt)}
            </ThemedText>
          </View>

          {/* Post/Reel thumbnail or Action button */}
          {notification.postId || notification.reelId ? (
            <View style={styles.thumbnailContainer}>
              {thumbnailUrl ? (
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={styles.thumbnail}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.thumbnailPlaceholder, { backgroundColor: isDark ? '#262626' : '#EFEFEF' }]}>
                  <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
                </View>
              )}
            </View>
          ) : (notification.type === 'FOLLOW' || notification.type === 'FOLLOW_REQUEST' || notification.type === 'FOLLOW_REQUEST_ACCEPTED') ? (
            <View style={styles.actionButtonContainer}>
              {isFollowingState ? (
                <Pressable
                  onPress={handleMessagePress}
                  style={({ pressed }) => [
                    styles.messageBtn,
                    { backgroundColor: isDark ? '#262626' : '#EFEFEF' },
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <ThemedText type="smallBold" style={{ color: colors.text }}>
                    Message
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleFollowPress}
                  style={({ pressed }) => [
                    styles.followBtn,
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    Follow
                  </ThemedText>
                </Pressable>
              )}
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  message: {},
  time: {
    fontSize: 12,
  },
  thumbnailContainer: {
    width: 44,
    height: 44,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
  thumbnailPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    minWidth: 80,
    backgroundColor: '#FF3040',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  followBtn: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
