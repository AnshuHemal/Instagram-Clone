import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabPager } from '@/contexts/TabPagerContext';
import { ThemedText } from '@/components/themed-text';
import { api } from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';
import { NewMessageBottomSheet } from '@/components/NewMessageBottomSheet';
import { MOCK_STORIES } from '@/constants/mockData';

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

export default function InboxScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { setPagerScrollEnabled } = useTabPager();
  const { socket, onlineUsers } = useSocket();

  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [composeVisible, setComposeVisible] = useState(false);

  const fetchConversations = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await api.get('/chat/conversations');
      if (res.data) {
        setConversations(res.data);
      }
    } catch (err) {
      console.error('[InboxScreen] Failed to fetch conversations:', err);
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
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.headerTitle} type="subtitle">
          Messages
        </ThemedText>
        <Pressable style={styles.headerButton} onPress={() => setComposeVisible(true)}>
          <Feather name="edit" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#121212' : '#F0F0F0' }]}>
          <Ionicons
            name="search-outline"
            size={18}
            color={isDark ? '#8E8E8F' : '#8E8E8F'}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search"
            placeholderTextColor={isDark ? '#8E8E8F' : '#8E8E8F'}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      {/* Active Users Horizontal Scroll */}
      <View style={[styles.activeUsersSection, { borderBottomColor: colors.border }]}>
        <View
          onStartShouldSetResponderCapture={() => {
            setPagerScrollEnabled(false);
            return false;
          }}
          onTouchEnd={() => setPagerScrollEnabled(true)}
          onTouchCancel={() => setPagerScrollEnabled(true)}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeUsersList}
            nestedScrollEnabled={true}
          >
            {onlinePartnersList.length > 0 ? (
              onlinePartnersList.map((partner) => (
                <View key={partner.id} style={styles.activeUserContainer}>
                  <View style={styles.avatarWrapper}>
                    <Image
                      source={{
                        uri:
                          partner.avatarUrl ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                      }}
                      style={styles.activeAvatar}
                    />
                    <View style={[styles.onlineDot, { borderColor: colors.background }]} />
                  </View>
                  <ThemedText
                    type="small"
                    numberOfLines={1}
                    style={[styles.activeUsername, { color: colors.textSecondary }]}
                  >
                    {partner.username}
                  </ThemedText>
                </View>
              ))
            ) : (
              // Fallback to MOCK_STORIES if no active conversations are online
              MOCK_STORIES.map((story) => (
                <View key={story.id} style={styles.activeUserContainer}>
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: story.avatar }} style={styles.activeAvatar} />
                    <View style={[styles.onlineDot, { borderColor: colors.background }]} />
                  </View>
                  <ThemedText
                    type="small"
                    numberOfLines={1}
                    style={[styles.activeUsername, { color: colors.textSecondary }]}
                  >
                    {story.username}
                  </ThemedText>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* Chat List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0064E0" />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0064E0" />
          }
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
                  <Image
                    source={{
                      uri:
                        partner.avatarUrl ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                    }}
                    style={styles.chatAvatar}
                  />
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
        />
      )}

      {/* Compose Message Bottom Sheet */}
      <NewMessageBottomSheet
        visible={composeVisible}
        onClose={() => setComposeVisible(false)}
        onSelectUser={(conversationId) => {
          router.push({ pathname: '/(chat)/[id]', params: { id: conversationId } });
        }}
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
    borderBottomWidth: 0.5,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  activeUsersSection: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  activeUsersList: {
    paddingHorizontal: 15,
    gap: 15,
  },
  activeUserContainer: {
    alignItems: 'center',
    width: 65,
  },
  avatarWrapper: {
    position: 'relative',
  },
  activeAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
  activeUsername: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  chatAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  chatDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  lastMessageText: {
    marginTop: 3,
  },
  chatMeta: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  metaTime: {
    fontSize: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
