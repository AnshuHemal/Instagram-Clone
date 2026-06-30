import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';
import { InstagramBottomSheet } from '@/components/InstagramBottomSheet';

type SortOption = 'Newest to oldest' | 'Oldest to newest';
type DateOption = 'All dates' | 'Past week' | 'Past month' | 'Past year' | 'Date range';

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

interface UpdateTypeItem {
  name: string;
  icon: string;
}

const updateTypesList: UpdateTypeItem[] = [
  { name: 'Account created', icon: 'info' },
  { name: 'Bio', icon: 'edit-2' },
  { name: 'Email', icon: 'mail' },
  { name: 'Messaging', icon: 'message-circle' },
  { name: 'Name', icon: 'user' },
  { name: 'Password', icon: 'key' },
  { name: 'Phone', icon: 'phone' },
  { name: 'Privacy', icon: 'eye' },
  { name: 'Username', icon: 'at-sign' },
  { name: 'Website', icon: 'link' },
];

export default function AccountHistoryControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sortOrder, setSortOrder] = useState<SortOption>('Newest to oldest');
  const [dateRange, setDateRange] = useState<DateOption>('All dates');
  const [selectedUpdateTypes, setSelectedUpdateTypes] = useState<string[]>([]);
  const [appliedUpdateTypeLabel, setAppliedUpdateTypeLabel] = useState<string>('Update type');

  const [activeModal, setActiveModal] = useState<'sort' | 'date' | 'type' | null>(null);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const selectSortOption = (opt: SortOption) => {
    haptics.medium();
    setSortOrder(opt);
    setActiveModal(null);
    showToast({ message: `Sorted: ${opt}`, type: 'success' });
  };

  const selectDateOption = (opt: DateOption) => {
    haptics.medium();
    if (opt === 'Date range') {
      setActiveModal(null);
      showToast({ message: 'Custom date range picker coming soon', type: 'info' });
      return;
    }
    setDateRange(opt);
    setActiveModal(null);
    showToast({ message: `Date filter: ${opt}`, type: 'success' });
  };

  const toggleUpdateType = (name: string) => {
    haptics.light();
    if (selectedUpdateTypes.includes(name)) {
      setSelectedUpdateTypes((prev) => prev.filter((t) => t !== name));
    } else {
      setSelectedUpdateTypes((prev) => [...prev, name]);
    }
  };

  const clearUpdateTypes = () => {
    haptics.medium();
    setSelectedUpdateTypes([]);
  };

  const applyUpdateTypes = () => {
    haptics.medium();
    setActiveModal(null);
    if (selectedUpdateTypes.length === 0) {
      setAppliedUpdateTypeLabel('Update type');
    } else if (selectedUpdateTypes.length === 1) {
      setAppliedUpdateTypeLabel(selectedUpdateTypes[0]);
    } else {
      setAppliedUpdateTypeLabel(`${selectedUpdateTypes.length} updates`);
    }
    showToast({ message: 'Applied update type filters', type: 'success' });
  };

  // Custom radio UI component
  const renderRadio = (selected: boolean) => (
    <View
      style={[
        styles.radioOuter,
        { borderColor: selected ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#444444' : '#C7C7CC') },
      ]}
    >
      {selected && <View style={[styles.radioInner, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]} />}
    </View>
  );

  // Custom checkbox UI component
  const renderCheckbox = (selected: boolean) => (
    <View
      style={[
        styles.checkboxOuter,
        {
          borderColor: selected ? '#3897F0' : (isDark ? '#444444' : '#C7C7CC'),
          backgroundColor: selected ? '#3897F0' : 'transparent',
        },
      ]}
    >
      {selected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
    </View>
  );

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const pillBg = isDark ? '#1C1C1E' : '#F5F5F5';
  const pillBorderColor = isDark ? '#333333' : '#EAEAEA';

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
            <Text numberOfLines={1} style={[styles.pillText, { color: labelColor, maxWidth: 120 }]}>
              {appliedUpdateTypeLabel}
            </Text>
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
            <Text style={[styles.sectionTitleLabel, { color: labelColor }]}>{section.sectionTitle}</Text>
            <View style={styles.listCard}>
              {section.data.map((item, index) => (
                <View key={item.id}>
                  {index > 0 && (
                    <View style={[styles.innerDivider, { backgroundColor: isDark ? '#262626' : '#EEEEEE' }]} />
                  )}
                  <View style={styles.row}>
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
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      />

      {/* ─────────────────────────────────────────────
          REUSABLE INSTAGRAM BOTTOM SHEETS
          ───────────────────────────────────────────── */}

      {/* Sort Sheet */}
      <InstagramBottomSheet
        visible={activeModal === 'sort'}
        onClose={() => setActiveModal(null)}
        title="Sort by"
        fullHeight={true}
      >
        <View style={[styles.sheetContent, { flex: 1, paddingBottom: insets.bottom + 12 }]}>
          <Pressable onPress={() => selectSortOption('Newest to oldest')} style={styles.sheetRow}>
            <Text style={[styles.sheetRowText, { color: labelColor }]}>Newest to oldest</Text>
            {renderRadio(sortOrder === 'Newest to oldest')}
          </Pressable>
          <Pressable onPress={() => selectSortOption('Oldest to newest')} style={styles.sheetRow}>
            <Text style={[styles.sheetRowText, { color: labelColor }]}>Oldest to newest</Text>
            {renderRadio(sortOrder === 'Oldest to newest')}
          </Pressable>
        </View>
      </InstagramBottomSheet>

      {/* Date Sheet */}
      <InstagramBottomSheet
        visible={activeModal === 'date'}
        onClose={() => setActiveModal(null)}
        title="Filter by date"
        fullHeight={true}
      >
        <View style={[styles.sheetContent, { flex: 1, paddingBottom: insets.bottom + 12 }]}>
          <Pressable onPress={() => selectDateOption('All dates')} style={styles.sheetRow}>
            <Text style={[styles.sheetRowText, { color: labelColor }]}>All dates</Text>
            {renderRadio(dateRange === 'All dates')}
          </Pressable>
          <Pressable onPress={() => selectDateOption('Past week')} style={styles.sheetRow}>
            <Text style={[styles.sheetRowText, { color: labelColor }]}>Past week</Text>
            {renderRadio(dateRange === 'Past week')}
          </Pressable>
          <Pressable onPress={() => selectDateOption('Past month')} style={styles.sheetRow}>
            <Text style={[styles.sheetRowText, { color: labelColor }]}>Past month</Text>
            {renderRadio(dateRange === 'Past month')}
          </Pressable>
          <Pressable onPress={() => selectDateOption('Past year')} style={styles.sheetRow}>
            <Text style={[styles.sheetRowText, { color: labelColor }]}>Past year</Text>
            {renderRadio(dateRange === 'Past year')}
          </Pressable>

          <View style={[styles.sheetDivider, { backgroundColor: isDark ? '#262626' : '#EEEEEE' }]} />

          <Pressable onPress={() => selectDateOption('Date range')} style={styles.sheetRow}>
            <Text style={[styles.sheetRowText, { color: labelColor }]}>Date range</Text>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#555555' : '#8E8E8F'} />
          </Pressable>
        </View>
      </InstagramBottomSheet>

      {/* Update Type Sheet */}
      <InstagramBottomSheet
        visible={activeModal === 'type'}
        onClose={() => setActiveModal(null)}
        title="Filter by update type"
        fullHeight={true}
        headerRight={
          <Pressable onPress={clearUpdateTypes} hitSlop={8}>
            <Text style={[styles.clearBtnText, { color: labelColor }]}>Clear</Text>
          </Pressable>
        }
      >
        <View style={[styles.sheetContent, { flex: 1, paddingBottom: insets.bottom + 12 }]}>
          <ScrollView
            style={[styles.typeScrollContainer, { flex: 1 }]}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {updateTypesList.map((item) => {
              const isChecked = selectedUpdateTypes.includes(item.name);
              return (
                <Pressable
                  key={item.name}
                  onPress={() => toggleUpdateType(item.name)}
                  style={styles.sheetRow}
                >
                  <View style={styles.sheetRowLeft}>
                    <Feather
                      name={item.icon as any}
                      size={18}
                      color={labelColor}
                      style={styles.rowIconMargin}
                    />
                    <Text style={[styles.sheetRowText, { color: labelColor }]}>{item.name}</Text>
                  </View>
                  {renderCheckbox(isChecked)}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Stretched Apply Button */}
          <View style={styles.applyBtnWrapper}>
            <Pressable onPress={applyUpdateTypes} style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </InstagramBottomSheet>
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
  sectionTitleLabel: {
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
  // Sheet custom styles
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  sheetRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIconMargin: {
    marginRight: 12,
  },
  sheetRowText: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  clearBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  typeScrollContainer: {
    width: '100%',
  },
  applyBtnWrapper: {
    paddingTop: 12,
  },
  applyBtn: {
    backgroundColor: '#3897F0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  // Radio
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Checkbox
  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
