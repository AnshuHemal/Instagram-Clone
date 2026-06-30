import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

interface PermissionItem {
  id: string;
  label: string;
  status: string;
}

export default function DevicePermissionsSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handlePressOption = (item: PermissionItem) => {
    haptics.light();
    router.push({
      pathname: '/device-permission-detail',
      params: { id: item.id }
    });
  };

  const permissions: PermissionItem[] = [
    { id: 'camera', label: 'Camera', status: 'Not allowed' },
    { id: 'contacts', label: 'Contacts', status: 'Allowed' },
    { id: 'location', label: 'Location Services', status: 'Not allowed' },
    { id: 'microphone', label: 'Microphone', status: 'Not allowed' },
    { id: 'notifications', label: 'Notifications', status: 'Allowed' },
    { id: 'photos', label: 'Photos and videos', status: 'Allowed · All' },
  ];

  const sectionHeaderColor = isDark ? '#8E8E8F' : '#737373';
  const textMuted = isDark ? '#A8A8A8' : '#737373';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#262626' : '#DBDBDB' }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Device permissions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section Header */}
        <Text style={[styles.sectionHeader, { color: sectionHeaderColor }]}>
          Your preferences
        </Text>

        {/* List of Permissions */}
        {permissions.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.delay(index * 60).duration(350)}
          >
            <Pressable
              onPress={() => handlePressOption(item)}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? (isDark ? '#1C1C1E' : '#F5F5F5') : 'transparent' }
              ]}
            >
              <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {item.label}
              </Text>
              <View style={styles.rightCol}>
                <Text style={[styles.statusText, { color: textMuted }]}>
                  {item.status}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#8E8E8F" />
              </View>
            </Pressable>
          </Animated.View>
        ))}
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
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    marginLeft: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  rowLabel: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    letterSpacing: -0.15,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
});
