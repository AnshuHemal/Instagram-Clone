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
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (_) {}
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeInUp,
  FadeOutUp,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { ThemedText } from '@/components/themed-text';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';

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
  status?: 'sending' | 'sent' | 'failed';
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

// ─── Inline Video Message Player ─────────────────────────────────────────────
const ChatVideoMessage = ({ mediaUrl }: { mediaUrl: string }) => {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!ExpoVideo || !mediaUrl) return;

    let p: any = null;
    try {
      p = ExpoVideo.createVideoPlayer(mediaUrl);
      p.loop = true;
      p.muted = isMuted;
      p.showNowPlayingNotification = false;
      setPlayer(p);
    } catch (err) {
      console.warn('[ChatVideoMessage] createVideoPlayer failed:', err);
    }

    return () => {
      if (p) {
        try {
          p.pause();
        } catch (_) {}
        setTimeout(() => {
          try {
            p.release();
          } catch (_) {}
        }, 3000);
      }
    };
  }, [mediaUrl]);

  const togglePlay = () => {
    if (!player) return;
    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } catch (e) {}
  };

  if (!ExpoVideo) {
    return (
      <View style={styles.mediaPlaceholder}>
        <Ionicons name="play-circle-outline" size={36} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <Pressable onPress={togglePlay} style={styles.chatVideoContainer}>
      {player && (
        <ExpoVideo.VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      )}
      <View style={styles.videoOverlay}>
        <Ionicons
          name={isPlaying ? 'pause-circle' : 'play-circle'}
          size={36}
          color="#FFFFFF"
          style={styles.playIcon}
        />
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            if (player) {
              const newMuted = !isMuted;
              player.muted = newMuted;
              setIsMuted(newMuted);
            }
          }}
          style={styles.muteButton}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={16}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
    </Pressable>
  );
};

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const { socket, isConnected, joinConversation, leaveConversation, sendMessage, sendTypingStatus, onlineUsers, markAsRead } = useSocket();
  const insets = useSafeAreaInsets();

  const [partner, setPartner] = useState<Sender | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [mediaUploading, setMediaUploading] = useState(false);

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
      if (res.data && res.data.data && res.data.data.partner) {
        setPartner(res.data.data.partner);
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
      if (res.data && res.data.data) {
        setMessages(res.data.data.messages || []);
        setNextCursor(res.data.data.nextCursor || null);
        setHasMore(!!res.data.data.nextCursor);
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
      if (res.data && res.data.data) {
        setMessages((prev) => [...prev, ...(res.data.data.messages || [])]);
        setNextCursor(res.data.data.nextCursor || null);
        setHasMore(!!res.data.data.nextCursor);
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
    fetchInitialMessages().then(() => {
      // Mark existing messages as read upon entering the room
      markAsRead(id);
    });

    const handleMessageReceived = (message: Message) => {
      console.log('[ChatRoom] messageReceived:', message);
      if (message.conversationId === id) {
        setMessages((prev) => {
          if (message.senderId === currentUser?.id) {
            // Find if there is an optimistic sending message with the same text
            const optIndex = prev.findIndex((m) => m.status === 'sending' && m.text === message.text);
            if (optIndex !== -1) {
              const next = [...prev];
              next[optIndex] = { ...message, status: 'sent' };
              return next;
            }
          }
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [message, ...prev];
        });
        
        // When message is received, clear typing bubble immediately
        if (message.senderId === partner?.id) {
          setPartnerIsTyping(false);
          // Mark the incoming message as read instantly
          markAsRead(id);
        }
      }
    };

    const handleTypingStatus = (data: { conversationId: string; senderId: string; isTyping: boolean }) => {
      if (data.conversationId === id && data.senderId !== currentUser?.id) {
        setPartnerIsTyping(data.isTyping);
      }
    };

    const handleMessagesRead = (data: { conversationId: string; readerId: string }) => {
      console.log('[ChatRoom] messagesRead:', data);
      if (data.conversationId === id && data.readerId !== currentUser?.id) {
        // Partner has read our messages, update read status locally
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === currentUser?.id ? { ...msg, isRead: true } : msg
          )
        );
      }
    };

    socket.on('messageReceived', handleMessageReceived);
    socket.on('typingStatusReceived', handleTypingStatus);
    socket.on('messagesRead', handleMessagesRead);

    return () => {
      leaveConversation(id);
      socket.off('messageReceived', handleMessageReceived);
      socket.off('typingStatusReceived', handleTypingStatus);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [id, socket, partner]);

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

  const sendChatMessage = async (text: string, existingOptimisticId?: string, mediaUrl?: string) => {
    if (!currentUser || !id) return;

    const tempId = existingOptimisticId || `opt-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: id,
      senderId: currentUser.id,
      text,
      mediaUrl,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.name,
        avatarUrl: currentUser.avatar,
      },
      status: 'sending',
    };

    if (!existingOptimisticId) {
      setMessages((prev) => [optimisticMessage, ...prev]);
    } else {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, status: 'sending' } : msg))
      );
    }

    try {
      const response = await sendMessage(id, text, mediaUrl);
      if (response && response.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: response.messageId || msg.id,
                  status: 'sent',
                }
              : msg
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: 'failed' } : msg
          )
        );
      }
    } catch (err) {
      console.error('[ChatRoom] Send message failed:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  };

  const handleMediaSelection = async (fromCamera = false) => {
    try {
      // Request permission
      const { status } = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          `Sorry, we need ${fromCamera ? 'camera' : 'gallery'} permissions to send media.`
        );
        return;
      }

      // Launch picker
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.8,
          });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const mediaAsset = result.assets[0];
      const localUri = mediaAsset.uri;
      const isVideo = mediaAsset.mimeType?.startsWith('video') || localUri.toLowerCase().endsWith('.mp4') || localUri.toLowerCase().endsWith('.mov');

      setMediaUploading(true);

      // Create FormData
      const formData = new FormData();
      const uriParts = localUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      const fileExt = fileName.split('.').pop() || (isVideo ? 'mp4' : 'jpg');

      formData.append('file', {
        uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
        name: fileName || `media.${fileExt}`,
        type: isVideo ? `video/${fileExt}` : `image/${fileExt}`,
      } as any);

      const response = await api.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.data && response.data.data.secure_url) {
        const secureUrl = response.data.data.secure_url;
        const placeholderText = isVideo ? '🎥 Video' : '📷 Photo';
        await sendChatMessage(placeholderText, undefined, secureUrl);
      } else {
        throw new Error('Upload returned invalid response format');
      }
    } catch (err) {
      console.error('[ChatRoom] Media selection / upload failed:', err);
      Alert.alert('Upload Failed', 'Could not upload media. Please check your network and try again.');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser || !id) return;

    const textToSend = inputText.trim();
    setInputText('');
    setUserIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(id, false);

    await sendChatMessage(textToSend);
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

      {/* ── Connection Banner ── */}
      {!isConnected && (
        <Animated.View
          entering={FadeInUp}
          exiting={FadeOutUp}
          style={[styles.connectionBanner, { backgroundColor: '#FF9500' }]}
        >
          <ThemedText style={styles.connectionBannerText}>
            Reconnecting to chat...
          </ThemedText>
        </Animated.View>
      )}

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
                    { opacity: item.status === 'sending' ? 0.6 : 1 },
                  ]}
                >
                  {isMe && item.status === 'failed' && (
                    <Pressable
                      onPress={() => sendChatMessage(item.text, item.id)}
                      style={{ marginRight: 8, alignSelf: 'center' }}
                      hitSlop={8}
                    >
                      <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                    </Pressable>
                  )}
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
                        paddingHorizontal: item.mediaUrl ? 4 : 14,
                        paddingVertical: item.mediaUrl ? 4 : 9,
                      },
                    ]}
                  >
                    {item.mediaUrl && (
                      <View style={{ overflow: 'hidden', borderRadius: 14, marginBottom: (item.text !== '📷 Photo' && item.text !== '🎥 Video') ? 6 : 0 }}>
                        {item.mediaUrl.includes('.mp4') || item.mediaUrl.includes('.m3u8') || item.text === '🎥 Video' ? (
                          <ChatVideoMessage mediaUrl={item.mediaUrl} />
                        ) : (
                          <Image
                            source={{ uri: item.mediaUrl }}
                            style={styles.mediaImage}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                    )}

                    {(item.text !== '📷 Photo' && item.text !== '🎥 Video') && (
                      <ThemedText style={{ color: isMe ? '#FFFFFF' : colors.text, lineHeight: 20, paddingHorizontal: item.mediaUrl ? 10 : 0, paddingVertical: item.mediaUrl ? 4 : 0 }}>
                        {item.text}
                      </ThemedText>
                    )}

                    <ThemedText
                      style={{
                        color: isMe ? 'rgba(255,255,255,0.65)' : colors.textSecondary,
                        fontSize: 10,
                        marginTop: 4,
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        paddingHorizontal: item.mediaUrl ? 10 : 0,
                        paddingBottom: item.mediaUrl ? 4 : 0,
                      }}
                    >
                      {formatMessageTime(item.createdAt)}
                    </ThemedText>
                  </View>
                </View>

                {/* Read receipt Seen indicator under the last message sent by current user */}
                {(() => {
                  const lastMeMessageIndex = messages.findIndex((m) => m.senderId === currentUser?.id);
                  const isLastMeMessageAndRead = lastMeMessageIndex === index && item.isRead;
                  if (isLastMeMessageAndRead) {
                    return (
                      <ThemedText
                        style={{
                          color: colors.textSecondary,
                          fontSize: 11,
                          alignSelf: 'flex-end',
                          marginRight: 15,
                          marginTop: -8,
                          marginBottom: 8,
                        }}
                      >
                        Seen
                      </ThemedText>
                    );
                  }
                  return null;
                })()}
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
            <Pressable style={styles.inputIconButton} onPress={() => handleMediaSelection(true)} disabled={mediaUploading}>
              <Ionicons name="camera" size={22} color={colors.text} />
            </Pressable>

            <TextInput
              placeholder="Message..."
              placeholderTextColor="#8E8E8F"
              value={inputText}
              onChangeText={handleInputChange}
              style={[styles.inputField, { color: colors.text }]}
              multiline
              editable={!mediaUploading}
            />

            {mediaUploading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
            ) : inputText.trim() ? (
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
                <Pressable style={styles.inputIconButton} onPress={() => handleMediaSelection(false)}>
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
  connectionBanner: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF9500',
  },
  connectionBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Fonts.medium,
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
  mediaImage: {
    width: 220,
    height: 180,
    borderRadius: 14,
  },
  chatVideoContainer: {
    width: 220,
    height: 180,
    borderRadius: 14,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playIcon: {
    opacity: 0.85,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  muteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPlaceholder: {
    width: 220,
    height: 180,
    borderRadius: 14,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
});