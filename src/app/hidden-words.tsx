import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  Layout,
  FadeOut,
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function HiddenWordsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [inputText, setInputText] = useState('');
  const [words, setWords] = useState<string[]>([]);

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleShare = () => {
    haptics.light();
    showToast({ message: 'Share feature is coming soon!', type: 'info' });
  };

  const handleLearnMore = () => {
    haptics.light();
    showToast({
      message: 'Hidden words filtering applies to comments, replies, and message requests.',
      type: 'info',
    });
  };

  const handleAddWord = () => {
    if (!inputText.trim()) return;

    haptics.medium();
    // Split by commas and trim
    const newWords = inputText
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0 && !words.includes(w));

    if (newWords.length === 0) {
      showToast({ message: 'Word already added or invalid', type: 'error' });
      return;
    }

    setWords((prev) => [...newWords, ...prev]);
    setInputText('');
    showToast({
      message: newWords.length === 1 ? `"${newWords[0]}" added` : `${newWords.length} words added`,
      type: 'success',
    });
  };

  const handleDeleteWord = (wordToDelete: string) => {
    haptics.light();
    setWords((prev) => prev.filter((w) => w !== wordToDelete));
    showToast({ message: `"${wordToDelete}" removed`, type: 'info' });
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const subtitleColor = isDark ? '#737373' : '#262626';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const inputPlaceholderColor = isDark ? '#555555' : '#CCCCCC';
  const emptyStateColor = isDark ? '#555555' : '#8E8E8F';

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
            Hidden words
          </Text>

          <Pressable onPress={handleShare} hitSlop={12} style={styles.shareBtn}>
            <Ionicons name="share-social-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </View>

        {/* Intro Info Section */}
        <View style={styles.introBlock}>
          <Text style={[styles.introText, { color: subtitleColor }]}>
            Comments with these words, including similar misspellings, will be filtered out so they're only visible to authors. Message requests with these words will be moved to spam.
            <Text style={styles.learnMoreLink} onPress={handleLearnMore}> Learn more</Text>
          </Text>
        </View>

        {/* Input Bar */}
        <View style={[styles.inputRow, { borderBottomColor: divColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Add words separated by commas..."
            placeholderTextColor={inputPlaceholderColor}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleAddWord}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={handleAddWord}
            hitSlop={12}
            style={({ pressed }) => [
              styles.addBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        {/* Words List */}
        <FlatList
          data={words}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.delay(150).duration(350)} style={styles.emptyState}>
              <Feather name="eye-off" size={48} color={emptyStateColor} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: emptyStateColor }]}>
                No custom words or phrases added yet.
              </Text>
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 30).duration(250)}
              exiting={FadeOut.duration(200)}
              layout={Layout.springify()}
              style={[styles.wordRow, { borderBottomColor: isDark ? '#1C1C1E' : '#F5F5F5' }]}
            >
              <Text style={[styles.wordText, { color: textColor }]}>{item}</Text>
              <Pressable
                onPress={() => handleDeleteWord(item)}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Feather name="trash-2" size={18} color="#FF3B30" />
              </Pressable>
            </Animated.View>
          )}
        />
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
  },
  shareBtn: {
    padding: 6,
  },
  scroll: {
    flexGrow: 1,
  },
  introBlock: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  introText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  learnMoreLink: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#3897EF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    flex: 1,
    paddingVertical: 8,
    marginRight: 12,
  },
  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#3897EF',
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wordText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    flex: 1,
    paddingRight: 12,
  },
  deleteBtn: {
    padding: 6,
  },
});
