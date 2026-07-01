import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Animated,
  Text,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabPager } from '@/contexts/TabPagerContext';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { haptics } from '@/utils/haptics';
import { api } from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';
import { NewMessageBottomSheet } from '@/components/NewMessageBottomSheet';
import { AccountSwitcherSheet } from '@/components/AccountSwitcherSheet';
import { MOCK_STORIES } from '@/constants/mockData';
import { useSharedValue } from 'react-native-reanimated';
import { GradientPullRefresh } from '@/components/GradientPullRefresh';
import { Fonts } from '@/constants/theme';

interface Partner {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
}

interface Conversation {
  id: string;
  isGroup: boolean;
  partner: Partner | null;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId: string | null;
  unreadCount: number;
}

// ─── Chat Skeleton ─────────────────────────────────────────────────────────

const ChatConversationSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const bg = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? '#1C1C1E' : '#F0F0F0', isDark ? '#2C2C2E' : '#E0E0E0'],
  });
  const Row = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, gap: 14 }}>
      <Animated.View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: bg as any }} />
      <View style={{ flex: 1, gap: 8 }}>
        <Animated.View style={{ width: '55%', height: 13, borderRadius: 6, backgroundColor: bg as any }} />
        <Animated.View style={{ width: '80%', height: 11, borderRadius: 5, backgroundColor: bg as any }} />
      </View>
      <Animated.View style={{ width: 36, height: 11, borderRadius: 5, backgroundColor: bg as any }} />
    </View>
  );
  return <View>{Array.from({ length: 7 }).map((_, i) => <Row key={i} />)}</View>;
};

