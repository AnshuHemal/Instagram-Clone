import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { NotificationItem } from '@/components/NotificationItem';
import { NotificationsSkeleton } from '@/components/Skeleton';
import { notificationService, Notification } from '@/services/notifications';
import { useSocket } from '@/contexts/SocketContext';
import { Fonts } from '@/constants/theme';

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
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
  }, [cursor]);

  useEffect(() => {
    fetchNotifications(true);
  }, []);

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
              // Handle notification press
            }}
          />
        )}
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
});
