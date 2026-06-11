import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { InstagramLogo } from '@/components/InstagramLogo';
import { notificationService } from '@/services/notifications';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming } from 'react-native-reanimated';

export const FeedHeader: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      badgeScale.value = withSpring(1.2, { damping: 10, stiffness: 200 }, () => {
        badgeScale.value = withSpring(1, { damping: 10, stiffness: 200 });
      });
    }
  }, [unreadCount]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      {/* Left side: Plus button to create post */}
      <Pressable onPress={() => router.push('/create')} style={styles.iconButton}>
        <Ionicons name="add" size={30} color={colors.text} />
      </Pressable>

      {/* Center: Instagram Text Logo */}
      <View style={styles.logoWrapper}>
        <InstagramLogo color={colors.text} />
      </View>

      {/* Right side: Notification Bell with unread count */}
      <Pressable
        onPress={() => router.push('/notifications')}
        style={styles.iconButton}
      >
        <View style={styles.badgeWrapper}>
          <Ionicons
            name={unreadCount > 0 ? "notifications" : "notifications-outline"}
            size={26}
            color={colors.text}
          />
          {unreadCount > 0 && (
            <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
              <View style={[styles.badgeDot, { backgroundColor: '#FF3040', borderColor: colors.background }]}>
                {unreadCount > 9 ? (
                  <View style={styles.badgeTextContainer}>
                    <View style={[styles.badgeText, { backgroundColor: '#FF3040' }]}>
                      <View style={styles.badgeTextInner}>
                        <Ionicons name="notifications" size={8} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.badgeDotInner} />
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 54,
    borderBottomWidth: 0.5,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  badgeTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  badgeTextInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
