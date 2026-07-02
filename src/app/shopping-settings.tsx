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
import { CustomSwitch } from '@/components/CustomSwitch';

export default function ShoppingSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [accountsFollow, setAccountsFollow] = useState(true);
  const [suggestedForYou, setSuggestedForYou] = useState(true);

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
          Shopping
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)}>
          {/* Accounts you follow row */}
          <View style={styles.toggleRow}>
            <View style={styles.labelCol}>
              <Text style={[styles.rowTitle, { color: labelColor }]}>Accounts you follow</Text>
              <Text style={[styles.rowDesc, { color: descColor }]}>
                Get notified when accounts you follow add new products to their shops.
              </Text>
            </View>
            <CustomSwitch
              value={accountsFollow}
              onValueChange={(val) => {
                setAccountsFollow(val);
                showToast({
                  message: val ? 'Accounts follow shopping enabled' : 'Accounts follow shopping disabled',
                  type: 'info',
                });
              }}
              isDark={isDark}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: divColor }]} />

          {/* Suggested for you row */}
          <View style={styles.toggleRow}>
            <View style={styles.labelCol}>
              <Text style={[styles.rowTitle, { color: labelColor }]}>Suggested for you</Text>
              <Text style={[styles.rowDesc, { color: descColor }]}>
                Get notified about products and shops you may like based on your activity on Instagram. If you've set up your Accounts Center with Facebook, it will also be based on your activity on Facebook.
              </Text>
            </View>
            <CustomSwitch
              value={suggestedForYou}
              onValueChange={(val) => {
                setSuggestedForYou(val);
                showToast({
                  message: val ? 'Suggested shopping enabled' : 'Suggested shopping disabled',
                  type: 'info',
                });
              }}
              isDark={isDark}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: divColor }]} />

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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  labelCol: {
    flex: 1,
    paddingRight: 24,
  },
  rowTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    marginBottom: 6,
  },
  rowDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
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
