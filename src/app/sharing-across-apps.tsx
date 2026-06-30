import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function SharingAcrossAppsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    haptics.light();
    requestAnimationFrame(() => {
      router.back();
    });
  };

  const handleAction = (feature: string) => {
    haptics.light();
    showToast({ message: `${feature} integration is coming soon!`, type: 'info' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Sharing across apps</Text>
      </View>

      <View style={styles.content}>
        {/* Section: Share to */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>Share to</Text>

        {/* Facebook Row */}
        <View style={styles.facebookRow}>
          <View style={[styles.facebookIconContainer, { borderColor: isDark ? '#444444' : '#DBDBDB' }]}>
            <Ionicons name="logo-facebook" size={30} color={isDark ? '#FFFFFF' : '#1877F2'} />
          </View>
          <Text style={[styles.facebookLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Facebook</Text>
          
          <Pressable
            onPress={() => handleAction('Facebook Link')}
            style={({ pressed }) => [
              styles.addAccountBtn,
              { opacity: pressed ? 0.85 : 1 }
            ]}
          >
            <Text style={styles.addAccountBtnText}>Add account</Text>
          </Pressable>
        </View>

        {/* Separator Line */}
        <View style={[styles.separator, { backgroundColor: isDark ? '#262626' : '#EFEFEF' }]} />

        {/* Accounts Center Row */}
        <Pressable
          onPress={() => handleAction('Meta Accounts Center')}
          style={({ pressed }) => [
            styles.accountsCenterRow,
            { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
          ]}
        >
          <Text style={[styles.accountsCenterLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Accounts Center</Text>
          <Ionicons name="chevron-forward" size={18} color="#8E8E8F" />
        </Pressable>

        {/* Accounts Center Description */}
        <Text style={[styles.accountsCenterDesc, { color: isDark ? '#A8A8A8' : '#737373' }]}>
          Manage connected experiences and account settings across Meta technologies like Facebook, Instagram and Meta Horizon.
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
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  facebookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  facebookIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  facebookLabel: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 16.5,
  },
  addAccountBtn: {
    backgroundColor: '#3797EF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  addAccountBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 10,
  },
  accountsCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  accountsCenterLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16.5,
  },
  accountsCenterDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 19,
    marginTop: 10,
    paddingHorizontal: 4,
  },
});
