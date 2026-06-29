// NOTE: Run prisma migrate after adding MessageReaction model and replyToId to Message

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
  Dimensions,
  Text,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  SlideInDown,
  SlideOutDown,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

import { useTheme } from '@/contexts/ThemeContext';

const CHAT_THEMES = {
  default: {
    name: 'Default',
    colors: ['#000000', '#000000'],
  },
  ocean: {
    name: 'Ocean Gradient',
    colors: ['#0A2540', '#0072FF', '#00d4ff'],
  },
  lavender: {
    name: 'Sweet Lavender',
    colors: ['#3F2B96', '#724DB9', '#A8C0FF'],
  },
  maple: {
    name: 'Autumn Maple',
    colors: ['#8A2387', '#E94057', '#F27121'],
  },
  rose: {
    name: 'Desert Rose',
    colors: ['#1A0B2E', '#3D155F', '#8F94FB'],
  },
};
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { ThemedText } from '@/components/themed-text';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (_) {}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INSTAGRAM_BLUE = '#0095F6';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

const COMMON_EMOJIS = [
  '😀','😂','🥰','😍','🤩','😎','🥺','😭',
  '😱','🤔','🙄','😏','🤗','🤭','🙈','🙉',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍',
  '👍','👎','👏','🙌','🤝','✌️','🤞','💪',
  '🎉','🔥','✨','💯','🎊','🎈','🎁','🎂',
  '😺','🐶','🦁','🐼','🦊','🐸','🐧','🦄',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Sender {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  myReaction: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string | null;
  mediaUrl?: string;
  referenceType?: 'post' | 'reel' | 'story' | null;
  referenceId?: string | null;
  storyId?: string | null;
  story?: {
    id: string;
    mediaUrl: string;
    mediaType: string;
  } | null;
  isRead: boolean;
  isDeleted?: boolean;
  createdAt: string;
  sender: Sender;
  status?: 'sending' | 'sent' | 'failed';
  reactions?: ReactionGroup[];
  replyToMessage?: { id: string; text: string | null; sender: { username: string } } | null;
  // local-only fields for optimistic reply
  replyToId?: string;
  replyToText?: string;
  replyToUsername?: string;
}

interface ContextMenuTarget {
  message: Message;
  isMe: boolean;
}


// ─── AnimatedDot ──────────────────────────────────────────────────────────────

const AnimatedDot = ({ delay }: { delay: number }) => {
  const translateY = useSharedValue(0);
  const { colors } = useTheme();

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
        true,
      ),
    );
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: colors.textSecondary,
          marginHorizontal: 3,
        },
        animStyle,
      ]}
    />
  );
};

// ─── OnlinePulse ──────────────────────────────────────────────────────────────

const OnlinePulse = () => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value > 1.2 ? 0.35 : 0.85,
  }));

  return (
    <View style={{ width: 12, height: 12, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[
          { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CD964', position: 'absolute' },
          animStyle,
        ]}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CD964' }} />
    </View>
  );
};

// ─── StatusTicks ──────────────────────────────────────────────────────────────

const StatusTicks = ({ status, isRead }: { status?: 'sending' | 'sent' | 'failed'; isRead: boolean }) => {
  if (status === 'sending') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 2 }}>
        <Ionicons name="checkmark-outline" size={12} color="rgba(255,255,255,0.45)" />
      </View>
    );
  }
  if (status === 'failed') {
    return <Ionicons name="alert-circle" size={13} color="#FF3B30" />;
  }
  const color = isRead ? INSTAGRAM_BLUE : 'rgba(255,255,255,0.55)';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: 18 }}>
      <Ionicons name="checkmark" size={12} color={color} />
      <Ionicons name="checkmark" size={12} color={color} style={{ marginLeft: -6 }} />
    </View>
  );
};


// ─── TypingBubble ─────────────────────────────────────────────────────────────

const TypingBubble = ({
  avatarUrl,
  isDark,
  bubbleBg,
}: {
  avatarUrl?: string;
  isDark: boolean;
  bubbleBg: string;
}) => (
  <Animated.View entering={FadeInDown.duration(200)} style={styles.messageRow}>
    <Image
      source={{ uri: avatarUrl || 'https://ui-avatars.com/api/?name=U&size=80' }}
      style={styles.messageAvatar}
      contentFit="cover"
    />
    <View
      style={[
        styles.bubbleOther,
        {
          backgroundColor: bubbleBg,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 13,
          paddingHorizontal: 18,
        },
      ]}
    >
      <AnimatedDot delay={0} />
      <AnimatedDot delay={160} />
      <AnimatedDot delay={320} />
    </View>
  </Animated.View>
);

// ─── DateSeparator ────────────────────────────────────────────────────────────

const DateSeparator = ({ label, isDark }: { label: string; isDark: boolean }) => (
  <View style={styles.dateSeparator}>
    <View
      style={[
        styles.dateSeparatorPill,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
      ]}
    >
      <Text
        style={[
          styles.dateSeparatorText,
          { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' },
        ]}
      >
        {label}
      </Text>
    </View>
  </View>
);

// ─── ChatVideoMessage ─────────────────────────────────────────────────────────

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
        try { p.pause(); } catch (_) {}
        setTimeout(() => { try { p.release(); } catch (_) {} }, 3000);
      }
    };
  }, [mediaUrl]);

  const togglePlay = () => {
    if (!player) return;
    try {
      if (isPlaying) { player.pause(); setIsPlaying(false); }
      else { player.play(); setIsPlaying(true); }
    } catch (_) {}
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
            if (player) { const n = !isMuted; player.muted = n; setIsMuted(n); }
          }}
          style={styles.muteButton}
        >
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </Pressable>
  );
};


