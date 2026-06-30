/**
 * HighlightsRow — horizontal scrollable highlight circles on a user's profile.
 * Shows cover image + title below each circle.
 * Has a "New" (+) button when viewing own profile.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { api } from '@/services/api';
import { haptics } from '@/utils/haptics';

export interface Highlight {
  id: string;
  title: string;
  coverUrl?: string;
  storiesCount: number;
}

interface HighlightsRowProps {
  highlights: Highlight[];
  isOwnProfile: boolean;
  userId: string;
  onHighlightPress: (highlight: Highlight) => void;
  onRefresh?: () => void;
}

const CIRCLE_SIZE = 66;

const HighlightCircle: React.FC<{
  highlight: Highlight;
  onPress: () => void;
  isDark: boolean;
  colors: any;
  index: number;
}> = ({ highlight, onPress, isDark, colors, index }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    haptics.light();
    scale.value = withSpring(0.9, { damping: 8 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    onPress();
  };

  return (
    <Animated.View entering={FadeInRight.duration(300).delay(index * 60)} style={[styles.highlightItem, animStyle]}>
      <Pressable onPress={handlePress} style={styles.highlightPress}>
        <LinearGradient
          colors={['#833ab4', '#fd1d1d', '#fcb045']}
          style={styles.highlightRing}
        >
          <View style={[styles.highlightInner, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
            {highlight.coverUrl ? (
              <Image source={{ uri: highlight.coverUrl }} style={styles.highlightImage} />
            ) : (
              <View style={[styles.highlightImage, styles.highlightPlaceholder, { backgroundColor: isDark ? '#2C2C2E' : '#E0E0E0' }]}>
                <Ionicons name="images" size={22} color={isDark ? '#636366' : '#AEAEB2'} />
              </View>
            )}
          </View>
        </LinearGradient>

        <Text
          style={[styles.highlightTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {highlight.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

// ─── New Highlight Modal ──────────────────────────────────────────────────────

const NewHighlightButton: React.FC<{
  isDark: boolean;
  colors: any;
  onCreated: () => void;
}> = ({ isDark, colors, onCreated }) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsCreating(true);
    try {
      await api.post('/stories/highlights', { title: title.trim() });
      setShowModal(false);
      setTitle('');
      onCreated();
      haptics.success();
    } catch {
      haptics.error();
      Alert.alert('Error', 'Failed to create highlight. Try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Animated.View entering={FadeInRight.duration(300)} style={styles.highlightItem}>
        <Pressable onPress={() => setShowModal(true)} style={styles.highlightPress}>
          <View style={[styles.newBtn, { borderColor: isDark ? '#48484A' : '#C7C7CC' }]}>
            <Ionicons name="add" size={28} color={isDark ? '#AEAEB2' : '#8E8E93'} />
          </View>
          <Text style={[styles.highlightTitle, { color: colors.textSecondary }]}>New</Text>
        </Pressable>
      </Animated.View>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Highlight</Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Highlight title..."
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  fontFamily: Fonts.regular,
                },
              ]}
              autoFocus
              maxLength={50}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => { setShowModal(false); setTitle(''); }}
                style={[styles.modalBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
              >
                <Text style={[styles.modalBtnLabel, { color: colors.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleCreate}
                disabled={!title.trim() || isCreating}
                style={[styles.modalBtn, styles.modalBtnPrimary, { opacity: !title.trim() || isCreating ? 0.5 : 1 }]}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalBtnPrimaryLabel}>Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const HighlightsRow: React.FC<HighlightsRowProps> = ({
  highlights,
  isOwnProfile,
  userId,
  onHighlightPress,
  onRefresh,
}) => {
  const { colors, isDark } = useTheme();

  if (!isOwnProfile && highlights.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {isOwnProfile && (
        <NewHighlightButton isDark={isDark} colors={colors} onCreated={onRefresh ?? (() => {})} />
      )}

      {highlights.map((h, i) => (
        <HighlightCircle
          key={h.id}
          highlight={h}
          onPress={() => onHighlightPress(h)}
          isDark={isDark}
          colors={colors}
          index={i}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 16,
    flexDirection: 'row',
  },
  highlightItem: {
    alignItems: 'center',
    width: CIRCLE_SIZE + 14,
  },
  highlightPress: {
    alignItems: 'center',
    gap: 6,
  },
  highlightRing: {
    width: CIRCLE_SIZE + 4,
    height: CIRCLE_SIZE + 4,
    borderRadius: (CIRCLE_SIZE + 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightInner: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  highlightImage: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
  highlightPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTitle: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    textAlign: 'center',
    maxWidth: CIRCLE_SIZE + 10,
  },

  // New button
  newBtn: {
    width: CIRCLE_SIZE + 4,
    height: CIRCLE_SIZE + 4,
    borderRadius: (CIRCLE_SIZE + 4) / 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 20,
  },
  modalTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalInput: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  modalBtnPrimary: {
    backgroundColor: '#0095F6',
  },
  modalBtnPrimaryLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#FFF',
  },
});
