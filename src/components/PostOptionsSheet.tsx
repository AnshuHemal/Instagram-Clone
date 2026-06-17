/**
 * PostOptionsSheet — animated bottom sheet for post/reel owner actions.
 * Options: Edit Caption, Delete Post, Copy Link, Share, Cancel.
 * Uses gesture-based dismiss with spring animation and glassmorphism styling.
 */

import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Text,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 340;

interface PostOptionsSheetProps {
  visible: boolean;
  postId: string;
  isOwner: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  entityType?: 'post' | 'reel';
}

interface OptionRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  destructive?: boolean;
  isDark: boolean;
  colors: any;
}

const OptionRow: React.FC<OptionRowProps> = ({ icon, label, sublabel, onPress, destructive, isDark, colors }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    haptics.light();
    onPress();
  };

  return (
    <Animated.View style={[animStyle, { width: '100%' }]}>
      <Pressable
        onPress={handlePress}
        style={[styles.optionRow, { borderBottomColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
      >
        <View style={[styles.optionIcon, { backgroundColor: destructive ? 'rgba(255,59,48,0.12)' : isDark ? '#2C2C2E' : '#F2F2F7' }]}>
          {icon}
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionLabel, { color: destructive ? '#FF3B30' : colors.text }]}>
            {label}
          </Text>
          {sublabel && (
            <Text style={[styles.optionSublabel, { color: colors.textSecondary }]}>{sublabel}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={isDark ? '#48484A' : '#C7C7CC'} />
      </Pressable>
    </Animated.View>
  );
};

export const PostOptionsSheet: React.FC<PostOptionsSheetProps> = ({
  visible,
  postId,
  isOwner,
  onClose,
  onEdit,
  onDelete,
  onShare,
  entityType = 'post',
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const open = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 260 });
    translateY.value = withSpring(0, { damping: 22, stiffness: 220, mass: 0.9 });
  }, []);

  const close = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 220 });
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 260, easing: Easing.out(Easing.ease) }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      open();
    } else {
      translateY.value = SHEET_HEIGHT;
      backdropOpacity.value = 0;
    }
  }, [visible]);

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd(e => {
      if (e.translationY > 80 || e.velocityY > 600) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, { damping: 22 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  const handleShare = async () => {
    close();
    setTimeout(() => {
      Share.share({ message: `Check out this ${entityType}: instafrontend://${entityType}/${postId}` });
    }, 300);
  };

  const handleDelete = () => {
    close();
    setTimeout(() => {
      Alert.alert(
        `Delete ${entityType === 'reel' ? 'Reel' : 'Post'}`,
        `Are you sure you want to delete this ${entityType}? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ],
      );
    }, 350);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="auto">
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              paddingBottom: Math.max(insets.bottom, 16),
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {entityType === 'reel' ? 'Reel' : 'Post'} Options
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} />

          {/* Options */}
          <View style={styles.options}>
            {isOwner && onEdit && (
              <OptionRow
                icon={<Feather name="edit-2" size={18} color="#0095F6" />}
                label="Edit Caption"
                sublabel="Update your caption or location"
                onPress={() => { close(); setTimeout(onEdit, 350); }}
                isDark={isDark}
                colors={colors}
              />
            )}

            <OptionRow
              icon={<Feather name="share-2" size={18} color={colors.text} />}
              label="Share"
              sublabel="Send to conversations or copy link"
              onPress={() => { close(); setTimeout(() => onShare?.(), 300); }}
              isDark={isDark}
              colors={colors}
            />

            <OptionRow
              icon={<MaterialCommunityIcons name="link-variant" size={18} color={colors.text} />}
              label="Copy Link"
              sublabel={`instafrontend://${entityType}/${postId}`}
              onPress={handleShare}
              isDark={isDark}
              colors={colors}
            />

            {isOwner && onDelete && (
              <OptionRow
                icon={<Ionicons name="trash-outline" size={18} color="#FF3B30" />}
                label={`Delete ${entityType === 'reel' ? 'Reel' : 'Post'}`}
                sublabel="This action cannot be undone"
                onPress={handleDelete}
                destructive
                isDark={isDark}
                colors={colors}
              />
            )}
          </View>

          {/* Cancel */}
          <Pressable
            onPress={close}
            style={[styles.cancelBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
          >
            <Text style={[styles.cancelLabel, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 24,
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    marginHorizontal: 0,
  },
  options: {
    paddingTop: 6,
    paddingHorizontal: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  optionSublabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  cancelBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
});
