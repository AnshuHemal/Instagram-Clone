import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

type SortOption = 'Newest to oldest' | 'Oldest to newest';
type DateOption = 'All dates' | 'Last week' | 'Last month';
type AuthorOption = 'All authors' | 'Followed accounts' | 'Suggested';

interface PostItem {
  id: string;
  uri: string;
  isReel: boolean;
}

const mockPosts: PostItem[] = [
  { id: '1', uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', isReel: true },
  { id: '2', uri: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400', isReel: false },
  { id: '3', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', isReel: true },
];

const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 4) / 3;

export default function InterestedControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<PostItem[]>(mockPosts);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const [sortOrder, setSortOrder] = useState<SortOption>('Newest to oldest');
  const [dateRange, setDateRange] = useState<DateOption>('All dates');
  const [authorType, setAuthorType] = useState<AuthorOption>('All authors');

  const [activeModal, setActiveModal] = useState<'sort' | 'date' | 'author' | null>(null);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const toggleSelectMode = () => {
    haptics.light();
    if (isSelectMode) {
      setSelectedIds([]);
    }
    setIsSelectMode(!isSelectMode);
  };

  const handleItemPress = (id: string) => {
    if (isSelectMode) {
      haptics.light();
      if (selectedIds.includes(id)) {
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      } else {
        setSelectedIds((prev) => [...prev, id]);
      }
    } else {
      showToast({ message: 'Viewing post details', type: 'info' });
    }
  };

  const handleRemoveSelected = () => {
    if (selectedIds.length === 0) return;
    haptics.medium();
    setPosts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
    setSelectedIds([]);
    setIsSelectMode(false);
    showToast({ message: 'Removed posts from interested list', type: 'success' });
  };

  const selectSortOption = (opt: SortOption) => {
    haptics.medium();
    setSortOrder(opt);
    setActiveModal(null);
    showToast({ message: `Sorted: ${opt}`, type: 'success' });
  };

  const selectDateOption = (opt: DateOption) => {
    haptics.medium();
    setDateRange(opt);
    setActiveModal(null);
    showToast({ message: `Date filter: ${opt}`, type: 'success' });
  };

  const selectAuthorOption = (opt: AuthorOption) => {
    haptics.medium();
    setAuthorType(opt);
    setActiveModal(null);
    showToast({ message: `Author: ${opt}`, type: 'success' });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const pillBg = isDark ? '#1C1C1E' : '#F5F5F5';
  const pillBorderColor = isDark ? '#333333' : '#EAEAEA';
  const modalOverlayBg = 'rgba(0,0,0,0.5)';
  const modalContentBg = isDark ? '#1C1C1E' : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 6, borderBottomColor: divColor },
        ]}
      >
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Interested
        </Text>
        <Pressable onPress={toggleSelectMode} hitSlop={12}>
          <Text style={styles.selectBtnText}>{isSelectMode ? 'Cancel' : 'Select'}</Text>
        </Pressable>
      </View>

      {/* Filter Horizontal Row */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {/* Sort Pill */}
          <Pressable
            onPress={() => { haptics.light(); setActiveModal('sort'); }}
            style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorderColor }]}
          >
            <Text style={[styles.pillText, { color: labelColor }]}>{sortOrder}</Text>
            <Feather name="chevron-down" size={14} color={labelColor} style={styles.pillIcon} />
          </Pressable>

          {/* Dates Pill */}
          <Pressable
            onPress={() => { haptics.light(); setActiveModal('date'); }}
            style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorderColor }]}
          >
            <Text style={[styles.pillText, { color: labelColor }]}>{dateRange}</Text>
            <Feather name="chevron-down" size={14} color={labelColor} style={styles.pillIcon} />
          </Pressable>

          {/* Author Pill */}
          <Pressable
            onPress={() => { haptics.light(); setActiveModal('author'); }}
            style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorderColor }]}
          >
            <Text style={[styles.pillText, { color: labelColor }]}>{authorType}</Text>
            <Feather name="chevron-down" size={14} color={labelColor} style={styles.pillIcon} />
          </Pressable>
        </ScrollView>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        ListHeaderComponent={
          <View style={styles.infoBlock}>
            <Text style={[styles.infoDesc, { color: descColor }]}>
              These are posts you said you were interested in in the past 30 days. When a post is removed from this list, you may see fewer suggested posts like it on Instagram.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(200)}>
              <Pressable
                onPress={() => handleItemPress(item.id)}
                style={({ pressed }) => [
                  styles.imageBtn,
                  { width: imageSize, height: imageSize },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />

                {item.isReel && (
                  <View style={styles.reelIndicator}>
                    <Ionicons name="play" size={12} color="#FFFFFF" />
                  </View>
                )}

                {/* Selection overlays */}
                {isSelectMode && (
                  <View style={[styles.checkboxOverlay, isSelected && styles.checkboxOverlaySelected]}>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color="#3897F0" />
                    ) : (
                      <View style={[styles.checkboxOutline, { borderColor: '#FFFFFF' }]} />
                    )}
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: labelColor }]}>No posts listed</Text>
            <Text style={[styles.emptyDesc, { color: descColor }]}>
              Posts you mark as "Interested" will appear here.
            </Text>
          </View>
        }
      />

      {/* Select Mode Footer Action */}
      {isSelectMode && selectedIds.length > 0 && (
        <Animated.View entering={FadeIn} style={[styles.selectFooter, { paddingBottom: insets.bottom + 12, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Pressable onPress={handleRemoveSelected} style={styles.removeActionBtn}>
            <Text style={styles.removeActionText}>Remove ({selectedIds.length})</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Modals */}
      {/* Sort Modal */}
      <Modal visible={activeModal === 'sort'} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]} onPress={() => setActiveModal(null)}>
          <Animated.View style={[styles.modalContent, { backgroundColor: modalContentBg }]}>
            <Text style={[styles.modalTitle, { color: labelColor }]}>Sort order</Text>
            <Pressable onPress={() => selectSortOption('Newest to oldest')} style={styles.modalOption}>
              <Text style={[styles.optionText, { color: labelColor, fontFamily: sortOrder === 'Newest to oldest' ? Fonts.semiBold : Fonts.regular }]}>
                Newest to oldest
              </Text>
              {sortOrder === 'Newest to oldest' && <Ionicons name="checkmark" size={20} color="#3897F0" />}
            </Pressable>
            <Pressable onPress={() => selectSortOption('Oldest to newest')} style={styles.modalOption}>
              <Text style={[styles.optionText, { color: labelColor, fontFamily: sortOrder === 'Oldest to newest' ? Fonts.semiBold : Fonts.regular }]}>
                Oldest to newest
              </Text>
              {sortOrder === 'Oldest to newest' && <Ionicons name="checkmark" size={20} color="#3897F0" />}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Date Modal */}
      <Modal visible={activeModal === 'date'} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]} onPress={() => setActiveModal(null)}>
          <Animated.View style={[styles.modalContent, { backgroundColor: modalContentBg }]}>
            <Text style={[styles.modalTitle, { color: labelColor }]}>Select dates</Text>
            {(['All dates', 'Last week', 'Last month'] as DateOption[]).map((opt) => (
              <Pressable key={opt} onPress={() => selectDateOption(opt)} style={styles.modalOption}>
                <Text style={[styles.optionText, { color: labelColor, fontFamily: dateRange === opt ? Fonts.semiBold : Fonts.regular }]}>
                  {opt}
                </Text>
                {dateRange === opt && <Ionicons name="checkmark" size={20} color="#3897F0" />}
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Author Modal */}
      <Modal visible={activeModal === 'author'} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]} onPress={() => setActiveModal(null)}>
          <Animated.View style={[styles.modalContent, { backgroundColor: modalContentBg }]}>
            <Text style={[styles.modalTitle, { color: labelColor }]}>Select authors</Text>
            {(['All authors', 'Followed accounts', 'Suggested'] as AuthorOption[]).map((opt) => (
              <Pressable key={opt} onPress={() => selectAuthorOption(opt)} style={styles.modalOption}>
                <Text style={[styles.optionText, { color: labelColor, fontFamily: authorType === opt ? Fonts.semiBold : Fonts.regular }]}>
                  {opt}
                </Text>
                {authorType === opt && <Ionicons name="checkmark" size={20} color="#3897F0" />}
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    paddingVertical: 6,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 0,
  },
  selectBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#3897F0',
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  pillIcon: {
    marginLeft: 6,
  },
  infoBlock: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  infoDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },
  gridRow: {
    gap: 2,
    marginBottom: 2,
  },
  imageBtn: {
    position: 'relative',
    marginRight: 2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  reelIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 4,
    borderRadius: 4,
  },
  checkboxOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  checkboxOverlaySelected: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  checkboxOutline: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  selectFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2C2C2E',
    alignItems: 'center',
  },
  removeActionBtn: {
    width: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  removeActionText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
  },
  optionText: {
    fontSize: 16,
  },
});
