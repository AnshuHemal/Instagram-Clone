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

export default function AddWordsPhrasesScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [text, setText] = useState('');

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleDone = () => {
    haptics.medium();
    if (text.trim().length > 0) {
      showToast({ message: 'Words and phrases updated successfully', type: 'success' });
    }
    router.back();
  };

  const divColor = isDark ? '#262626' : '#DBDBDB';
  const bannerBgColor = isDark ? '#1C1C1E' : '#F9F9F9';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const inputPlaceholderColor = isDark ? '#555555' : '#CCCCCC';

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
            Add words or phrases
          </Text>

          <Pressable onPress={handleDone} hitSlop={12} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Banner Description */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View style={[styles.banner, { backgroundColor: bannerBgColor, borderTopColor: divColor, borderBottomColor: divColor }]}>
              <Text style={[styles.bannerText, { color: textColor }]}>
                Hide suggested posts with hashtags or captions that have specific words, phrases or emojis.
              </Text>
            </View>
          </Animated.View>

          {/* Input field */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: textColor, borderBottomColor: divColor }]}
              placeholder="Add words separated by commas..."
              placeholderTextColor={inputPlaceholderColor}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Text style={[styles.inputDesc, { color: descColor }]}>
              You can add multiple words, phrases and emojis. Your list can be updated anytime.
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
  doneBtn: {
    padding: 6,
  },
  doneBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16.5,
    color: '#3897EF',
  },
  scroll: {
    flexGrow: 1,
  },
  banner: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  input: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 50,
  },
  inputDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
});
