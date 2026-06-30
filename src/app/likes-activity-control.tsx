import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

type SortOption = 'Newest to oldest' | 'Oldest to newest';
type DateOption = 'All dates' | 'Last week' | 'Last month' | 'Last year';
type ContentTypeOption = 'All content types' | 'Posts' | 'Reels';
type AuthorOption = 'All authors' | 'Suggested' | 'People you follow';

export default function LikesActivityControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sortOrder, setSortOrder] = useState<SortOption>('Newest to oldest');
  const [dateRange, setDateRange] = useState<DateOption>('All dates');
  const [contentType, setContentType] = useState<ContentTypeOption>('All content types');
  const [author, setAuthor] = useState<AuthorOption>('All authors');

  // Modal active controls
  const [activeModal, setActiveModal] = useState<'sort' | 'date' | 'content' | 'author' | null>(null);

  const handleBack = () => {
    haptics.light();
    router.back();
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

  const selectContentTypeOption = (opt: ContentTypeOption) => {
    haptics.medium();
    setContentType(opt);
    setActiveModal(null);
    showToast({ message: `Content type: ${opt}`, type: 'success' });
  };

  const selectAuthorOption = (opt: AuthorOption) => {
    haptics.medium();
    setAuthor(opt);
    setActiveModal(null);
    showToast({ message: `Author filter: ${opt}`, type: 'success' });
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
          Likes
        </Text>
        <View style={{ width: 38 }} />
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

          {/* Content Type Pill */}
          <Pressable
            onPress={() => { haptics.light(); setActiveModal('content'); }}
            style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorderColor }]}
          >
            <Text style={[styles.pillText, { color: labelColor }]}>{contentType}</Text>
            <Feather name="chevron-down" size={14} color={labelColor} style={styles.pillIcon} />
          </Pressable>

          {/* Authors Pill */}
          <Pressable
            onPress={() => { haptics.light(); setActiveModal('author'); }}
            style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorderColor }]}
          >
            <Text style={[styles.pillText, { color: labelColor }]}>{author}</Text>
            <Feather name="chevron-down" size={14} color={labelColor} style={styles.pillIcon} />
          </Pressable>
        </ScrollView>
      </View>

      {/* Empty State Layout */}
      <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.content}>
        <View style={styles.emptyWrap}>
          {/* Instagram style colorful gradient border circle */}
          <LinearGradient
            colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
            style={styles.gradientCircle}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={[styles.innerCircle, { backgroundColor: colors.background }]}>
              <Text style={styles.exclamationMark}>!</Text>
            </View>
          </LinearGradient>

          <Text style={[styles.emptyTitle, { color: labelColor }]}>
            You haven't liked anything
          </Text>
          <Text style={[styles.emptyDesc, { color: descColor }]}>
            When you like a photo or video, it'll show up here.
          </Text>
        </View>
      </Animated.View>

      {/* ─────────────────────────────────────────────
          SELECTION MODALS
          ───────────────────────────────────────────── */}

      {/* Sort Modal */}
      <Modal visible={activeModal === 'sort'} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]} onPress={() => setActiveModal(null)}>
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.modalContent, { backgroundColor: modalContentBg }]}>
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

      {/* Date Filter Modal */}
      <Modal visible={activeModal === 'date'} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]} onPress={() => setActiveModal(null)}>
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.modalContent, { backgroundColor: modalContentBg }]}>
            <Text style={[styles.modalTitle, { color: labelColor }]}>Select dates</Text>
            {(['All dates', 'Last week', 'Last month', 'Last year'] as DateOption[]).map((opt) => (
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

      {/* Content Type Filter Modal */}
      <Modal visible={activeModal === 'content'} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]} onPress={() => setActiveModal(null)}>
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.modalContent, { backgroundColor: modalContentBg }]}>
            <Text style={[styles.modalTitle, { color: labelColor }]}>Content type</Text>
            {(['All content types', 'Posts', 'Reels'] as ContentTypeOption[]).map((opt) => (
              <Pressable key={opt} onPress={() => selectContentTypeOption(opt)} style={styles.modalOption}>
                <Text style={[styles.optionText, { color: labelColor, fontFamily: contentType === opt ? Fonts.semiBold : Fonts.regular }]}>
                  {opt}
                </Text>
                {contentType === opt && <Ionicons name="checkmark" size={20} color="#3897F0" />}
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Author Filter Modal */}
      <Modal visible={activeModal === 'author'} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]} onPress={() => setActiveModal(null)}>
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.modalContent, { backgroundColor: modalContentBg }]}>
            <Text style={[styles.modalTitle, { color: labelColor }]}>Select author</Text>
            {(['All authors', 'Suggested', 'People you follow'] as AuthorOption[]).map((opt) => (
              <Pressable key={opt} onPress={() => selectAuthorOption(opt)} style={styles.modalOption}>
                <Text style={[styles.optionText, { color: labelColor, fontFamily: author === opt ? Fonts.semiBold : Fonts.regular }]}>
                  {opt}
                </Text>
                {author === opt && <Ionicons name="checkmark" size={20} color="#3897F0" />}
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 0,
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  gradientCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2.5,
    marginBottom: 24,
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exclamationMark: {
    fontSize: 48,
    fontFamily: Fonts.regular,
    color: '#FF3B30',
    textAlign: 'center',
    lineHeight: 52,
  },
  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  emptyDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
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
