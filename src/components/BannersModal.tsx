import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';

interface BannersModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BannersModal: React.FC<BannersModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      onClose();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
    };
  }, [visible, onClose]);

  const handleFacebookPress = () => {
    showToast({
      title: 'Banners',
      message: 'Facebook profile linking will be available shortly.',
      type: 'info',
    });
  };

  const handleMusicPress = () => {
    showToast({
      title: 'Banners',
      message: 'Music banner configuration will be available shortly.',
      type: 'info',
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.absoluteFill}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={[styles.overlay, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} style={styles.headerButton} hitSlop={8}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>

            <ThemedText type="subtitle" style={[styles.headerTitle, { color: colors.text }]}>
              Banners
            </ThemedText>

            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* On your profile Section */}
            <Animated.View entering={FadeInDown.duration(300).delay(50)}>
              <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>
                On your profile
              </ThemedText>
              
              <ThemedText style={[styles.mainTitle, { color: colors.text }]}>
                Say more with banners
              </ThemedText>
              
              <ThemedText style={[styles.mainSubtitle, { color: colors.textSecondary }]}>
                Share more about who you are and what you care about. This helps others discover similar interests and connect with you.
              </ThemedText>
            </Animated.View>

            {/* Add to profile Section */}
            <Animated.View entering={FadeInDown.duration(300).delay(150)} style={styles.addToProfileSection}>
              <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>
                Add to profile
              </ThemedText>

              {/* Facebook Profile Row */}
              <Pressable
                style={styles.optionRow}
                onPress={handleFacebookPress}
              >
                <View style={[styles.iconContainer, { borderColor: isDark ? '#333' : '#E5E5E5' }]}>
                  <Ionicons name="add" size={20} color={colors.text} />
                </View>
                <FontAwesome name="facebook-square" size={22} color="#1877F2" style={styles.platformIcon} />
                <ThemedText style={[styles.optionText, { color: colors.text }]}>
                  Facebook profile
                </ThemedText>
              </Pressable>

              {/* Music Row */}
              <Pressable
                style={styles.optionRow}
                onPress={handleMusicPress}
              >
                <View style={[styles.iconContainer, { borderColor: isDark ? '#333' : '#E5E5E5' }]}>
                  <Ionicons name="add" size={20} color={colors.text} />
                </View>
                <Ionicons name="musical-notes-outline" size={22} color={colors.text} style={styles.platformIcon} />
                <ThemedText style={[styles.optionText, { color: colors.text }]}>
                  Music
                </ThemedText>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteFill: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    height: 50,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    marginBottom: 16,
  },
  mainTitle: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    marginBottom: 8,
  },
  mainSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
  },
  addToProfileSection: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformIcon: {
    marginLeft: 4,
  },
  optionText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
});