// ─── ReactionEmojiButton ──────────────────────────────────────────────────────

const ReactionEmojiButton = ({ emoji, onPress }: { emoji: string; onPress: () => void }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.82, { damping: 12, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 400 }); }}
      style={styles.contextMenuEmoji}
    >
      <Animated.Text style={[{ fontSize: 30 }, animStyle]}>{emoji}</Animated.Text>
    </Pressable>
  );
};

// ─── MessageContextMenu ───────────────────────────────────────────────────────

interface MessageContextMenuProps {
  visible: boolean;
  target: ContextMenuTarget | null;
  isDark: boolean;
  colors: any;
  onDismiss: () => void;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (msg: Message) => void;
  onCopy: (text: string) => void;
  onDelete: (messageId: string) => void;
}

const MessageContextMenu = ({
  visible,
  target,
  isDark,
  colors,
  onDismiss,
  onReact,
  onReply,
  onCopy,
  onDelete,
}: MessageContextMenuProps) => {
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      cardScale.value = withSpring(1, { damping: 18, stiffness: 280 });
      cardOpacity.value = withTiming(1, { duration: 160 });
    } else {
      cardScale.value = withTiming(0.92, { duration: 120 });
      cardOpacity.value = withTiming(0, { duration: 120 });
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  if (!target) return null;
  const msg = target.message;
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const actions = [
    {
      icon: 'arrow-undo-outline' as const,
      label: 'Reply',
      color: colors.text,
      onPress: () => { onDismiss(); onReply(msg); },
    },
    {
      icon: 'copy-outline' as const,
      label: 'Copy',
      color: colors.text,
      onPress: () => { onDismiss(); onCopy(msg.text || ''); },
    },
    ...(target.isMe && !msg.isDeleted
      ? [{
          icon: 'trash-outline' as const,
          label: 'Delete',
          color: '#FF3B30',
          onPress: () => { onDismiss(); onDelete(msg.id); },
        }]
      : []),
    {
      icon: 'close-outline' as const,
      label: 'Dismiss',
      color: colors.textSecondary,
      onPress: onDismiss,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.contextMenuBackdrop}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.contextMenuCard, { backgroundColor: cardBg }, cardStyle]}>
              {/* Emoji reaction row */}
              <View style={styles.contextMenuEmojiRow}>
                {REACTION_EMOJIS.map((emoji) => (
                  <ReactionEmojiButton
                    key={emoji}
                    emoji={emoji}
                    onPress={() => {
                      haptics.light();
                      onDismiss();
                      onReact(msg.id, emoji);
                    }}
                  />
                ))}
              </View>

              <View style={{ height: 1, backgroundColor: dividerColor, marginHorizontal: 12 }} />

              {/* Action rows */}
              {actions.map((action, idx) => (
                <Pressable
                  key={action.label}
                  style={[
                    styles.contextMenuAction,
                    idx < actions.length - 1 && { borderBottomWidth: 1, borderBottomColor: dividerColor },
                  ]}
                  onPress={action.onPress}
                >
                  <Ionicons name={action.icon} size={20} color={action.color} />
                  <Text style={[styles.contextMenuActionLabel, { color: action.color, fontFamily: Fonts.medium }]}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};


// ─── ReplyPreviewBar ──────────────────────────────────────────────────────────

const ReplyPreviewBar = ({
  replyTarget,
  colors,
  onDismiss,
  chatTheme,
}: {
  replyTarget: { id: string; text: string; username: string };
  colors: any;
  onDismiss: () => void;
  chatTheme: string;
}) => {
  const isCustomTheme = chatTheme && chatTheme !== 'default';
  return (
    <Animated.View
      entering={SlideInDown.duration(180)}
      exiting={SlideOutDown.duration(140)}
      style={[
        styles.replyBanner,
        {
          borderTopColor: isCustomTheme ? 'rgba(255,255,255,0.15)' : colors.border,
          backgroundColor: isCustomTheme ? 'rgba(0,0,0,0.45)' : colors.background,
        },
      ]}
    >
      <View style={styles.replyBannerLeftBar} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.replyBannerUsername, { color: isCustomTheme ? '#FFFFFF' : colors.text, fontFamily: Fonts.semiBold }]}>
          @{replyTarget.username}
        </Text>
        <Text numberOfLines={1} style={[styles.replyBannerText, { color: isCustomTheme ? 'rgba(255,255,255,0.6)' : colors.textSecondary, fontFamily: Fonts.regular }]}>
          {replyTarget.text}
        </Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={10}>
        <Ionicons name="close" size={18} color={isCustomTheme ? 'rgba(255,255,255,0.6)' : colors.textSecondary} />
      </Pressable>
    </Animated.View>
  );
};

// ─── EmojiGrid ────────────────────────────────────────────────────────────────

const EmojiGrid = ({
  visible,
  onEmojiSelect,
}: {
  visible: boolean;
  onEmojiSelect: (emoji: string) => void;
}) => {
  const translateY = useSharedValue(200);

  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : 200, { damping: 20, stiffness: 200 });
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.emojiGridContainer, animStyle]}>
      <FlatList
        data={COMMON_EMOJIS}
        keyExtractor={(item) => item}
        numColumns={8}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Pressable style={styles.emojiBtn} onPress={() => onEmojiSelect(item)}>
            <Text style={{ fontSize: 26 }}>{item}</Text>
          </Pressable>
        )}
      />
    </Animated.View>
  );
};


// ─── MessageBubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  item: Message;
  isMe: boolean;
  isDark: boolean;
  colors: any;
  bubbleOtherBg: string;
  onLongPress: (msg: Message) => void;
  onSetReply: (msg: Message) => void;
  onReactionTap: (messageId: string, emoji: string) => void;
  formatTime: (iso: string) => string;
  currentUserId: string;
  chatTheme: string;
}

