import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

type SelectionType = 'followers' | 'no_one';

export default function FriendsFeedActivityScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedOption, setSelectedOption] = useState<SelectionType>('followers');

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const handleSelect = (option: SelectionType) => {
    haptics.light();
    setSelectedOption(option);
  };

  const RadioButton = ({ selected }: { selected: boolean }) => (
    <View style={[
      styles.radioOuter,
      { borderColor: selected ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#555555' : '#CCCCCC') }
    ]}>
      {selected && (
        <View style={[
          styles.radioInner,
          { backgroundColor: isDark ? '#FFFFFF' : '#000000' }
        ]} />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Activity in Friends feed</Text>
      </View>

      <View style={styles.content}>
        {/* Section Header Description */}
        <Text style={[styles.sectionDesc, { color: isDark ? '#A8A8A8' : '#737373' }]}>
          Who can see your likes and comments on reels in the Friends feed
        </Text>

        {/* Options List */}
        <View style={styles.optionsList}>
          {/* Option 1: Followers you follow back */}
          <Pressable
            onPress={() => handleSelect('followers')}
            style={styles.optionRow}
          >
            <Text style={[styles.optionLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Followers you follow back
            </Text>
            <RadioButton selected={selectedOption === 'followers'} />
          </Pressable>

          {/* Option 2: No one */}
          <Pressable
            onPress={() => handleSelect('no_one')}
            style={styles.optionRow}
          >
            <Text style={[styles.optionLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              No one
            </Text>
            <RadioButton selected={selectedOption === 'no_one'} />
          </Pressable>
        </View>

        {/* Footer Info */}
        <Text style={[styles.footerDesc, { color: isDark ? '#8E8E8F' : '#737373' }]}>
          Choose who can see your likes and comments on reels in the Friends feed.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  headerBackBtn: {
    position: 'absolute',
    left: 12,
    bottom: 8,
    padding: 6,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionDesc: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    lineHeight: 20,
    marginBottom: 24,
  },
  optionsList: {
    marginBottom: 18,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  optionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    flex: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footerDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },
});
