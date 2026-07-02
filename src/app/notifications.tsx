import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, SectionList, Pressable, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, useSharedValue, SlideOutDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { NotificationItem } from '@/components/NotificationItem';
import { NotificationsSkeleton } from '@/components/Skeleton';
import { notificationService, Notification } from '@/services/notifications';
import { followService } from '@/services/follow';
import { useBadge } from '@/contexts/BadgeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { GradientPullRefresh } from '@/components/GradientPullRefresh';
import { groupNotificationsByPeriod, NotificationSection } from '@/utils/groupNotifications';

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { clearNotifications } = useBadge();
  const { showToast } = useToast();
  const scrollY = useSharedValue(0);
  const insets = useSafeAreaInsets();

  const [sections, setSections] = useState<NotificationSection[]>([]);
  const [flatNotifications, setFlatNotifications] = useState<Notification[]>([]);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

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
          setFlatNotifications(response.notifications);
          setSections(groupNotificationsByPeriod(response.notifications));
        } else {
          setFlatNotifications(prev => {
            const updated = [...prev, ...response.notifications];
            setSections(groupNotificationsByPeriod(updated));
            return updated;
          });
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

  const handleDeleteNotification = async (id: string) => {
    // Optimistic removal
    const snapshot = sections;
    const flatSnapshot = flatNotifications;
    setSections(prev =>
      prev
        .map(s => ({ ...s, data: s.data.filter(n => n.id !== id) }))
        .filter(s => s.data.length > 0),
    );
    setFlatNotifications(prev => prev.filter(n => n.id !== id));

    try {
      await notificationService.deleteNotification(id);
      showToast({ message: 'Notification deleted', type: 'success' });
    } catch {
      // Restore on failure
      setSections(snapshot);
      setFlatNotifications(flatSnapshot);
      showToast({ message: 'Failed to delete notification', type: 'error' });
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading && !isRefreshing && cursor) {
      fetchNotifications(false);
    }
  };

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(300)} style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={26} color={colors.text} />
      </Pressable>
      <ThemedText type="subtitle" style={[styles.headerTitle, { color: colors.text, fontSize: 20, marginLeft: 8 }]}>
        Notifications
      </ThemedText>
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

  const renderSectionHeader = ({ section }: { section: NotificationSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</ThemedText>
    </View>
  );

  const renderFollowRequests = () => {
    const count = followRequests.length;
    if (count === 0) return null;

    return (
      <View style={[styles.requestsSection, { borderBottomColor: isDark ? '#262626' : '#EFEFEF' }]}>
        <Pressable
          onPress={() => setShowRequests(prev => !prev)}
          style={styles.requestsHeader}
        >
          <View style={styles.requestsHeaderLeft}>
            <View style={[styles.requestsIconCircle, { backgroundColor: isDark ? '#262626' : '#F5F5F5', borderColor: colors.border }]}>
              <Ionicons name="person-add-outline" size={20} color={colors.text} />
              {count > 0 && (
                <View style={styles.requestsBadgeMini}>
                  <View style={styles.requestsBadgeMiniDot} />
                </View>
              )}
            </View>
            <View style={{ marginLeft: 14 }}>
              <ThemedText type="smallBold" style={{ fontSize: 15, color: colors.text }}>
                Follow requests
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: 2 }}>
                Approve or ignore requests
              </ThemedText>
            </View>
          </View>
          <View style={styles.requestsHeaderRight}>
            {count > 0 && (
              <View style={[styles.requestsCountBadge, { backgroundColor: '#0095F6' }]}>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 11 }}>
                  {count}
                </ThemedText>
              </View>
            )}
            <Ionicons
              name={showRequests ? 'chevron-up' : 'chevron-forward'}
              size={18}
              color={colors.textSecondary}
            />
          </View>
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

      <GradientPullRefresh
        scrollY={scrollY}
        onRefresh={async () => {
          await fetchNotifications(true);
        }}
      >
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onDelete={handleDeleteNotification}
              onPress={() => {
                try {
                  const type = item.type;
                  if (type === 'LIKE_POST' || type === 'COMMENT_POST') {
                    if (item.postId) router.push(`/post/${item.postId}` as any);
                  } else if (type === 'LIKE_REEL' || type === 'COMMENT_REEL') {
                    if (item.reelId) router.push(`/reel/${item.reelId}` as any);
                    else router.push('/(tabs)/reels' as any);
                  } else if (type === 'FOLLOW' || type === 'FOLLOW_REQUEST' || type === 'FOLLOW_REQUEST_ACCEPTED') {
                    if (item.actorId) router.push(`/profile?userId=${item.actorId}` as any);
                  }
                } catch (err) {
                  console.warn('[NotificationItem] Navigation failed:', err);
                }
              }}
            />
          )}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={renderFollowRequests}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={styles.listContent}
        />
      </GradientPullRefresh>

      {/* Floating Permission Notification Banner at the bottom */}
      {showBanner && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          exiting={SlideOutDown.duration(300)}
          style={[
            styles.bannerContainer,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#F5F6F8',
              paddingBottom: Platform.OS === 'android'
                ? (insets.bottom > 0 ? insets.bottom + 12 : 54)
                : Math.max(insets.bottom, 12),
              paddingTop: 12,
            }
          ]}
        >
          <View style={styles.bannerLeft}>
            <Ionicons name="notifications-off-outline" size={18} color={isDark ? '#8E8E93' : '#3E3E42'} />
            <ThemedText style={[styles.bannerText, { color: colors.text, fontSize: 13.5, marginLeft: 10 }]}>
              Your notifications are off.{' '}
              <ThemedText style={{ color: '#0095F6', fontWeight: '600', fontSize: 14 }}>
                Turn on
              </ThemedText>
            </ThemedText>
          </View>
          <Pressable onPress={() => setShowBanner(false)} style={styles.bannerCloseBtn} hitSlop={10}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </Animated.View>
      )}
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
    paddingHorizontal: 15,
    height: 56,
    borderBottomWidth: 0.5,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
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
    fontFamily: Fonts.semiBold,
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
  requestsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  requestsBadgeMini: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  requestsBadgeMiniDot: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  requestsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requestsCountBadge: {
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
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
    zIndex: 100,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerText: {
    fontFamily: Fonts.regular,
  },
  bannerCloseBtn: {
    padding: 2,
  },
});
