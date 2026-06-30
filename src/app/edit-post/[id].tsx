/**
 * Edit Post Screen — /edit-post/[id]
 * Allows post owner to edit caption and location.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { haptics } from '@/utils/haptics';

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/posts/${id}`);
        const post = res.data?.data ?? res.data;
        setCaption(post.caption ?? '');
        setLocation(post.location ?? '');
      } catch {
        setError('Failed to load post.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    haptics.medium();
    setIsSaving(true);
    setError('');
    try {
      await api.patch(`/posts/${id}`, { caption: caption.trim() || null, location: location.trim() || null });
      router.back();
    } catch {
      setError('Failed to save. Please try again.');
      haptics.error();
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = caption.trim() || location.trim();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <BlurView
        intensity={isDark ? 60 : 80}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>

        <ThemedText style={styles.headerTitle}>Edit</ThemedText>

        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveBtn, { opacity: isSaving ? 0.6 : 1 }]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#0095F6" />
          ) : (
            <Text style={styles.saveBtnText}>Done</Text>
          )}
        </Pressable>
      </BlurView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
            <Animated.View entering={FadeIn.duration(300)} style={styles.section}>

              {/* Caption field */}
              <View style={[styles.fieldCard, { backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9' }]}>
                <View style={styles.fieldHeader}>
                  <Feather name="align-left" size={16} color={colors.textSecondary} />
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Caption</Text>
                  <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                    {caption.length}/2200
                  </Text>
                </View>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Write a caption..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.captionInput, { color: colors.text, fontFamily: Fonts.regular }]}
                  multiline
                  maxLength={2200}
                  autoFocus
                />
              </View>

              {/* Location field */}
              <View style={[styles.fieldCard, { backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9', marginTop: 16 }]}>
                <View style={styles.fieldHeader}>
                  <Feather name="map-pin" size={16} color={colors.textSecondary} />
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Location</Text>
                </View>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Add location..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.locationInput, { color: colors.text, fontFamily: Fonts.regular }]}
                  maxLength={100}
                  returnKeyType="done"
                />
              </View>

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={16} color="#FF3B30" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  headerBtn: { padding: 8 },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#0095F6',
  },

  content: {
    padding: 20,
  },
  section: {
    gap: 4,
  },

  fieldCard: {
    borderRadius: 16,
    padding: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  fieldLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  charCount: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  captionInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationInput: {
    fontSize: 15,
    minHeight: 40,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  errorText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#FF3B30',
  },
});