const MessageBubble = React.memo(({
  item,
  isMe,
  isDark,
  colors,
  bubbleOtherBg,
  onLongPress,
  onSetReply,
  onReactionTap,
  formatTime,
  currentUserId,
  chatTheme,
}: MessageBubbleProps) => {
  const translateX = useSharedValue(0);
  const replyIconOpacity = useSharedValue(0);

  const lastTapRef = useRef(0);
  const handleBubblePress = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 280) {
      lastTapRef.current = 0;
      haptics.success();
      onReactionTap(item.id, '❤️');
    } else {
      lastTapRef.current = now;
    }
  };

  const isCustomTheme = chatTheme && chatTheme !== 'default';
  const bubbleMineBg = isCustomTheme ? 'rgba(255, 255, 255, 0.22)' : INSTAGRAM_BLUE;
  const bubbleOtherBgColor = isCustomTheme ? 'rgba(0, 0, 0, 0.35)' : bubbleOtherBg;
  const textMineColor = '#FFFFFF';
  const textOtherColor = isCustomTheme ? '#FFFFFF' : colors.text;

  const panGesture = Gesture.Pan()
    .activeOffsetX([8, 999])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = Math.min(e.translationX * 0.45, 56);
        replyIconOpacity.value = Math.min(translateX.value / 40, 1);
      }
    })
    .onEnd((e) => {
      if (e.translationX > 40) {
        runOnJS(onSetReply)(item);
        runOnJS(haptics.light)();
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      replyIconOpacity.value = withTiming(0, { duration: 150 });
    });

  const bubbleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const replyIconStyle = useAnimatedStyle(() => ({
    opacity: replyIconOpacity.value,
    transform: [{ scale: 0.8 + replyIconOpacity.value * 0.2 }],
  }));

  const reactions = item.reactions || [];

  return (
    <Animated.View entering={FadeInDown.duration(220).springify()} style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
      {/* Retry button for failed messages */}
      {isMe && item.status === 'failed' && (
        <Pressable style={{ marginRight: 8, alignSelf: 'center' }} hitSlop={8}>
          <Ionicons name="alert-circle" size={20} color="#FF3B30" />
        </Pressable>
      )}

      {/* Reply icon (shown on swipe) */}
      {!isMe && (
        <Animated.View style={[styles.swipeReplyIcon, replyIconStyle]}>
          <Ionicons name="return-down-forward-outline" size={18} color={INSTAGRAM_BLUE} />
        </Animated.View>
      )}

      {/* Partner avatar */}
      {!isMe && (
        <Image
          source={{ uri: item.sender.avatarUrl || 'https://ui-avatars.com/api/?name=U&size=80' }}
          style={styles.messageAvatar}
          contentFit="cover"
        />
      )}

      <View style={{ maxWidth: '82%' }}>
        {item.isDeleted ? (
          <View
            style={[
              styles.deletedBubble,
              { alignSelf: isMe ? 'flex-end' : 'flex-start', borderColor: colors.textSecondary },
            ]}
          >
            <Text style={{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 14, fontFamily: Fonts.regular }}>
              This message was deleted
            </Text>
          </View>
        ) : (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={bubbleAnimStyle}>
              <Pressable
                onPress={handleBubblePress}
                onLongPress={() => onLongPress(item)}
                delayLongPress={280}
                style={[
                  styles.bubble,
                  isMe
                    ? { backgroundColor: bubbleMineBg, borderBottomRightRadius: 5, alignSelf: 'flex-end' }
                    : { backgroundColor: bubbleOtherBgColor, borderBottomLeftRadius: 5, alignSelf: 'flex-start' },
                  item.mediaUrl ? { paddingHorizontal: 4, paddingVertical: 4 } : {},
                  { opacity: item.status === 'sending' ? 0.72 : 1 },
                ]}
              >
                {/* Reply quote inside bubble */}
                {(item.replyToId || item.replyToMessage) && (item.replyToText || item.replyToMessage?.text) && (
                  <View
                    style={[
                      styles.replyQuote,
                      isMe
                        ? { backgroundColor: 'rgba(0,0,0,0.18)', borderLeftColor: 'rgba(255,255,255,0.7)' }
                        : {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                            borderLeftColor: INSTAGRAM_BLUE,
                          },
                    ]}
                  >
                    <Text style={{ color: isMe ? 'rgba(255,255,255,0.85)' : INSTAGRAM_BLUE, fontSize: 11, fontFamily: Fonts.semiBold, marginBottom: 1 }}>
                      @{item.replyToUsername || item.replyToMessage?.sender?.username}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={{ color: isMe ? 'rgba(255,255,255,0.65)' : colors.textSecondary, fontSize: 12, fontFamily: Fonts.regular }}
                    >
                      {item.replyToText || item.replyToMessage?.text}
                    </Text>
                  </View>
                )}

                {/* Story Reference Preview */}
                {item.referenceType === 'story' && item.story && (
                  <View
                    style={[
                      styles.storyReferenceCard,
                      {
                        backgroundColor: isMe ? 'rgba(0,0,0,0.14)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                        borderColor: isMe ? 'rgba(255,255,255,0.18)' : colors.border,
                      }
                    ]}
                  >
                    <View style={styles.storyReferenceLeft}>
                      <Ionicons
                        name="image-outline"
                        size={13}
                        color={isMe ? 'rgba(255,255,255,0.75)' : colors.textSecondary}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.storyReferenceText,
                          { color: isMe ? 'rgba(255,255,255,0.65)' : colors.textSecondary }
                        ]}
                      >
                        {item.senderId === currentUserId ? 'Replies to story' : 'Replied to story'}
                      </Text>
                    </View>
                    <Image
                      source={{ uri: item.story.mediaUrl }}
                      style={styles.storyReferenceThumbnail}
                      contentFit="cover"
                    />
                  </View>
                )}

                {/* Media */}
                {item.mediaUrl && (
                  <View style={{ overflow: 'hidden', borderRadius: 14, marginBottom: item.text && item.text !== '📷 Photo' && item.text !== '🎥 Video' ? 6 : 0 }}>
                    {item.mediaUrl.includes('.mp4') || item.mediaUrl.includes('.m3u8') || item.text === '🎥 Video' ? (
                      <ChatVideoMessage mediaUrl={item.mediaUrl} />
                    ) : (
                      <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} contentFit="cover" />
                    )}
                  </View>
                )}

                {/* Text */}
                {item.text && item.text !== '📷 Photo' && item.text !== '🎥 Video' && (
                  <Text
                    style={{
                      color: isMe ? textMineColor : textOtherColor,
                      fontSize: 15,
                      lineHeight: 22,
                      fontFamily: Fonts.regular,
                      paddingHorizontal: item.mediaUrl ? 10 : 0,
                      paddingVertical: item.mediaUrl ? 2 : 0,
                    }}
                  >
                    {item.text}
                  </Text>
                )}

                {/* Timestamp + ticks */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    marginTop: 3,
                    paddingHorizontal: item.mediaUrl ? 10 : 0,
                    paddingBottom: item.mediaUrl ? 4 : 0,
                    gap: 3,
                  }}
                >
                  <Text style={{ color: isMe ? 'rgba(255,255,255,0.55)' : colors.textSecondary, fontSize: 10, fontFamily: Fonts.regular }}>
                    {formatTime(item.createdAt)}
                  </Text>
                  {isMe && <StatusTicks status={item.status} isRead={item.isRead} />}
                </View>
              </Pressable>
            </Animated.View>
          </GestureDetector>
        )}

        {/* Reaction pills */}
        {reactions.length > 0 && (
          <View style={[styles.reactionPillsRow, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
            {reactions.map((r) => (
              <Pressable
                key={r.emoji}
                style={[
                  styles.reactionPill,
                  {
                    backgroundColor: r.myReaction ? '#E8F4FD' : (isDark ? '#2C2C2E' : '#F0F0F0'),
                    borderWidth: 1,
                    borderColor: r.myReaction ? INSTAGRAM_BLUE : 'transparent',
                  },
                ]}
                onPress={() => onReactionTap(item.id, r.emoji)}
              >
                <Text style={{ fontSize: 13 }}>{r.emoji}</Text>
                {r.count > 1 && (
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: Fonts.medium, marginLeft: 3 }}>
                    {r.count}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Reply icon for "my" messages (right side swipe) */}
      {isMe && (
        <Animated.View style={[styles.swipeReplyIconRight, replyIconStyle]}>
          <Ionicons name="return-down-back-outline" size={18} color={INSTAGRAM_BLUE} />
        </Animated.View>
      )}
    </Animated.View>
  );
});


// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTypingStatus,
    onlineUsers,
    markAsRead,
  } = useSocket();
  const insets = useSafeAreaInsets();

  // Core state
  const [partner, setPartner] = useState<Sender | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [mediaUploading, setMediaUploading] = useState(false);

  // Pagination
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Typing
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI state
  const [replyTarget, setReplyTarget] = useState<{ id: string; text: string; username: string } | null>(null);
  const [showEmojiGrid, setShowEmojiGrid] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);
  const [chatTheme, setChatTheme] = useState<string>('default');
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Send button spring animation
  const sendScale = useSharedValue(1);
  const sendAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }));

  const flatListRef = useRef<FlatList>(null);

  const bubbleOtherBg = isDark ? '#2C2C2E' : '#F2F2F7';

  // Load cached theme from SecureStore on mount for instant visual feedback
  useEffect(() => {
    const loadCachedTheme = async () => {
      try {
        const cachedTheme = await SecureStore.getItemAsync(`chat_theme_${id}`);
        if (cachedTheme) {
          setChatTheme(cachedTheme);
        }
      } catch (_) {}
    };
    if (id) loadCachedTheme();
  }, [id]);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchConversationDetails = async () => {
    try {
      const res = await api.get(`/chat/conversations/${id}`);
      if (res.data?.data?.partner) setPartner(res.data.data.partner);
      if (res.data?.data?.theme) {
        setChatTheme(res.data.data.theme);
        await SecureStore.setItemAsync(`chat_theme_${id}`, res.data.data.theme).catch(() => {});
      }
    } catch (err) {
      console.error('[ChatRoom] fetchConversationDetails failed:', err);
    }
  };

  const fetchInitialMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/chat/conversations/${id}/messages`, { params: { limit: 20 } });
      if (res.data?.data) {
        setMessages(res.data.data.messages || []);
        setNextCursor(res.data.data.nextCursor || null);
        setHasMore(!!res.data.data.nextCursor);
      }
    } catch (err) {
      console.error('[ChatRoom] fetchInitialMessages failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreMessages = async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    try {
      setLoadingMore(true);
      const res = await api.get(`/chat/conversations/${id}/messages`, {
        params: { limit: 20, cursor: nextCursor },
      });
      if (res.data?.data) {
        setMessages((prev) => [...prev, ...(res.data.data.messages || [])]);
        setNextCursor(res.data.data.nextCursor || null);
        setHasMore(!!res.data.data.nextCursor);
      }
    } catch (err) {
      console.error('[ChatRoom] fetchMoreMessages failed:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Socket + lifecycle ────────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !socket) return;

    joinConversation(id);
    fetchConversationDetails();
    fetchInitialMessages().then(() => { markAsRead(id); });

    const handleMessageReceived = (message: Message) => {
      if (message.conversationId !== id) return;
      setMessages((prev) => {
        if (message.senderId === currentUser?.id) {
          const optIndex = prev.findIndex(
            (m) => m.status === 'sending' && m.text === message.text,
          );
          if (optIndex !== -1) {
            const next = [...prev];
            next[optIndex] = { ...message, status: 'sent' };
            return next;
          }
        }
        if (prev.some((m) => m.id === message.id)) return prev;
        return [message, ...prev];
      });
      if (message.senderId !== currentUser?.id) {
        setPartnerIsTyping(false);
        markAsRead(id);
      }
    };

    const handleTypingStatus = (data: { conversationId: string; senderId: string; isTyping: boolean }) => {
      if (data.conversationId === id && data.senderId !== currentUser?.id) {
        setPartnerIsTyping(data.isTyping);
      }
    };

    const handleMessagesRead = (data: { conversationId: string; readerId: string }) => {
      if (data.conversationId === id && data.readerId !== currentUser?.id) {
        setMessages((prev) =>
          prev.map((msg) => (msg.senderId === currentUser?.id ? { ...msg, isRead: true } : msg)),
        );
      }
    };

    const handleMessageReactionUpdate = (data: { messageId: string; userId: string; emoji: string; toggled: 'added' | 'removed'; conversationId: string }) => {
      if (data.conversationId !== id) return;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== data.messageId) return msg;

          const existing = msg.reactions || [];
          let updated: ReactionGroup[];

          if (data.toggled === 'removed') {
            updated = existing
              .map((r) => r.emoji === data.emoji ? { ...r, count: r.count - 1, myReaction: r.myReaction && data.userId !== currentUser?.id ? r.myReaction : false } : r)
              .filter((r) => r.count > 0);
          } else {
            const myPrevReaction = existing.find((r) => r.myReaction && data.userId === currentUser?.id);
            const cleanExisting = myPrevReaction
              ? existing
                  .map((r) => r.emoji === myPrevReaction.emoji ? { ...r, count: r.count - 1, myReaction: false } : r)
                  .filter((r) => r.count > 0)
              : existing;

            const found = cleanExisting.find((r) => r.emoji === data.emoji);
            if (found) {
              updated = cleanExisting.map((r) => r.emoji === data.emoji ? { ...r, count: r.count + 1, myReaction: r.myReaction || data.userId === currentUser?.id } : r);
            } else {
              updated = [...cleanExisting, { emoji: data.emoji, count: 1, myReaction: data.userId === currentUser?.id }];
            }
          }

          return { ...msg, reactions: updated };
        })
      );
    };

    const handleConversationThemeUpdate = (data: { conversationId: string; theme: string }) => {
      if (data.conversationId === id) {
        setChatTheme(data.theme);
        SecureStore.setItemAsync(`chat_theme_${id}`, data.theme).catch(() => {});
      }
    };

    socket.on('messageReceived', handleMessageReceived);
    socket.on('typingStatusReceived', handleTypingStatus);
    socket.on('messagesRead', handleMessagesRead);
    socket.on('messageReactionUpdate', handleMessageReactionUpdate);
    socket.on('conversationThemeUpdate', handleConversationThemeUpdate);

    return () => {
      leaveConversation(id);
      socket.off('messageReceived', handleMessageReceived);
      socket.off('typingStatusReceived', handleTypingStatus);
      socket.off('messagesRead', handleMessagesRead);
      socket.off('messageReactionUpdate', handleMessageReactionUpdate);
      socket.off('conversationThemeUpdate', handleConversationThemeUpdate);
    };
  }, [id, socket, partner?.id]);

  // ── Keyboard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      if (showEmojiGrid) setShowEmojiGrid(false);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, [showEmojiGrid]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!userIsTyping && id) { setUserIsTyping(true); sendTypingStatus(id, true); }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setUserIsTyping(false);
      if (id) sendTypingStatus(id, false);
    }, 2000);
  };

  const sendChatMessage = useCallback(async (
    text: string,
    existingOptimisticId?: string,
    mediaUrl?: string,
    replyToId?: string,
    replyToText?: string,
    replyToUsername?: string,
  ) => {
    if (!currentUser || !id) return;
    const tempId = existingOptimisticId || `opt-${Date.now()}-${Math.random()}`;
    const optimistic: Message = {
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
      replyToId,
      replyToText,
      replyToUsername,
    };

    if (!existingOptimisticId) {
      setMessages((prev) => [optimistic, ...prev]);
    } else {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: 'sending' } : m));
    }

    try {
      const response = await sendMessage(id, text, mediaUrl);
      if (response?.success) {
        setMessages((prev) =>
          prev.map((m) => m.id === tempId ? { ...m, id: response.messageId || m.id, status: 'sent' } : m),
        );
      } else {
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: 'failed' } : m));
      }
    } catch (_) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: 'failed' } : m));
    }
  }, [currentUser, id, sendMessage]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !currentUser || !id) return;
    const currentReply = replyTarget;
    setInputText('');
    setReplyTarget(null);
    setShowEmojiGrid(false);
    setUserIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(id, false);
    // spring animation
    sendScale.value = withSpring(0.82, { damping: 10, stiffness: 400 }, () => {
      sendScale.value = withSpring(1);
    });
    await sendChatMessage(text, undefined, undefined, currentReply?.id, currentReply?.text, currentReply?.username);
  };

  const handleMediaSelection = async (fromCamera = false) => {
    try {
      const { status } = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', `We need ${fromCamera ? 'camera' : 'gallery'} access to send media.`);
        return;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });

      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const localUri = asset.uri;
      const isVideo = asset.mimeType?.startsWith('video') || /\.(mp4|mov)$/i.test(localUri);
      setMediaUploading(true);
      const formData = new FormData();
      const fileName = localUri.split('/').pop() ?? `media.${isVideo ? 'mp4' : 'jpg'}`;
      const fileExt = fileName.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      formData.append('file', {
        uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
        name: fileName,
        type: isVideo ? `video/${fileExt}` : `image/${fileExt}`,
      } as any);
      const response = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.data?.secure_url) {
        await sendChatMessage(isVideo ? '🎥 Video' : '📷 Photo', undefined, response.data.data.secure_url);
      } else {
        throw new Error('Upload returned invalid response');
      }
    } catch (err) {
      console.error('[ChatRoom] media upload failed:', err);
      Alert.alert('Upload Failed', 'Could not upload media. Please try again.');
    } finally {
      setMediaUploading(false);
    }
  };

  // ── Reactions ─────────────────────────────────────────────────────────────

  const handleReact = useCallback(async (messageId: string, emoji: string) => {
    haptics.light();
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions || [];
        const myReaction = existing.find((r) => r.myReaction);

        let updated: ReactionGroup[];
        if (myReaction?.emoji === emoji) {
          // Toggle off same emoji
          updated = existing
            .map((r) => r.emoji === emoji ? { ...r, count: r.count - 1, myReaction: false } : r)
            .filter((r) => r.count > 0);
        } else {
          // Remove old my-reaction if different
          const withoutOld = myReaction
            ? existing
                .map((r) => r.emoji === myReaction.emoji ? { ...r, count: r.count - 1, myReaction: false } : r)
                .filter((r) => r.count > 0)
            : existing;
          // Add/increment new
          const found = withoutOld.find((r) => r.emoji === emoji);
          if (found) {
            updated = withoutOld.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, myReaction: true } : r);
          } else {
            updated = [...withoutOld, { emoji, count: 1, myReaction: true }];
          }
        }
        return { ...m, reactions: updated };
      }),
    );
    try {
      await api.post(`/chat/messages/${messageId}/react`, { emoji });
    } catch (_) {
      // Optimistic update stays
    }
  }, []);

  // ── Delete message ─────────────────────────────────────────────────────────

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, isDeleted: true } : m));
    try {
      await api.delete(`/chat/messages/${messageId}`);
    } catch (_) {}
  }, []);

  // ── Long press ─────────────────────────────────────────────────────────────

  const handleLongPress = useCallback((msg: Message) => {
    haptics.onLongPress();
    setContextMenu({ message: msg, isMe: msg.senderId === currentUser?.id });
  }, [currentUser?.id]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatMessageTime = useCallback((iso: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  }, []);

  const formatSeparatorDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return 'Today';
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  const isPartnerOnline = partner ? (onlineUsers[partner.id] ?? partner.isOnline ?? false) : false;
  const KEYBOARD_BUFFER = 46;
  const bottomOffset = keyboardHeight > 0 ? keyboardHeight + KEYBOARD_BUFFER : Math.max(insets.bottom, 8);

  const handleThemeChange = async (themeKey: string) => {
    haptics.light();
    setShowThemeModal(false);
    setChatTheme(themeKey);
    try {
      await SecureStore.setItemAsync(`chat_theme_${id}`, themeKey);
      await api.patch(`/chat/conversations/${id}/theme`, { theme: themeKey });
    } catch (err) {
      console.error('[ChatRoom] handleThemeChange failed:', err);
    }
  };

  // ── Copy ──────────────────────────────────────────────────────────────────

  const handleCopy = (text: string) => {
    try {
      require('expo-clipboard').setStringAsync(text);
    } catch (_) {}
  };


  // ── Render message item ───────────────────────────────────────────────────

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMe = item.senderId === currentUser?.id;
      const showDateSeparator =
        index === messages.length - 1 ||
        (index < messages.length - 1 &&
          new Date(item.createdAt).toDateString() !==
            new Date(messages[index + 1].createdAt).toDateString());

      return (
        <View key={item.id}>
          {showDateSeparator && (
            <DateSeparator label={formatSeparatorDate(item.createdAt)} isDark={isDark} />
          )}
          <MessageBubble
            item={item}
            isMe={isMe}
            isDark={isDark}
            colors={colors}
            bubbleOtherBg={bubbleOtherBg}
            onLongPress={handleLongPress}
            onSetReply={(msg) =>
              setReplyTarget({ id: msg.id, text: (msg.text || '').slice(0, 60), username: msg.sender.username })
            }
            onReactionTap={handleReact}
            formatTime={formatMessageTime}
            currentUserId={currentUser?.id || ''}
            chatTheme={chatTheme}
          />
        </View>
      );
    },
    [messages, currentUser, isDark, colors, bubbleOtherBg, handleLongPress, handleReact, formatMessageTime, chatTheme],
  );

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={INSTAGRAM_BLUE} />
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right']}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={[styles.headerWrapper, { borderBottomColor: colors.border }]}>
          <BlurView intensity={isDark ? 55 : 75} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.headerButton} hitSlop={12}>
              <Ionicons name="arrow-back" size={26} color={colors.text} />
            </Pressable>

            <Pressable
              style={styles.headerUser}
              onPress={() => partner && router.push(`/profile?userId=${partner.id}` as any)}
            >
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: partner?.avatarUrl || 'https://ui-avatars.com/api/?name=U&size=80' }}
                  style={styles.headerAvatar}
                  contentFit="cover"
                />
                {isPartnerOnline && (
                  <View style={styles.onlineBadge}>
                    <OnlinePulse />
                  </View>
                )}
              </View>
              <View style={styles.headerTextContainer}>
                <ThemedText type="smallBold" style={{ color: colors.text, fontFamily: Fonts.semiBold, fontSize: 15 }}>
                  {partner?.displayName || partner?.username || 'Chat'}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: isPartnerOnline ? '#4CD964' : colors.textSecondary, fontSize: 12 }}
                >
                  {isPartnerOnline ? 'Active now' : 'Offline'}
                </ThemedText>
              </View>
            </Pressable>

            <View style={styles.headerActions}>
              <Pressable style={styles.headerButton} hitSlop={8} onPress={() => setShowThemeModal(true)}>
                <Ionicons name="color-palette-outline" size={22} color={colors.text} />
              </Pressable>
              <Pressable style={styles.headerButton} hitSlop={8}>
                <Ionicons name="call-outline" size={22} color={colors.text} />
              </Pressable>
              <Pressable style={styles.headerButton} hitSlop={8}>
                <Ionicons name="videocam-outline" size={24} color={colors.text} />
              </Pressable>
            </View>
          </View>
          <View style={{ height: 0.5, backgroundColor: colors.border }} />
        </View>

        {/* ── Connection Banner ─────────────────────────────────────────── */}
        {!isConnected && (
          <Animated.View
            entering={FadeInUp}
            exiting={FadeOutUp}
            style={[styles.connectionBanner, { backgroundColor: '#FF9500' }]}
          >
            <ThemedText style={styles.connectionBannerText}>Reconnecting to chat…</ThemedText>
          </Animated.View>
        )}

        {/* ── Content ──────────────────────────────────────────────────── */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.content, { paddingBottom: Platform.OS === 'ios' ? 0 : bottomOffset }]}>
            {chatTheme !== 'default' && CHAT_THEMES[chatTheme as keyof typeof CHAT_THEMES] && (
              <LinearGradient
                colors={CHAT_THEMES[chatTheme as keyof typeof CHAT_THEMES].colors as [string, string, ...string[]]}
                style={StyleSheet.absoluteFill}
              />
            )}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              style={styles.flatList}
              contentContainerStyle={styles.messageList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              inverted
              onEndReached={fetchMoreMessages}
              onEndReachedThreshold={0.25}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={INSTAGRAM_BLUE} />
                  </View>
                ) : null
              }
              ListHeaderComponent={
                partnerIsTyping ? (
                  <TypingBubble
                    avatarUrl={partner?.avatarUrl}
                    isDark={isDark}
                    bubbleBg={bubbleOtherBg}
                  />
                ) : null
              }
              renderItem={renderMessage}
            />

            {/* ── Reply preview ─────────────────────────────────────────── */}
            {replyTarget && (
              <ReplyPreviewBar
                replyTarget={replyTarget}
                colors={colors}
                onDismiss={() => setReplyTarget(null)}
                chatTheme={chatTheme}
              />
            )}

            {/* ── Emoji grid ────────────────────────────────────────────── */}
            <EmojiGrid
              visible={showEmojiGrid}
              onEmojiSelect={(emoji) => setInputText((prev) => prev + emoji)}
            />

            {/* ── Input bar ─────────────────────────────────────────────── */}
            <View
              style={[
                styles.inputBarContainer,
                {
                  borderTopColor: chatTheme !== 'default' ? 'transparent' : colors.border,
                  backgroundColor: chatTheme !== 'default' ? 'transparent' : colors.background,
                },
              ]}
            >
              <View
                style={[
                  styles.inputBar,
                  {
                    backgroundColor: chatTheme !== 'default' ? 'rgba(255,255,255,0.18)' : (isDark ? '#2C2C2E' : '#EFEFEF'),
                    borderWidth: 0.8,
                    borderColor: chatTheme !== 'default' ? 'rgba(255,255,255,0.22)' : (isDark ? '#3A3A3C' : '#D1D1D6'),
                  },
                ]}
              >
                <Pressable
                  style={styles.inputIconButton}
                  onPress={() => handleMediaSelection(true)}
                  disabled={mediaUploading}
                >
                  <Ionicons name="camera" size={22} color={chatTheme !== 'default' ? '#FFFFFF' : colors.text} />
                </Pressable>

                <Pressable
                  style={styles.inputIconButton}
                  onPress={() => { Keyboard.dismiss(); setShowEmojiGrid((v) => !v); }}
                >
                  <Ionicons
                    name={showEmojiGrid ? 'close-circle-outline' : 'happy-outline'}
                    size={22}
                    color={showEmojiGrid ? INSTAGRAM_BLUE : (chatTheme !== 'default' ? '#FFFFFF' : colors.text)}
                  />
                </Pressable>

                <TextInput
                  placeholder="Message…"
                  placeholderTextColor={chatTheme !== 'default' ? 'rgba(255,255,255,0.6)' : '#8E8E8F'}
                  value={inputText}
                  onChangeText={handleInputChange}
                  style={[styles.inputField, { color: chatTheme !== 'default' ? '#FFFFFF' : colors.text }]}
                  multiline
                  editable={!mediaUploading}
                  onFocus={() => setShowEmojiGrid(false)}
                />

                {mediaUploading ? (
                  <ActivityIndicator size="small" color={INSTAGRAM_BLUE} style={{ marginRight: 8 }} />
                ) : inputText.trim() ? (
                  <Animated.View style={sendAnimStyle}>
                    <Pressable onPress={handleSend} style={styles.sendButton}>
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                    </Pressable>
                  </Animated.View>
                ) : (
                  <View style={styles.inputRightIcons}>
                    <Pressable style={styles.inputIconButton} hitSlop={6}>
                      <Ionicons name="mic-outline" size={22} color={chatTheme !== 'default' ? '#FFFFFF' : colors.text} />
                    </Pressable>
                    <Pressable style={styles.inputIconButton} onPress={() => handleMediaSelection(false)}>
                      <Ionicons name="image-outline" size={22} color={chatTheme !== 'default' ? '#FFFFFF' : colors.text} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* ── Context menu modal ────────────────────────────────────────── */}
        <MessageContextMenu
          visible={!!contextMenu}
          target={contextMenu}
          isDark={isDark}
          colors={colors}
          onDismiss={() => setContextMenu(null)}
          onReact={handleReact}
          onReply={(msg) =>
            setReplyTarget({ id: msg.id, text: (msg.text || '').slice(0, 60), username: msg.sender.username })
          }
          onCopy={handleCopy}
          onDelete={(msgId) => {
            Alert.alert('Delete message?', 'This will be deleted for everyone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMessage(msgId) },
            ]);
          }}
        />

        {/* ── Theme selector modal ────────────────────────────────────────── */}
        <Modal
          visible={showThemeModal}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setShowThemeModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowThemeModal(false)}>
            <View style={styles.themeModalBackdrop}>
              <TouchableWithoutFeedback>
                <View style={[styles.themeModalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                  <View style={styles.themeModalHeader}>
                    <Text style={[styles.themeModalTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                      Theme settings
                    </Text>
                    <Pressable onPress={() => setShowThemeModal(false)} hitSlop={8}>
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </Pressable>
                  </View>

                  <View style={styles.themeModalDivider} />

                  <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                    {Object.keys(CHAT_THEMES).map((themeKey) => {
                      const theme = CHAT_THEMES[themeKey as keyof typeof CHAT_THEMES];
                      const isSelected = chatTheme === themeKey;
                      return (
                        <Pressable
                          key={themeKey}
                          style={styles.themeOptionRow}
                          onPress={() => handleThemeChange(themeKey)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {themeKey === 'default' ? (
                              <View
                                style={[
                                  styles.themePreviewCircle,
                                  {
                                    backgroundColor: isDark ? '#000000' : '#FFFFFF',
                                    borderWidth: 1.5,
                                    borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
                                  },
                                ]}
                              />
                            ) : (
                              <LinearGradient
                                colors={theme.colors as [string, string, ...string[]]}
                                style={styles.themePreviewCircle}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                              />
                            )}
                            <Text
                              style={[
                                styles.themeOptionLabel,
                                {
                                  color: colors.text,
                                  fontFamily: isSelected ? Fonts.semiBold : Fonts.medium,
                                },
                              ]}
                            >
                              {theme.name}
                            </Text>
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={22} color={INSTAGRAM_BLUE} />
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  headerWrapper: {
    zIndex: 10,
    overflow: 'hidden',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    height: 60,
  },
  headerButton: {
    padding: 6,
    borderRadius: 20,
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Connection banner
  connectionBanner: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  connectionBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  // Content
  content: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexGrow: 1,
  },
  // Message rows
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 3,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 2,
  },
  // Bubbles
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.72,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
  },
  bubbleMine: {
    backgroundColor: INSTAGRAM_BLUE,
    borderBottomRightRadius: 5,
    alignSelf: 'flex-end',
  },
  bubbleOther: {
    borderBottomLeftRadius: 5,
    alignSelf: 'flex-start',
  },
  deletedBubble: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    opacity: 0.65,
  },
  // Media
  mediaImage: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: 14,
  },
  mediaPlaceholder: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.5,
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatVideoContainer: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    opacity: 0.9,
  },
  muteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    padding: 4,
  },
  // Reply quote inside bubble
  replyQuote: {
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 7,
  },
  // Reply banner (above input)
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    gap: 10,
  },
  replyBannerLeftBar: {
    width: 3,
    height: '100%',
    minHeight: 30,
    backgroundColor: INSTAGRAM_BLUE,
    borderRadius: 2,
  },
  replyBannerUsername: {
    color: INSTAGRAM_BLUE,
    fontSize: 13,
    marginBottom: 2,
  },
  replyBannerText: {
    fontSize: 13,
  },
  // Date separator
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateSeparatorPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  // Reaction pills
  reactionPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 5,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  // Swipe icons
  swipeReplyIcon: {
    position: 'absolute',
    left: -28,
    bottom: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeReplyIconRight: {
    position: 'absolute',
    right: -28,
    bottom: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Input bar
  inputBarContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    paddingHorizontal: 4,
    minHeight: 44,
  },
  inputIconButton: {
    padding: 7,
    borderRadius: 20,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 120,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontFamily: Fonts.regular,
  },
  sendButton: {
    backgroundColor: INSTAGRAM_BLUE,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  inputRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Emoji grid
  emojiGridContainer: {
    maxHeight: 180,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(120,120,120,0.25)',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  emojiBtn: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH / 8,
  },
  // Loader
  footerLoader: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  // Context menu modal
  contextMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'flex-end',
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  contextMenuCard: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  contextMenuEmojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  contextMenuEmoji: {
    padding: 4,
    borderRadius: 8,
  },
  contextMenuAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  contextMenuActionLabel: {
    fontSize: 15,
  },
  storyReferenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 12,
    borderWidth: 0.8,
    marginBottom: 6,
    width: 200,
  },
  storyReferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storyReferenceText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    flexShrink: 1,
  },
  storyReferenceThumbnail: {
    width: 32,
    height: 48,
    borderRadius: 6,
    marginLeft: 10,
    backgroundColor: '#000000',
  },
  themeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  themeModalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: '60%',
  },
  themeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  themeModalTitle: {
    fontSize: 17,
  },
  themeModalDivider: {
    height: 0.5,
    backgroundColor: 'rgba(120,120,120,0.2)',
    marginBottom: 16,
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(120,120,120,0.1)',
  },
  themeOptionLabel: {
    fontSize: 15,
  },
  themePreviewCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
