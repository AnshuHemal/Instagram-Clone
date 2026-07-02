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

export default function EmailNotificationsSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [feedbackEmails, setFeedbackEmails] = useState<'off' | 'on'>('on');
  const [reminderEmails, setReminderEmails] = useState<'off' | 'on'>('on');
  const [productEmails, setProductEmails] = useState<'off' | 'on'>('on');
  const [newsEmails, setNewsEmails] = useState<'off' | 'on'>('on');
  const [supportEmails, setSupportEmails] = useState<'off' | 'on'>('on');

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const divColor = isDark ? '#262626' : '#EFEFEF';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const labelColor = isDark ? '#FFFFFF' : '#000000';

  const renderRadioRow = (
    sectionLabel: string,
    currentValue: 'off' | 'on',
    setValue: (val: 'off' | 'on') => void,
    description: string
  ) => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: labelColor }]}>{sectionLabel}</Text>
        
        {/* Off Option */}
        <Pressable
          onPress={() => {
            haptics.light();
            setValue('off');
          }}
          style={styles.radioRow}
        >
          <Text style={[styles.radioLabel, { color: labelColor }]}>Off</Text>
          <View style={[
            styles.radioOuter,
            { borderColor: currentValue === 'off' ? (isDark ? '#FFFFFF' : '#000000') : '#BDBDBD' }
          ]}>
            {currentValue === 'off' && (
              <View style={[styles.radioInner, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]} />
            )}
          </View>
        </Pressable>

        {/* On Option */}
        <Pressable
          onPress={() => {
            haptics.light();
            setValue('on');
          }}
          style={styles.radioRow}
        >
          <Text style={[styles.radioLabel, { color: labelColor }]}>On</Text>
          <View style={[
            styles.radioOuter,
            { borderColor: currentValue === 'on' ? (isDark ? '#FFFFFF' : '#000000') : '#BDBDBD' }
          ]}>
            {currentValue === 'on' && (
              <View style={[styles.radioInner, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]} />
            )}
          </View>
        </Pressable>

        <Text style={[styles.sectionDesc, { color: descColor }]}>{description}</Text>
        <View style={[styles.divider, { backgroundColor: divColor }]} />
      </View>
    );
  };

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
          Email notifications
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)}>
          {renderRadioRow('Feedback emails', feedbackEmails, setFeedbackEmails, 'Give feedback on Instagram.')}
          {renderRadioRow('Reminder emails', reminderEmails, setReminderEmails, 'Get notifications you may have missed.')}
          {renderRadioRow('Product emails', productEmails, setProductEmails, "Get tips and resources about Instagram's tools.")}
          {renderRadioRow('News emails', newsEmails, setNewsEmails, 'Learn about new Instagram features.')}
          {renderRadioRow('Support emails', supportEmails, setSupportEmails, "Get updates on reports and violations of our Community Standards.")}
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
    fontSize: 16,
    marginBottom: 10,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  radioLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16,
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
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 4,
  },
});
