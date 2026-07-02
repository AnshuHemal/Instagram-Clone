import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function MessagesSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messageRequests, setMessageRequests] = useState<'off' | 'on'>('off');
  const [messagesIndividualGroup, setMessagesIndividualGroup] = useState<'off' | 'on'>('off');
  const [messageReminders, setMessageReminders] = useState<'off' | 'follow' | 'everyone'>('everyone');
  const [groupRequests, setGroupRequests] = useState<'off' | 'on'>('on');
  const [channelInvites, setChannelInvites] = useState<'off' | 'on'>('on');
  const [channelMessages, setChannelMessages] = useState<'off' | 'personalized' | 'on'>('personalized');
  const [channelReplies, setChannelReplies] = useState<'off' | 'follow' | 'everyone'>('follow');
  const [channelReplyLikes, setChannelReplyLikes] = useState<'off' | 'on'>('on');
  const [socialChannelMessages, setSocialChannelMessages] = useState<'off' | 'on'>('on');

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleSystemSettingsPress = () => {
    haptics.light();
    Linking.openSettings().catch((err) => {
      console.error('Failed to open settings:', err);
      showToast({
        message: 'Unable to open system settings',
        type: 'error',
      });
    });
  };

  const divColor = isDark ? '#262626' : '#EFEFEF';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const labelColor = isDark ? '#FFFFFF' : '#000000';

  const renderRadioOption = (
    label: string,
    value: string,
    currentValue: string,
    onPress: () => void
  ) => {
    const isSelected = currentValue === value;
    return (
      <Pressable onPress={onPress} style={styles.radioRow}>
        <Text style={[styles.radioLabel, { color: labelColor }]}>{label}</Text>
        <View style={[
          styles.radioOuter,
          { borderColor: isSelected ? (isDark ? '#FFFFFF' : '#000000') : '#BDBDBD' }
        ]}>
          {isSelected && (
            <View style={[styles.radioInner, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]} />
          )}
        </View>
      </Pressable>
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
          Messages
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)}>
          {/* Message requests */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Message requests</Text>
            {renderRadioOption('Off', 'off', messageRequests, () => { haptics.light(); setMessageRequests('off'); })}
            {renderRadioOption('On', 'on', messageRequests, () => { haptics.light(); setMessageRequests('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed wants to send you a message.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Messages from individual and group chats */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Messages from individual and group chats</Text>
            {renderRadioOption('Off', 'off', messagesIndividualGroup, () => { haptics.light(); setMessagesIndividualGroup('off'); })}
            {renderRadioOption('On', 'on', messagesIndividualGroup, () => { haptics.light(); setMessagesIndividualGroup('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed sent you a message.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Message reminders */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Message reminders</Text>
            {renderRadioOption('Off', 'off', messageReminders, () => { haptics.light(); setMessageReminders('off'); })}
            {renderRadioOption('From profiles I follow', 'follow', messageReminders, () => { haptics.light(); setMessageReminders('follow'); })}
            {renderRadioOption('From everyone', 'everyone', messageReminders, () => { haptics.light(); setMessageReminders('everyone'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed sent you a message (1d ago).</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Group requests */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Group requests</Text>
            {renderRadioOption('Off', 'off', groupRequests, () => { haptics.light(); setGroupRequests('off'); })}
            {renderRadioOption('On', 'on', groupRequests, () => { haptics.light(); setGroupRequests('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed wants to add janeappleseed to your group.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Channel invites */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Channel invites</Text>
            {renderRadioOption('Off', 'off', channelInvites, () => { haptics.light(); setChannelInvites('off'); })}
            {renderRadioOption('On', 'on', channelInvites, () => { haptics.light(); setChannelInvites('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed invited you to join their channel: Hello World!</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Channel messages */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Channel messages</Text>
            {renderRadioOption('Off', 'off', channelMessages, () => { haptics.light(); setChannelMessages('off'); })}
            {renderRadioOption('Personalized for you', 'personalized', channelMessages, () => { haptics.light(); setChannelMessages('personalized'); })}
            {renderRadioOption('On', 'on', channelMessages, () => { haptics.light(); setChannelMessages('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed sent you a message.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Channel replies */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Channel replies</Text>
            {renderRadioOption('Off', 'off', channelReplies, () => { haptics.light(); setChannelReplies('off'); })}
            {renderRadioOption('From profiles I follow', 'follow', channelReplies, () => { haptics.light(); setChannelReplies('follow'); })}
            {renderRadioOption('From everyone', 'everyone', channelReplies, () => { haptics.light(); setChannelReplies('everyone'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed replied: Nice shot!</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Channel reply likes */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Channel reply likes</Text>
            {renderRadioOption('Off', 'off', channelReplyLikes, () => { haptics.light(); setChannelReplyLikes('off'); })}
            {renderRadioOption('On', 'on', channelReplyLikes, () => { haptics.light(); setChannelReplyLikes('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed liked your reply: Thanks!</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Social channel messages */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Social channel messages</Text>
            {renderRadioOption('Off', 'off', socialChannelMessages, () => { haptics.light(); setSocialChannelMessages('off'); })}
            {renderRadioOption('On', 'on', socialChannelMessages, () => { haptics.light(); setSocialChannelMessages('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed sent you a message.</Text>
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
    fontFamily: Fonts.semiBold,
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
    lineHeight: 18.5,
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
