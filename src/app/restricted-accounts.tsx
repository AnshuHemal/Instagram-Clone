import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function RestrictedAccountsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleLearnMore = () => {
    haptics.light();
    showToast({
      message: 'When you restrict someone, only you and they will see their new comments on your posts.',
      type: 'info',
    });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const subtitleColor = isDark ? '#8E8E8F' : '#262626';
  const inputBgColor = isDark ? '#262626' : '#EFEFEF';
  const inputPlaceholderColor = isDark ? '#737373' : '#8E8E8F';
  const inputTextColor = isDark ? '#FFFFFF' : '#000000';
  const emptyTextColor = isDark ? '#A8A8A8' : '#737373';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
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
            Restricted accounts
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle / Intro block */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.introBlock}>
            <Text style={[styles.introText, { color: subtitleColor }]}>
              Limit interactions from someone without having to block or unfollow them.
            </Text>
            <Pressable onPress={handleLearnMore} hitSlop={8}>
              <Text style={styles.learnMoreLink}>Learn how it works</Text>
            </Pressable>
          </Animated.View>

          <View style={[styles.thickDivider, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }]} />

          {/* Search Bar */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: inputBgColor }]}>
              <Ionicons
                name="search"
                size={18}
                color={inputPlaceholderColor}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: inputTextColor }]}
                placeholder="Search"
                placeholderTextColor={inputPlaceholderColor}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setSearchQuery('');
                  }}
                  hitSlop={8}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={inputPlaceholderColor}
                    style={{ marginRight: 8 }}
                  />
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Empty State / Search Results */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: emptyTextColor }]}>
              {searchQuery.length > 0
                ? `No accounts found matching "${searchQuery}"`
                : 'You haven\'t restricted anyone.'}
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 12,
    bottom: 8,
    padding: 6,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    letterSpacing: -0.4,
  },
  scroll: {
    flexGrow: 1,
  },
  introBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    textAlign: 'center',
  },
  introText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  learnMoreLink: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: '#3897EF',
    marginTop: 2,
  },
  thickDivider: {
    height: 1,
    width: '100%',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 8,
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    paddingVertical: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    minHeight: 250,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    textAlign: 'center',
    lineHeight: 22,
  },
});
