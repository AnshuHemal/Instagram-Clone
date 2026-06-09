import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  Pressable,
  Image,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { MOCK_CHATS, Message, Chat } from '@/constants/mockData';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const currentChat = MOCK_CHATS.find((c) => c.id === id);
    if (currentChat) {
      setChat(currentChat);
      setMessages(currentChat.messages);
    }
  }, [id]);

  // ── Manual keyboard tracking ──────────────────────────────────────
  // Works reliably on both platforms regardless of Android softInputMode.
  // Avoids all double-adjustment issues from KeyboardAvoidingView + adjustPan.
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

  const handleSend = () => {
    if (!inputText.trim() || !currentUser) return;

    const newMessage: Message = {
      id: `m_${Date.now()}`,
      senderId: currentUser.id,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    setTimeout(() => {
      if (!chat) return;
      const responseMessage: Message = {
        id: `m_resp_${Date.now()}`,
        senderId: chat.user.username,
        text: `Hey! That sounds awesome. Let's touch base later. 👍`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, responseMessage]);
    }, 1500);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // When keyboard is open  → lift content above keyboard
  // Add a small buffer (8px) so the input bar never overlaps the keyboard edge
  // When keyboard is closed → apply bottom safe-area inset for nav bar
  const KEYBOARD_BUFFER = 46;
  const bottomOffset = keyboardHeight > 0
    ? keyboardHeight + KEYBOARD_BUFFER
    : Math.max(insets.bottom, 8);

  if (!chat || !currentUser) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ThemedText>Loading conversation...</ThemedText>
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
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>

        <View style={styles.headerUser}>
          <Image source={{ uri: chat.user.avatar }} style={styles.headerAvatar} />
          <View style={styles.headerTextContainer}>
            <ThemedText type="smallBold" style={{ color: colors.text }}>
              {chat.user.name}
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: chat.user.isOnline ? '#4CD964' : colors.textSecondary }}
            >
              {chat.user.isOnline ? 'Active now' : 'Offline'}
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

      {/* ── Content: messages + input bar ──────────────────────────────
          paddingBottom lifts the entire area above the open keyboard.  */}
      <View style={[styles.content, { paddingBottom: bottomOffset }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUser.id;
            return (
              <View
                style={[
                  styles.messageRow,
                  isMe ? styles.myMessageRow : styles.otherMessageRow,
                ]}
              >
                {!isMe && (
                  <Image
                    source={{ uri: chat.user.avatar }}
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
                        ? '#2A2A2A'
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
                    {item.timestamp}
                  </ThemedText>
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
              onChangeText={setInputText}
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

  // ── Header ──────────────────────────────────────────────────────────
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

  // ── Content area ─────────────────────────────────────────────────────
  content: {
    flex: 1,          // fills all space below header
  },
  flatList: {
    flex: 1,          // fills all space between header and input bar
  },
  messageList: {
    flexGrow: 1,                 // content fills the full scroll-view height
    justifyContent: 'flex-end',  // messages anchor at the bottom
    padding: 15,
    gap: 12,
  },

  // ── Message bubbles ────────────────────────────────────────────────
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '75%',
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

  // ── Input bar ─────────────────────────────────────────────────────
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