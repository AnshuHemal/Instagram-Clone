import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  Pressable,
  Image,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { ThemedText } from '@/components/themed-text';
import { api } from '@/services/api';

interface Sender {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
  sender: Sender;
}

const AnimatedDot = ({ delay }: { delay: number }) => {
  const translateY = useSharedValue(0);
  const { colors } = useTheme();

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        true
      )
    );
  }, [delay, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.textSecondary,
          marginHorizontal: 2,
        },
        animStyle,
      ]}
    />
  );
};

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const { socket, joinConversation, leaveConversation, sendMessage, sendTypingStatus, onlineUsers } = useSocket();
  const insets = useSafeAreaInsets();

  const [partner, setPartner] = useState<Sender | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Pagination states
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Typing status states
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  const flatListRef = useRef<FlatList>(null);

  // Fetch conversation details (to get partner profile)
  const fetchConversationDetails = async () => {
    try {
      const res = await api.get(`/chat/conversations/${id}`);
      if (res.data && res.data.partner) {
        setPartner(res.data.partner);
      }
    } catch (err) {
      console.error('[ChatRoom] Fetch conversation details failed:', err);
    }
  };

  // Fetch initial paginated messages
  const fetchInitialMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/chat/conversations/${id}/messages`, {
        params: { limit: 20 },
      });
      if (res.data) {
        setMessages(res.data.messages);
        setNextCursor(res.data.nextCursor || null);
        setHasMore(!!res.data.nextCursor);
      }
    } catch (err) {
      console.error('[ChatRoom] Fetch initial messages failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load more messages on scroll
  const fetchMoreMessages = async () => {
    if (loadingMore || !hasMore || !nextCursor) return;

    try {
      setLoadingMore(true);
      const res = await api.get(`/chat/conversations/${id}/messages`, {
        params: { limit: 20, cursor: nextCursor },
      });
      if (res.data) {
        setMessages((prev) => [...prev, ...res.data.messages]);
        setNextCursor(res.data.nextCursor || null);
        setHasMore(!!res.data.nextCursor);
      }
    } catch (err) {
      console.error('[ChatRoom] Fetch more messages failed:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Socket room join & listeners
  useEffect(() => {
    if (!id || !socket) return;

    joinConversation(id);
    fetchConversationDetails();
    fetchInitialMessages();

    const handleMessageReceived = (message: Message) => {
      console.log('[ChatRoom] messageReceived:', message);
      if (message.conversationId === id) {
        setMessages((prev) => [message, ...prev]);
        // When message is received, clear typing bubble immediately
        if (message.senderId === partner?.id) {
          setPartnerIsTyping(false);
        }
      }
    };

    const handleTypingStatus = (data: { conversationId: string; senderId: string; isTyping: boolean }) => {
      if (data.conversationId === id && data.senderId !== currentUser?.id) {
        setPartnerIsTyping(data.isTyping);
      }
    };

    socket.on('messageReceived', handleMessageReceived);
    socket.on('typingStatusReceived', handleTypingStatus);

    return () => {
      leaveConversation(id);
      socket.off('messageReceived', handleMessageReceived);
      socket.off('typingStatusReceived', handleTypingStatus);
    };
  }, [id, socket]);

  // Keyboard listeners
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Handle local text input change & emit typing
  const handleInputChange = (text: string) => {
    setInputText(text);

    if (!userIsTyping && id) {
      setUserIsTyping(true);
      sendTypingStatus(id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setUserIsTyping(false);
      if (id) {
        sendTypingStatus(id, false);
      }
    }, 2000);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser || !id) return;

    const textToSend = inputText.trim();
    setInputText('');
    setUserIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(id, false);

    try {
      await sendMessage(id, textToSend);
    } catch (err) {
      console.error('[ChatRoom] Send message failed:', err);
    }
  };

  const formatMessageTime = (isoString: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatSeparatorDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return 'Today';
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const isPartnerOnline = partner ? (onlineUsers[partner.id] ?? partner.isOnline ?? false) : false;

  const KEYBOARD_BUFFER = 46;
  const bottomOffset = keyboardHeight > 0
    ? keyboardHeight + KEYBOARD_BUFFER
    : Math.max(insets.bottom, 8);

  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#0064E0" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>

        <View style={styles.headerUser}>
          <Image
            source={{
              uri:
                partner?.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerTextContainer}>
            <ThemedText type="smallBold" style={{ color: colors.text }}>
              {partner?.displayName || partner?.username || 'Chat'}
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: isPartnerOnline ? '#4CD964' : colors.textSecondary }}
            >
              {isPartnerOnline ? 'Active now' : 'Offline'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton}>
            <Ionicons name="call-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable style={styles.headerButton}>
            <Ionicons name="videocam-outline" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* ── Content Area: Message List + Input ── */}
      <View style={[styles.content, { paddingBottom: bottomOffset }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          inverted={true}
          onEndReached={fetchMoreMessages}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#0064E0" />
              </View>
            ) : null
          }
          ListHeaderComponent={
            partnerIsTyping ? (
              <View style={[styles.messageRow, styles.otherMessageRow, { marginTop: 4 }]}>
                <Image
                  source={{
                    uri:
                      partner?.avatarUrl ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                  }}
                  style={styles.messageAvatar}
                />
                <View
                  style={[
                    styles.bubble,
                    {
                      backgroundColor: isDark ? '#2C2C2E' : '#E8E8E8',
                      borderBottomLeftRadius: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                    },
                  ]}
                >
                  <AnimatedDot delay={0} />
                  <AnimatedDot delay={150} />
                  <AnimatedDot delay={300} />
                </View>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const isMe = item.senderId === currentUser?.id;
            const showDateSeparator =
              index === messages.length - 1 ||
              (index < messages.length - 1 &&
                new Date(item.createdAt).toDateString() !==
                  new Date(messages[index + 1].createdAt).toDateString());

            return (
              <View>
                {showDateSeparator && (
                  <View style={styles.dateSeparator}>
                    <ThemedText style={[styles.dateSeparatorText, { color: colors.textSecondary }]}>
                      {formatSeparatorDate(item.createdAt)}
                    </ThemedText>
                  </View>
                )}

                <View
                  style={[
                    styles.messageRow,
                    isMe ? styles.myMessageRow : styles.otherMessageRow,
                  ]}
                >
                  {!isMe && (
                    <Image
                      source={{
                        uri:
                          partner?.avatarUrl ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                      }}
                      style={styles.messageAvatar}
                    />
                  )}
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: isMe
                          ? colors.primary
                          : isDark
                          ? '#2C2C2E'
                          : '#E8E8E8',
                        borderBottomRightRadius: isMe ? 4 : 18,
                        borderBottomLeftRadius: isMe ? 18 : 4,
                      },
                    ]}
                  >
                    <ThemedText style={{ color: isMe ? '#FFFFFF' : colors.text, lineHeight: 20 }}>
                      {item.text}
                    </ThemedText>
                    <ThemedText
                      style={{
                        color: isMe ? 'rgba(255,255,255,0.65)' : colors.textSecondary,
                        fontSize: 10,
                        marginTop: 4,
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {formatMessageTime(item.createdAt)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* ── Input Bar ── */}
        <View
          style={[
            styles.inputBarContainer,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#EFEFEF',
                borderWidth: 0.8,
                borderColor: isDark ? '#3A3A3C' : '#D1D1D6',
              },
            ]}
          >
            <Pressable style={styles.inputIconButton}>
              <Ionicons name="camera" size={22} color={colors.text} />
            </Pressable>

            <TextInput
              placeholder="Message..."
              placeholderTextColor="#8E8E8F"
              value={inputText}
              onChangeText={handleInputChange}
              style={[styles.inputField, { color: colors.text }]}
              multiline
            />

            {inputText.trim() ? (
              <Pressable onPress={handleSend} style={styles.sendButton}>
                <ThemedText type="smallBold" style={{ color: colors.primary }}>
                  Send
                </ThemedText>
              </Pressable>
            ) : (
              <View style={styles.inputRightIcons}>
                <Pressable style={styles.inputIconButton}>
                  <Ionicons name="mic-outline" size={22} color={colors.text} />
                </Pressable>
                <Pressable style={styles.inputIconButton}>
                  <Ionicons name="image-outline" size={22} color={colors.text} />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 56,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    padding: 8,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  content: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  messageList: {
    flexGrow: 1,
    padding: 15,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '75%',
    marginVertical: 2,
  },
  myMessageRow: {
    alignSelf: 'flex-end',
  },
  otherMessageRow: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    maxWidth: '100%',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerLoader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  inputBarContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 12,
    minHeight: 46,
    maxHeight: 110,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  inputIconButton: {
    padding: 5,
  },
  inputRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});