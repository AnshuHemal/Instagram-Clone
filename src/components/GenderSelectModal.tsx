import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { DiscardChangesModal } from './DiscardChangesModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

interface GenderSelectModalProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSave: (value: string) => void | Promise<void>;
}

const GENDER_OPTIONS = [
  'Female',
  'Male',
  'Custom',
  'Prefer not to say',
];

export const GenderSelectModal: React.FC<GenderSelectModalProps> = ({
  visible,
  value: initialValue,
  onClose,
  onSave,
}) => {
  const { colors, isDark } = useTheme();
  const [selectedGender, setSelectedGender] = useState(initialValue);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const checkmarkScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setSelectedGender(initialValue);
    }
  }, [visible, initialValue]);

  const handleClose = () => {
    if (isSaving) return;
    if (selectedGender !== initialValue) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      if (isSaving) return true;
      handleClose();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
    };
  }, [visible, selectedGender, initialValue, onClose, isSaving]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    checkmarkScale.value = withTiming(0.8, { duration: 100 }, () => {
      checkmarkScale.value = withTiming(1, { duration: 100 });
    });

    try {
      await onSave(selectedGender);
      onClose();
    } catch (err) {
      console.error('Failed to save gender:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

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
            <Pressable onPress={handleClose} style={styles.headerButton} hitSlop={8} disabled={isSaving}>
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>

            <ThemedText type="subtitle" style={[styles.headerTitle, { color: colors.text }]}>
              Gender
            </ThemedText>

            <Animated.View style={checkmarkStyle}>
              <Pressable
                onPress={handleSave}
                style={styles.headerButton}
                hitSlop={8}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#0095F6" />
                ) : (
                  <Ionicons name="checkmark" size={28} color="#0095F6" />
                )}
              </Pressable>
            </Animated.View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
              This won't be part of your public profile.
            </ThemedText>

            {/* List of Gender Options */}
            <View style={styles.optionsList}>
              {GENDER_OPTIONS.map((option, index) => {
                const isSelected = selectedGender === option;
                return (
                  <Animated.View
                    key={option}
                    entering={FadeInDown.duration(300).delay(index * 60)}
                  >
                    <Pressable
                      style={styles.optionItem}
                      onPress={() => setSelectedGender(option)}
                    >
                      <ThemedText
                        style={[
                          styles.optionText,
                          { color: colors.text },
                        ]}
                      >
                        {option}
                      </ThemedText>
                      
                      {/* Radio button circle */}
                      <View
                        style={[
                          styles.radioCircle,
                          { borderColor: isSelected ? colors.text : (isDark ? '#444' : '#C7C7CC') },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[
                              styles.radioDot,
                              { backgroundColor: colors.text },
                            ]}
                          />
                        )}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <DiscardChangesModal
        visible={showDiscardConfirm}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  helperText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  optionText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
