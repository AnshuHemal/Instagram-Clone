import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Modal,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_OFFSCREEN = SCREEN_HEIGHT;
const DISMISS_THRESHOLD = 80;

interface UserSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  verified?: boolean;
}

interface NewMessageBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export const NewMessageBottomSheet: React.FC<NewMessageBottomSheetProps> = ({
  visible,
  onClose,
  onSelectUser,
}) => {
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null); // Track ID of user being selected

  const translateY = useSharedValue(SHEET_OFFSCREEN);
  const backdropOpacity = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(visible);

  if (visible && !shouldRender) {
    setShouldRender(true);
  }

  const openSheet = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.8 });
  }, []);

  const closeSheet = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 140, easing: Easing.linear });
    translateY.value = withTiming(
      SHEET_OFFSCREEN,
      { duration: 160, easing: Easing.bezier(0.25, 1, 0.5, 1) },
      (finished) => {
        if (finished) {
          runOnJS(setShouldRender)(false);
        }
      }
    );
  }, []);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setSuggestions([]);
      setFilteredSuggestions([]);
      translateY.value = SHEET_OFFSCREEN;
      backdropOpacity.value = 0;
      openSheet();
      fetchSuggestions();
    } else if (shouldRender) {
      closeSheet();
    }
  }, [visible, shouldRender, openSheet, closeSheet]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users/suggestions');
      if (res.data && res.data.data) {
        setSuggestions(res.data.data);
        setFilteredSuggestions(res.data.data);
      }
    } catch (err) {
      console.error('[NewMessageBottomSheet] Fetch suggestions failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredSuggestions(suggestions);
    } else {
      const lower = search.toLowerCase();
      setFilteredSuggestions(
        suggestions.filter(
          (u) =>
            u.username.toLowerCase().includes(lower) ||
            u.displayName.toLowerCase().includes(lower)
        )
      );
    }
  }, [search, suggestions]);

  const handleSelectUser = async (userId: string) => {
    setIsSaving(userId);
    try {
      // API call to create or retrieve conversation with target user
      const res = await api.post('/chat/conversations', { partnerId: userId });
      if (res.data && res.data.data && res.data.data.id) {
        onSelectUser(res.data.data.id);
        onClose();
      }
    } catch (err) {
      console.error('[NewMessageBottomSheet] Failed to start conversation:', err);
    } finally {
      setIsSaving(null);
    }
  };

  const handleHardwareBack = () => {
    onClose();
    return true;
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateY.value = Math.max(0, dragStartY.value + e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > 700) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const sheetBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDark ? '#2C2C2E' : '#EAEAEA';
  const textColor = colors.text;
  const searchBg = isDark ? '#262629' : '#F2F2F7';

  if (!shouldRender) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleHardwareBack}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Bottom Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheet, { backgroundColor: sheetBg }, sheetStyle]}>
            {/* Grab handle bar */}
            <View style={styles.handleBar}>
              <View style={[styles.handle, { backgroundColor: isDark ? '#555' : '#CCC' }]} />
            </View>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: borderColor }]}>
              <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={12}>
                <Ionicons name="close" size={24} color={textColor} />
              </Pressable>
              <ThemedText style={[styles.headerTitle, { color: textColor }]}>New message</ThemedText>
              <View style={styles.headerBtn} />
            </View>

            {/* Search input container */}
            <View style={styles.searchContainer}>
              <View style={[styles.searchBar, { backgroundColor: searchBg }]}>
                <Ionicons name="search-outline" size={18} color="#8E8E8F" style={styles.searchIcon} />
                <TextInput
                  placeholder="Search"
                  placeholderTextColor="#8E8E8F"
                  value={search}
                  onChangeText={setSearch}
                  style={[styles.searchInput, { color: textColor }]}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* User List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0064E0" />
              </View>
            ) : (
              <FlatList
                data={filteredSuggestions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.userRow,
                      pressed && { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                    ]}
                    onPress={() => handleSelectUser(item.id)}
                    disabled={isSaving !== null}
                  >
                    <Image
                      source={{
                        uri: item.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                      }}
                      style={styles.avatar}
                    />
                    <View style={styles.userDetails}>
                      <View style={styles.nameRow}>
                        <ThemedText style={[styles.username, { color: textColor }]}>
                          {item.username}
                        </ThemedText>
                        {item.verified && (
                          <Ionicons name="checkmark-circle" size={14} color="#0095F6" style={styles.verifiedIcon} />
                        )}
                      </View>
                      <ThemedText style={[styles.displayName, { color: isDark ? '#8E8E93' : '#737373' }]}>
                        {item.displayName || item.username}
                      </ThemedText>
                    </View>
                    {isSaving === item.id ? (
                      <ActivityIndicator size="small" color="#0064E0" />
                    ) : (
                      <View style={[styles.circleSelect, { borderColor: isDark ? '#3E3E42' : '#C7C7CC' }]} />
                    )}
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <ThemedText style={{ color: isDark ? '#8E8E93' : '#737373' }}>
                      No suggested accounts found.
                    </ThemedText>
                  </View>
                }
              />
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: SCREEN_HEIGHT * 0.75,
    overflow: 'hidden',
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  handle: {
    borderRadius: 2.5,
    height: 5,
    width: 40,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    height: 36,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  userRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatar: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  username: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  displayName: {
    fontSize: 13,
    marginTop: 2,
  },
  circleSelect: {
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    width: 22,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
});
