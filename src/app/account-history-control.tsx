import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
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
type DateOption = 'All dates' | 'Last week' | 'Last month' | 'Last year';
type UpdateTypeOption = 'All updates' | 'Privacy changes' | 'Email changes' | 'Account status';

interface HistoryItem {
  id: string;
  type: 'privacy' | 'email' | 'created';
  title: string;
  desc: string;
  time: string;
  iconName: string;
}

interface GroupedHistory {
  sectionTitle: string;
  data: HistoryItem[];
}

const mockHistoryData: GroupedHistory[] = [
  {
    sectionTitle: 'Today',
    data: [
      {
        id: '1',
        type: 'privacy',
        title: 'Privacy',
        desc: 'You made your account private.',
        time: '7h',
        iconName: 'eye',
      },
      {
        id: '2',
        type: 'privacy',
        title: 'Privacy',
        desc: 'You made your account public.',
        time: '7h',
        iconName: 'eye',
      },
    ],
  },
  {
    sectionTitle: 'This month',
    data: [
      {
        id: '3',
        type: 'privacy',
        title: 'Privacy',
        desc: 'You made your account private.',
        time: '1w',
        iconName: 'eye',
      },
      {
        id: '4',
        type: 'email',
        title: 'Email',
        desc: 'You changed your email address to instaclone091@gmail.com',
        time: '2w',
        iconName: 'mail',
      },
      {
        id: '5',
        type: 'created',
        title: 'Account created',
        desc: 'You created your profile on June 09, 2026',
        time: '2w',
        iconName: 'info',
      },
    ],
  },
];

export default function AccountHistoryControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sortOrder, setSortOrder] = useState<SortOption>('Newest to oldest');
  const [dateRange, setDateRange] = useState<DateOption>('All dates');
  const [updateType, setUpdateType] = useState<UpdateTypeOption>('All updates');

  const [activeModal, setActiveModal] = useState<'sort' | 'date' | 'type' | null>(null);

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

  const selectUpdateTypeOption = (opt: UpdateTypeOption) => {
    haptics.medium();
    setUpdateType(opt);
    setActiveModal(null);
    showToast({ message: `Update type: ${opt}`, type: 'success' });
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
          Account history
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

          {/* Update Type Pill */}
          <Pressable
            onPress={() => { haptics.light(); setActiveModal('type'); }}
            style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorderColor }]}
          >
            <Text style={[styles.pillText, { color: labelColor }]}>{updateType}</Text>
            <Feather name="chevron-down" size={14} color={labelColor} style={styles.pillIcon} />
          </Pressable>
        </ScrollView>
      </View>

      {/* Account History List */}
      <FlatList
        data={mockHistoryData}
        keyExtractor={(item) => item.sectionTitle}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.infoBlock}>
            <Text style={[styles.infoTitle, { color: labelColor }]}>About account history</Text>
            <Text style={[styles.infoDesc, { color: descColor }]}>
              Review changes you've made to your account since you created it.
            </Text>
          </View>
        }
        renderItem={({ item: section, index: sIdx }) => (
          <Animated.View entering={FadeInDown.delay(100 + sIdx * 50).duration(250)} style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>{section.sectionTitle}</Text>
            <View style={styles.listCard}>
              {section.data.map((item, index) => (
                <View key={item.id}>
                  {index > 0 && (
                    <View style={[styles.innerDivider, { backgroundColor: isDark ? '#262626' : '#EEEEEE' }]} />
                  )}
                  <Pressable
                    onPress={() => showToast({ message: `History item: ${item.title}`, type: 'info' })}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
                    ]}
                  >
                    {/* Circle icon */}
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? '#262626' : '#F5F5F5' }]}>
                      {item.iconName === 'eye' ? (
                        <Feather name="eye" size={18} color={labelColor} />
                      ) : item.iconName === 'mail' ? (
                        <Feather name="mail" size={18} color={labelColor} />
                      ) : (
                        <Feather name="info" size={18} color={labelColor} />
                      )}
                    </View>

                    {/* Text block */}
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowTitle, { color: labelColor }]}>{item.title}</Text>
                      <Text style={[styles.rowDescText, { color: descColor }]}>
                        {item.desc}{' '}
                        <Text style={[styles.timeText, { color: descColor }]}>{item.time}</Text>
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color={isDark ? '#555555' : '#C7C7CC'} />
                  </Pressable>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      />

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

      {/* Update Type Modal */}
      <Modal visible={activeModal === 'type'} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]} onPress={() => setActiveModal(null)}>
          <Animated.View style={[styles.modalContent, { backgroundColor: modalContentBg }]}>
            <Text style={[styles.modalTitle, { color: labelColor }]}>Update type</Text>
            {(['All updates', 'Privacy changes', 'Email changes', 'Account status'] as UpdateTypeOption[]).map((opt) => (
              <Pressable key={opt} onPress={() => selectUpdateTypeOption(opt)} style={styles.modalOption}>
                <Text style={[styles.optionText, { color: labelColor, fontFamily: updateType === opt ? Fonts.semiBold : Fonts.regular }]}>
                  {opt}
                </Text>
                {updateType === opt && <Ionicons name="checkmark" size={20} color="#3897F0" />}
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
  infoBlock: {
    paddingHorizontal: 24,
    paddingVertical: 22,
    alignItems: 'center',
  },
  infoTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  infoDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionContainer: {
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listCard: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowContent: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    marginBottom: 2,
  },
  rowDescText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },
  timeText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
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
