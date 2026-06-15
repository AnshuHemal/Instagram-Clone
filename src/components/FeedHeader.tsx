import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, Modal, TouchableWithoutFeedback, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { InstagramLogo } from '@/components/InstagramLogo';
import { notificationService } from '@/services/notifications';
import { useSocket } from '@/contexts/SocketContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { usePosts } from '@/contexts/PostsContext';
import { Fonts } from '@/constants/theme';

export const FeedHeader: React.FC = () => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { feedType, setFeedType } = usePosts();
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const badgeScale = useSharedValue(1);
  const { socket } = useSocket();

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

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [])
  );

  useEffect(() => {
    if (!socket) return;

    const handleNotificationReceived = (notification: any) => {
      console.log('[FeedHeader] Real-time notification received:', notification);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notificationReceived', handleNotificationReceived);

    return () => {
      socket.off('notificationReceived', handleNotificationReceived);
    };
  }, [socket]);

  useEffect(() => {
    if (unreadCount > 0) {
      badgeScale.value = withSpring(1.2, { damping: 10, stiffness: 200 }, () => {
        badgeScale.value = withSpring(1, { damping: 10, stiffness: 200 });
      });
    }
  }, [unreadCount]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      {/* Left side: Plus button to create post */}
      <Pressable onPress={() => router.push('/create')} style={styles.iconButton}>
        <Ionicons name="add" size={30} color={colors.text} />
      </Pressable>

      {/* Center: Instagram Text Logo with filter dropdown */}
      <Pressable onPress={() => setShowDropdown(!showDropdown)} style={styles.logoPressable}>
        <InstagramLogo color={colors.text} />
        <Ionicons
          name={showDropdown ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.text}
          style={styles.chevronIcon}
        />
      </Pressable>

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

      {/* Filter Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.dropdownContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E5E5' }]}>
              {/* Option: For You */}
              <Pressable
                style={styles.dropdownOption}
                onPress={() => {
                  setFeedType('for_you');
                  setShowDropdown(false);
                }}
              >
                <Ionicons name="sparkles-outline" size={18} color={colors.text} style={{ marginRight: 8 }} />
                <ThemedText style={[styles.dropdownOptionText, feedType === 'for_you' && { fontFamily: Fonts.bold, color: colors.primary }]}>
                  For You
                </ThemedText>
                {feedType === 'for_you' && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} style={{ marginLeft: 'auto' }} />
                )}
              </Pressable>
              
              {/* Option: Following */}
              <Pressable
                style={styles.dropdownOption}
                onPress={() => {
                  setFeedType('following');
                  setShowDropdown(false);
                }}
              >
                <Ionicons name="people-outline" size={18} color={colors.text} style={{ marginRight: 8 }} />
                <ThemedText style={[styles.dropdownOptionText, feedType === 'following' && { fontFamily: Fonts.bold, color: colors.primary }]}>
                  Following
                </ThemedText>
                {feedType === 'following' && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} style={{ marginLeft: 'auto' }} />
                )}
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  logoPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chevronIcon: {
    marginLeft: 4,
    marginTop: 2,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 52, // sits right below the header
    left: '50%',
    marginLeft: -90, // centers the 180 width dropdown under the logo pressable
    width: 180,
    borderRadius: 12,
    borderWidth: 0.5,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownOptionText: {
    fontSize: 14,
  },
});
