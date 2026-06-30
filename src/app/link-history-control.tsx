import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
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

interface LinkHistoryItem {
  id: string;
  title: string;
  url: string;
  time: string;
}

const mockLinkData: LinkHistoryItem[] = [
  {
    id: '1',
    title: 'Community Standards | Transparency Center',
    url: 'https://transparency.meta.com/policies/community-standards/',
    time: 'Yesterday',
  },
];

export default function LinkHistoryControlScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [historyItems, setHistoryItems] = useState<LinkHistoryItem[]>(mockLinkData);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleClearAll = () => {
    haptics.medium();
    setHistoryItems([]);
    showToast({
      message: 'Cleared all link history',
      type: 'success',
    });
  };

  const handleRemoveItem = (id: string) => {
    haptics.light();
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    showToast({
      message: 'Removed link from history',
      type: 'success',
    });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const linkBoxBg = isDark ? '#1C1C1E' : '#F5F5F5';

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
          <Ionicons name="close" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Link history
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={historyItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          historyItems.length > 0 ? (
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: labelColor }]}>Recently visited</Text>
              <Pressable onPress={handleClearAll}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.iconCircle, { backgroundColor: linkBoxBg }]}>
                <Feather name="link" size={32} color={isDark ? '#555555' : '#BDBDBD'} />
              </View>
              <Text style={[styles.emptyTitle, { color: labelColor }]}>No link history</Text>
              <Text style={[styles.emptyDesc, { color: descColor }]}>
                Links you visit within Instagram will appear here.
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(200)}>
            <View style={styles.row}>
              {/* Link Box icon */}
              <View style={[styles.linkBox, { backgroundColor: linkBoxBg, borderColor: divColor }]}>
                <Feather name="link" size={20} color={labelColor} />
              </View>

              {/* Texts block */}
              <View style={styles.textBlock}>
                <Text numberOfLines={1} style={[styles.rowTitle, { color: labelColor }]}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={[styles.rowUrl, { color: descColor }]}>
                  {item.url}
                </Text>
                <Text style={[styles.rowTime, { color: descColor }]}>{item.time}</Text>
              </View>

              {/* Remove individual close */}
              <Pressable onPress={() => handleRemoveItem(item.id)} hitSlop={12} style={styles.removeBtn}>
                <Ionicons name="close" size={20} color={isDark ? '#737373' : '#8E8E8F'} />
              </Pressable>
            </View>
          </Animated.View>
        )}
      />
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  clearAllText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    color: '#3897F0',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  linkBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    marginBottom: 3,
  },
  rowUrl: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    marginBottom: 2,
  },
  rowTime: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
  },
  removeBtn: {
    padding: 6,
  },
});
