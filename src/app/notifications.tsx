import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { NotificationItem } from '@/components/NotificationItem';
import { NotificationsSkeleton } from '@/components/Skeleton';
import { notificationService, Notification } from '@/services/notifications';
import { followService } from '@/services/follow';
import { useSocket } from '@/contexts/SocketContext';
import { useBadge } from '@/contexts/BadgeContext';
import { Fonts } from '@/constants/theme';

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { socket } = useSocket();
  const { clearNotifications } = useBadge();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchFollowRequests = useCallback(async () => {
    try {
      const res = await followService.getFollowRequests();
      if (res.success) {
        setFollowRequests(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch follow requests:', err);
    }
  }, []);

  const handleRespondRequest = async (requestId: string, accept: boolean) => {
    try {
      setFollowRequests(prev => prev.filter(r => r.id !== requestId));
      if (accept) {
        await followService.acceptFollowRequest(requestId);
      } else {
        await followService.declineFollowRequest(requestId);
      }
    } catch (err) {
      console.error('Failed to respond to follow request:', err);
    }
  };

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
      fetchFollowRequests();
    } else {
      setIsLoading(true);
    }

    try {
      const response = await notificationService.getNotifications(
        isRefresh ? undefined : cursor || undefined,
      );

      if (response.success) {
        if (isRefresh) {
          setNotifications(response.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.notifications]);
        }
        setCursor(response.nextCursor);
        setHasMore(!!response.nextCursor);

        // Mark all as read after viewing
        if (response.notifications.length > 0) {
          await notificationService.markAllAsRead();
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cursor, fetchFollowRequests]);

  useEffect(() => {
    fetchNotifications(true);
  }, []);

  // Clear the global badge count whenever this screen is focused
  useEffect(() => {
    clearNotifications();
  }, [clearNotifications]);

  useEffect(() => {
    if (!socket) return;

    const handleNotificationReceived = (notification: any) => {
      console.log('[NotificationsScreen] Real-time notification received:', notification);
      setNotifications((prev) => [notification, ...prev]);

      // Proactively mark as read since user is actively viewing this screen
      notificationService.markAsRead([notification.id]).catch((err) => {
        console.error('Failed to mark real-time notification as read:', err);
      });
    };

    socket.on('notificationReceived', handleNotificationReceived);

    return () => {
      socket.off('notificationReceived', handleNotificationReceived);
    };
  }, [socket]);

  const handleLoadMore = () => {
    if (hasMore && !isLoading && !isRefreshing && cursor) {
      fetchNotifications(false);
    }
  };

  const handleRefresh = () => {
    fetchNotifications(true);
  };

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <ThemedText type="subtitle" style={[styles.title, { color: colors.text }]}>
        Notifications
      </ThemedText>
      <View style={{ width: 40 }} />
    </Animated.View>
  );

  const renderEmpty = () => {
    if (isLoading) return <NotificationsSkeleton count={5} />;
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
          <Ionicons name="notifications-outline" size={48} color={isDark ? '#555' : '#BDBDBD'} />
        </View>
        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
          No notifications yet
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          When someone interacts with your content, you'll see it here.
        </ThemedText>
      </Animated.View>
    );
  };

  const renderFooter = () => {
    if (!hasMore || isRefreshing) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderFollowRequests = () => {
    if (followRequests.length === 0) return null;

    return (
      <View style={[styles.requestsSection, { borderBottomColor: isDark ? '#262626' : '#F2F2F7' }]}>
        <Pressable
          onPress={() => setShowRequests(prev => !prev)}
          style={styles.requestsHeader}
        >
          <View style={styles.requestsHeaderLeft}>
            <View style={styles.requestsBadge}>
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                {followRequests.length}
              </ThemedText>
            </View>
            <ThemedText type="smallBold" style={{ marginLeft: 10, color: colors.text }}>
              Follow Requests
            </ThemedText>
          </View>
          <Ionicons
            name={showRequests ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>

        {showRequests && (
          <Animated.View entering={FadeInDown.duration(200)} style={styles.requestsList}>
            {followRequests.map(req => (
              <View key={req.id} style={styles.requestRow}>
                {req.requester.avatarUrl ? (
                  <Image source={{ uri: req.requester.avatarUrl }} style={styles.requestAvatar} />
                ) : (
                  <View style={[styles.requestAvatar, { backgroundColor: isDark ? '#2C2C2E' : '#E0E0E0', alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="person" size={16} color={isDark ? '#636366' : '#AEAEB2'} />
                  </View>
                )}
                <View style={styles.requestInfo}>
                  <ThemedText type="smallBold" style={{ color: colors.text }}>
                    {req.requester.username}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    {req.requester.displayName || 'wants to follow you'}
                  </ThemedText>
                </View>
                <View style={styles.requestButtons}>
                  <Pressable
                    onPress={() => handleRespondRequest(req.id, true)}
                    style={[styles.actionBtn, styles.acceptBtn]}
                  >
                    <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>Accept</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRespondRequest(req.id, false)}
                    style={[styles.actionBtn, styles.declineBtn, { borderColor: isDark ? '#3E3E42' : '#DBDBDB' }]}
                  >
                    <ThemedText type="smallBold" style={{ color: colors.text }}>Decline</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {renderHeader()}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => {
              // Deep link based on notification type
              try {
                const type = item.type;
                if (type === 'LIKE_POST' || type === 'COMMENT_POST') {
                  if (item.postId) router.push(`/post/${item.postId}` as any);
                } else if (type === 'LIKE_REEL' || type === 'COMMENT_REEL') {
                  // Navigate to reels tab — reel detail route not yet implemented
                  router.push('/(tabs)/reels' as any);
                } else if (type === 'FOLLOW' || type === 'FOLLOW_REQUEST' || type === 'FOLLOW_REQUEST_ACCEPTED') {
                  if (item.actorId) router.push(`/profile?userId=${item.actorId}` as any);
                }
              } catch (err) {
                console.warn('[NotificationItem] Navigation failed:', err);
              }
            }}
          />
        )}
        ListHeaderComponent={renderFollowRequests}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 17,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  requestsSection: {
    borderBottomWidth: 0.5,
    paddingVertical: 4,
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  requestsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestsBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  requestsList: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  requestAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  requestInfo: {
    flex: 1,
    gap: 2,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#0095F6',
  },
  declineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
});
