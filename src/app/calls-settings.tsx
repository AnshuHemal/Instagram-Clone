import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function CallsSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [videoChats, setVideoChats] = useState<'off' | 'follow' | 'everyone'>('off');

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleSystemSettingsPress = () => {
    haptics.light();
    showToast({
      message: 'Opening system settings details...',
      type: 'info',
    });
  };

  const divColor = isDark ? '#262626' : '#EFEFEF';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const labelColor = isDark ? '#FFFFFF' : '#000000';

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
          Calls
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Video Chats</Text>
            
            {/* Off */}
            <Pressable
              onPress={() => {
                haptics.light();
                setVideoChats('off');
              }}
              style={styles.radioRow}
            >
              <Text style={[styles.radioLabel, { color: labelColor }]}>Off</Text>
              <View style={[
                styles.radioOuter,
                { borderColor: videoChats === 'off' ? (isDark ? '#FFFFFF' : '#000000') : '#BDBDBD' }
              ]}>
                {videoChats === 'off' && (
                  <View style={[styles.radioInner, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]} />
                )}
              </View>
            </Pressable>

            {/* From profiles I follow */}
            <Pressable
              onPress={() => {
                haptics.light();
                setVideoChats('follow');
              }}
              style={styles.radioRow}
            >
              <Text style={[styles.radioLabel, { color: labelColor }]}>From profiles I follow</Text>
              <View style={[
                styles.radioOuter,
                { borderColor: videoChats === 'follow' ? (isDark ? '#FFFFFF' : '#000000') : '#BDBDBD' }
              ]}>
                {videoChats === 'follow' && (
                  <View style={[styles.radioInner, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]} />
                )}
              </View>
            </Pressable>

            {/* From everyone */}
            <Pressable
              onPress={() => {
                haptics.light();
                setVideoChats('everyone');
              }}
              style={styles.radioRow}
            >
              <Text style={[styles.radioLabel, { color: labelColor }]}>From everyone</Text>
              <View style={[
                styles.radioOuter,
                { borderColor: videoChats === 'everyone' ? (isDark ? '#FFFFFF' : '#000000') : '#BDBDBD' }
              ]}>
                {videoChats === 'everyone' && (
                  <View style={[styles.radioInner, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]} />
                )}
              </View>
            </Pressable>

            <Text style={[styles.sectionDesc, { color: descColor }]}>Incoming video chat from johnappleseed.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Additional Options */}
          <Pressable
            onPress={handleSystemSettingsPress}
            style={styles.systemSettingsRow}
          >
            <Text style={[styles.systemSettingsText, { color: '#3897F0' }]}>
              Additional options in system settings...
            </Text>
            <Text style={[styles.systemSettingsDesc, { color: descColor }]}>
              These settings affect any Instagram accounts logged into this device
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
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
    fontSize: 20,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 0,
  },
  scroll: {
    paddingTop: 16,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  radioLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    marginTop: 6,
    marginBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 4,
  },
  systemSettingsRow: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  systemSettingsText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    marginBottom: 8,
  },
  systemSettingsDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
