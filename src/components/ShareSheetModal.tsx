/**
 * ShareSheetModal — Send a post/reel to a DM conversation.
 * Shows current conversations with a search filter.
 * Sends a shared message with referenceType + referenceId to the chat.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Dimensions,
  Image,
  ActivityIndicator,
  Keyboard,
  Modal,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { api } from '@/services/api';
import { haptics } from '@/utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ShareSheetModalProps {
  visible: boolean;
  referenceType: 'post' | 'reel';
  referenceId: string;
  previewImageUrl?: string;
  previewCaption?: string;
  onClose: () => void;
}

interface ConversationItem {
  id: string;
  partnerId: string;
  partnerUsername: string;
  partnerDisplayName: string;
  partnerAvatarUrl?: string;
  isGroup?: boolean;
  groupName?: string;
  sent?: boolean;
  sending?: boolean;
}

export const ShareSheetModal: React.FC<ShareSheetModalProps> = ({
  visible,
  referenceType,
  referenceId,
  previewImageUrl,
  previewCaption,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [filtered, setFiltered] = useState<ConversationItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const open = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 260 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.9 });
  }, []);

  const close = useCallback(() => {
    Keyboard.dismiss();
    backdropOpacity.value = withTiming(0, { duration: 220 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300, easing: Easing.out(Easing.ease) }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      open();
      loadConversations();
    } else {
      translateY.value = SCREEN_HEIGHT;
      backdropOpacity.value = 0;
      setSearch('');
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const handleBackPress = () => {
      close();
      return true; // Intercept and handle event cleanly
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      subscription.remove();
    };
  }, [visible, close]);

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

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(conversations);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        conversations.filter(c =>
          (c.partnerDisplayName + c.partnerUsername + (c.groupName ?? '')).toLowerCase().includes(q)
        ),
      );
    }
  }, [search, conversations]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/chat/conversations');
      const data: ConversationItem[] = (res.data?.data ?? res.data ?? []).map((c: any) => ({
        id: c.id,
        partnerId: c.partnerId ?? c.partner?.id ?? '',
        partnerUsername: c.partnerUsername ?? c.partner?.username ?? '',
        partnerDisplayName: c.partnerDisplayName ?? c.partner?.displayName ?? '',
        partnerAvatarUrl: c.partnerAvatarUrl ?? c.partner?.avatarUrl,
        isGroup: c.isGroup,
        groupName: c.groupName,
        sent: false,
        sending: false,
      }));
      setConversations(data);
      setFiltered(data);
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (conv: ConversationItem) => {
    haptics.medium();
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, sending: true } : c),
    );
    try {
      await api.post(`/chat/conversations/${conv.id}/messages`, {
        text: message.trim() || null,
        referenceType,
        referenceId,
      });
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, sending: false, sent: true } : c),
      );
    } catch {
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, sending: false } : c),
      );
    }
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd(e => {
      if (e.translationY > 100 || e.velocityY > 700) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, { damping: 22 });
      }
    });

  const renderItem = ({ item }: { item: ConversationItem }) => (
    <View style={styles.convRow}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {item.partnerAvatarUrl ? (
          <Image source={{ uri: item.partnerAvatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: isDark ? '#2C2C2E' : '#E0E0E0' }]}>
            <Ionicons name="person" size={18} color={isDark ? '#636366' : '#AEAEB2'} />
          </View>
        )}
      </View>

      {/* Name */}
      <View style={styles.convInfo}>
        <Text style={[styles.convName, { color: colors.text }]} numberOfLines={1}>
          {item.isGroup ? item.groupName : item.partnerDisplayName}
        </Text>
        <Text style={[styles.convSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.isGroup ? 'Group' : `@${item.partnerUsername}`}
        </Text>
      </View>

      {/* Send button */}
      <Pressable
        onPress={() => handleSend(item)}
        disabled={item.sending || item.sent}
        style={[
          styles.sendBtn,
          {
            backgroundColor: item.sent
              ? isDark ? '#2C2C2E' : '#F2F2F7'
              : '#0095F6',
          },
        ]}
      >
        {item.sending ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : item.sent ? (
          <Text style={[styles.sendLabel, { color: colors.textSecondary }]}>Sent ✓</Text>
        ) : (
          <Text style={[styles.sendLabel, { color: '#FFF' }]}>Send</Text>
        )}
      </Pressable>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
    >
      <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  maxHeight: SCREEN_HEIGHT * 0.75,
                  paddingBottom: Math.max(insets.bottom, 16) + keyboardHeight,
                },
                sheetStyle,
              ]}
            >
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: isDark ? '#48484A' : '#C7C7CC' }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Share to</Text>
              <Pressable onPress={close} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            {/* Preview snippet */}
            {previewImageUrl && (
              <Animated.View entering={FadeIn.duration(300)} style={[styles.preview, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                <Image source={{ uri: previewImageUrl }} style={styles.previewThumb} />
                <Text style={[styles.previewCaption, { color: colors.text }]} numberOfLines={2}>
                  {previewCaption || (referenceType === 'reel' ? 'Reel' : 'Post')}
                </Text>
              </Animated.View>
            )}

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
              <Feather name="search" size={16} color={colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search conversations..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.text, fontFamily: Fonts.regular }]}
              />
            </View>

            {/* Optional message input */}
            <View style={[styles.messageBar, { borderColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Write a message (optional)..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.messageInput, { color: colors.text, fontFamily: Fonts.regular }]}
                multiline
                maxLength={300}
              />
            </View>

            {/* Conversations list */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#0095F6" style={{ paddingVertical: 32 }} />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No conversations found
                  </Text>
                }
              />
            )}
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 28,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    padding: 10,
    gap: 12,
  },
  previewThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  previewCaption: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  messageBar: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageInput: {
    fontSize: 14,
    minHeight: 38,
    maxHeight: 80,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  avatarWrap: {},
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  convInfo: {
    flex: 1,
    gap: 2,
  },
  convName: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  convSub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  sendBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 66,
    alignItems: 'center',
  },
  sendLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
});
