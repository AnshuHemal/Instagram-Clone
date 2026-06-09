import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { InstagramLogo } from '@/components/InstagramLogo';

export const FeedHeader: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      {/* Left side: Plus button to create post */}
      <Pressable onPress={() => router.push('/create')} style={styles.iconButton}>
        <Ionicons name="add" size={30} color={colors.text} />
      </Pressable>

      {/* Center: Instagram Text Logo */}
      <View style={styles.logoWrapper}>
        <InstagramLogo color={colors.text} />
      </View>

      {/* Right side: Activity/Heart icon with a red dot badge */}
      <Pressable style={styles.iconButton}>
        <View style={styles.badgeWrapper}>
          <Ionicons name="heart-outline" size={26} color={colors.text} />
          <View style={[styles.badgeDot, { backgroundColor: '#FF3040', borderColor: colors.background }]} />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 54,
    borderBottomWidth: 0.5,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeWrapper: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