const MOCK_CHAT_DATA: Conversation[] = [
  {
    id: 'mock-1',
    isGroup: false,
    partner: {
      id: 'user-harsh',
      username: 'Harsh',
      displayName: 'Harsh',
      avatarUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150',
      isOnline: true,
    },
    lastMessage: 'Sent a post by naughtyyhun',
    lastMessageTime: new Date(Date.now() - 12 * 3600000).toISOString(),
    lastMessageSenderId: 'user-harsh',
    unreadCount: 0,
  },
  {
    id: 'mock-2',
    isGroup: false,
    partner: {
      id: 'user-himanshi',
      username: '_himanshi_dudani_',
      displayName: '_himanshi_dudani_',
      avatarUrl: '',
      isOnline: false,
    },
    lastMessage: 'Ehhh esa thodi 😭😭',
    lastMessageTime: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    lastMessageSenderId: 'user-himanshi',
    unreadCount: 0,
  }
];

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { setPagerScrollEnabled } = useTabPager();
  const { socket, onlineUsers } = useSocket();
  const { user } = useAuth();
  const scrollY = useSharedValue(0);

  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CHAT_DATA);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [composeVisible, setComposeVisible] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [suggestedAccounts, setSuggestedAccounts] = useState([
    {
      id: 's-1',
      username: 'kataria_harshal_18',
      displayName: 'Harshal✨🏐',
      avatarUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=150',
      isFollowing: false,
    },
    {
      id: 's-2',
      username: 'jainil_1459',
      displayName: 'JAINIL kasodariya',
      avatarUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150',
      isFollowing: false,
    },
    {
      id: 's-3',
      username: 'darshu_.9011',
      displayName: 'Panchal Darshan 👑',
      avatarUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=150',
      isFollowing: false,
    }
  ]);

  const fetchConversations = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await api.get('/chat/conversations');
      if (res.data && res.data.data && res.data.data.length > 0) {
        setConversations(res.data.data);
      } else {
        setConversations(MOCK_CHAT_DATA);
      }
    } catch (err) {
      console.error('[InboxScreen] Failed to fetch conversations:', err);
      setConversations(MOCK_CHAT_DATA);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations(true);
  }, []);

  // Listen to live socket events for updates
  useEffect(() => {
    if (!socket) return;

    const handleInboxUpdated = (data: {
      conversationId: string;
      lastMessage: string;
      lastMessageTime: string;
      lastMessageSenderId: string;
    }) => {
      console.log('[InboxScreen] inboxUpdated received:', data);
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === data.conversationId);
        if (index === -1) {
          // Refresh list if conversation is new/not present
          fetchConversations(false);
          return prev;
        }

        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lastMessage: data.lastMessage,
          lastMessageTime: data.lastMessageTime,
          lastMessageSenderId: data.lastMessageSenderId,
        };

        // Re-sort desc by lastMessageTime
        return updated.sort(
          (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
      });
    };

    socket.on('inboxUpdated', handleInboxUpdated);

    return () => {
      socket.off('inboxUpdated', handleInboxUpdated);
    };
  }, [socket]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations(false);
  };

  const formatLastMessageTime = (isoString: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const now = new Date();

      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }

      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getPartnerPresence = (item: Conversation) => {
    if (!item.partner) return false;
    // Map socket online state, falling back to database value
    return onlineUsers[item.partner.id] ?? item.partner.isOnline ?? false;
  };

  // Filter conversations based on search text matching partner username or displayName
  const filteredChats = conversations.filter((chat) => {
    if (!chat.partner) return false;
    const term = search.toLowerCase();
    return (
      chat.partner.username.toLowerCase().includes(term) ||
      (chat.partner.displayName && chat.partner.displayName.toLowerCase().includes(term))
    );
  });

  // Extract online partners for the "Active Now" horizontal bar
  const onlinePartnersList = conversations
    .filter((c) => c.partner && getPartnerPresence(c))
    .map((c) => c.partner!);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomWidth: 0, paddingTop: insets.top, height: 50 + insets.top }]}>
        <View style={{ width: 32 }} />
        <Pressable style={styles.headerTitleRow} onPress={() => { haptics.light(); setShowAccountSwitcher(true); }}>
          <ThemedText style={styles.headerTitle} type="subtitle">
            {user?.username || 'insforgetester'}
          </ThemedText>
          <Ionicons name="chevron-down" size={16} color={colors.text} style={{ marginLeft: 4, marginTop: 2 }} />
        </Pressable>
        <Pressable style={styles.headerButton} onPress={() => { haptics.light(); router.push('/(chat)/new-message'); }}>
          <Feather name="edit" size={22} color={colors.text} />
        </Pressable>
      </View>

      <GradientPullRefresh
        scrollY={scrollY}
        onRefresh={async () => {
          await fetchConversations(false);
        }}
      >
        {loading ? (
          <ChatConversationSkeleton isDark={isDark} />
        ) : (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <View>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <View style={[styles.searchBar, { backgroundColor: isDark ? '#262626' : '#F0F2F5' }]}>
                    <Ionicons
                      name="search-outline"
                      size={18}
                      color={isDark ? '#8E8E8F' : '#8E8E8F'}
                      style={styles.searchIcon}
                    />
                    <TextInput
                      placeholder="Search or ask Meta AI"
                      placeholderTextColor={isDark ? '#8E8E8F' : '#8E8E8F'}
                      value={search}
                      onChangeText={setSearch}
                      style={[styles.searchInput, { color: colors.text }]}
                    />
                  </View>
                </View>

                {/* Notes and Map Section */}
                <View style={styles.notesSection}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.notesList}
                    onStartShouldSetResponderCapture={() => {
                      setPagerScrollEnabled(false);
                      return false;
                    }}
                    onTouchEnd={() => setPagerScrollEnabled(true)}
                    onTouchCancel={() => setPagerScrollEnabled(true)}
                  >
                    {/* Your Note */}
                    <View style={styles.noteItem}>
                      <View style={styles.avatarWrapper}>
                        {/* Thought Bubble */}
                        <View style={[styles.thoughtBubble, { backgroundColor: isDark ? '#262626' : '#FFFFFF', borderColor: isDark ? '#3A3A3C' : '#E5E5E5' }]}>
                          <Text numberOfLines={1} style={[styles.thoughtText, { color: colors.text }]}>Today in emojis...</Text>
                        </View>
                        <Image
                          source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }}
                          style={styles.noteAvatar}
                        />
                      </View>
                      <ThemedText style={styles.noteLabel}>Your note</ThemedText>
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={10} color="#FF3B30" />
                        <Text style={styles.locationText}>Location off</Text>
                      </View>
                    </View>

                    {/* Map */}
                    <View style={styles.noteItem}>
                      <View style={styles.avatarWrapper}>
                        <Image
                          source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=200' }}
                          style={styles.noteAvatar}
                        />
                      </View>
                      <ThemedText style={styles.noteLabel}>Map</ThemedText>
                    </View>
                  </ScrollView>
                </View>

                {/* Section Header Row */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Messages</Text>
                  <Pressable onPress={() => {}}>
                    <Text style={styles.blueLinkText}>Requests</Text>
                  </Pressable>
                </View>
              </View>
            }
            onScroll={(e) => {
              scrollY.value = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            bounces={false}
            overScrollMode="never"
            renderItem={({ item }) => {
              const partner = item.partner;
              if (!partner) return null;

              const isOnline = getPartnerPresence(item);

              return (
                <Pressable
                  onPress={() => router.push({ pathname: '/(chat)/[id]', params: { id: item.id } })}
                  style={({ pressed }) => [
                    styles.chatItem,
                    pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                  ]}
                >
                  <View style={styles.avatarWrapper}>
                    {partner.avatarUrl ? (
                      <Image
                        source={{ uri: partner.avatarUrl }}
                        style={styles.chatAvatar}
                      />
                    ) : (
                      <View style={[styles.chatAvatarPlaceholder, { backgroundColor: isDark ? '#262626' : '#EFEFEF' }]}>
                        <Ionicons name="person" size={28} color={isDark ? '#8E8E8F' : '#8E8E8F'} />
                      </View>
                    )}
                    {isOnline && <View style={[styles.onlineDot, { borderColor: colors.background }]} />}
                  </View>
                  <View style={styles.chatDetails}>
                    <ThemedText type="smallBold" style={{ color: colors.text }}>
                      {partner.displayName || partner.username}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      numberOfLines={1}
                      style={[
                        styles.lastMessageText,
                        { color: item.unreadCount > 0 ? colors.text : colors.textSecondary },
                        item.unreadCount > 0 && { fontWeight: 'bold' },
                      ]}
                    >
                      {item.lastMessage || 'No messages yet'}
                    </ThemedText>
                  </View>
                  <View style={styles.chatMeta}>
                    <ThemedText type="small" style={[styles.metaTime, { color: colors.textSecondary }]}>
                      {formatLastMessageTime(item.lastMessageTime)}
                    </ThemedText>
                    {item.unreadCount > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                        <ThemedText type="smallBold" style={styles.unreadText}>
                          {item.unreadCount}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={{ color: colors.textSecondary }}>No messages found.</ThemedText>
              </View>
            }
            ListFooterComponent={
              suggestedAccounts.length > 0 ? (
                <View style={styles.footerSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Accounts to follow</Text>
                    <Pressable onPress={() => {}}>
                      <Text style={styles.blueLinkText}>See all</Text>
                    </Pressable>
                  </View>
                  {suggestedAccounts.map((account) => (
                    <View key={account.id} style={styles.suggestionRow}>
                      <Image
                        source={{ uri: account.avatarUrl || 'https://ui-avatars.com/api/?name=U&size=80' }}
                        style={styles.suggestionAvatar}
                      />
                      <View style={styles.suggestionDetails}>
                        <Text style={[styles.suggestionUsername, { color: colors.text }]}>{account.username}</Text>
                        <Text style={[styles.suggestionName, { color: colors.textSecondary }]}>{account.displayName}</Text>
                      </View>
                      <Pressable
                        style={[styles.followBtn, account.isFollowing && { backgroundColor: isDark ? '#262626' : '#EFEFEF' }]}
                        onPress={() => {
                          haptics.light();
                          setSuggestedAccounts(prev => prev.map(a => a.id === account.id ? { ...a, isFollowing: !a.isFollowing } : a));
                        }}
                      >
                        <Text style={[styles.followBtnText, { color: account.isFollowing ? colors.text : '#FFFFFF' }]}>
                          {account.isFollowing ? 'Following' : 'Follow'}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.dismissBtn}
                        onPress={() => setSuggestedAccounts(prev => prev.filter(a => a.id !== account.id))}
                      >
                        <Ionicons name="close" size={18} color={isDark ? '#8E8E8F' : '#8E8E8F'} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null
            }
          />
        )}
      </GradientPullRefresh>

      {/* Compose Message Bottom Sheet */}
      <NewMessageBottomSheet
        visible={composeVisible}
        onClose={() => setComposeVisible(false)}
        onSelectUser={(conversationId) => {
          router.push({ pathname: '/(chat)/[id]', params: { id: conversationId } });
        }}
      />

      {/* Account Switcher Bottom Sheet */}
      <AccountSwitcherSheet
        visible={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
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
    paddingHorizontal: 15,
    height: 56,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  notesSection: {
    paddingVertical: 2,
  },
  notesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 20,
  },
  noteItem: {
    alignItems: 'center',
    width: 72,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  noteAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  thoughtBubble: {
    position: 'absolute',
    top: -12,
    left: -12,
    width: 96,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 5,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  thoughtText: {
    fontSize: 9.5,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  noteLabel: {
    fontSize: 12.5,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2.5,
  },
  locationText: {
    fontSize: 10.5,
    fontFamily: Fonts.medium,
    color: '#8E8E8F',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  blueLinkText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: '#0095F6',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chatAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  chatAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  lastMessageText: {
    marginTop: 3,
    fontSize: 14,
  },
  chatMeta: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  metaTime: {
    fontSize: 13,
    marginBottom: 5,
  },
  unreadBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  footerSection: {
    marginTop: 2,
    paddingBottom: 40,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  suggestionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  suggestionDetails: {
    flex: 1,
  },
  suggestionUsername: {
    fontSize: 14.5,
    fontFamily: Fonts.semiBold,
  },
  suggestionName: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followBtnText: {
    fontSize: 13.5,
    fontFamily: Fonts.semiBold,
  },
  dismissBtn: {
    padding: 6,
    marginLeft: 4,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CD964',
    borderWidth: 2,
  },
});
