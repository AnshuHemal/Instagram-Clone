import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { DiscardChangesModal } from './DiscardChangesModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProfileFieldModalProps {
  visible: boolean;
  title: string;
  label: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  helperText?: string;
  editable?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onClose: () => void;
  onSave: (value: string) => void;
}

export const ProfileFieldModal: React.FC<ProfileFieldModalProps> = ({
  visible,
  title,
  label,
  value: initialValue,
  placeholder = '',
  maxLength,
  multiline = false,
  helperText,
  editable = true,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  onClose,
  onSave,
}) => {
  const { colors, isDark } = useTheme();
  const [value, setValue] = useState(initialValue);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const checkmarkScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setHasChanges(false);
      // Auto-focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible, initialValue]);

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
  }, [visible, hasChanges, value, initialValue, isSaving]);

  useEffect(() => {
    setHasChanges(value !== initialValue);
  }, [value, initialValue]);

  const handleSave = async () => {
    if (!hasChanges || !editable || isSaving) return;

    setIsSaving(true);
    checkmarkScale.value = withTiming(0.8, { duration: 100 }, () => {
      checkmarkScale.value = withTiming(1, { duration: 100 });
    });

    try {
      await onSave(value);
      onClose();
    } catch (err) {
      console.error('Failed to save profile field:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Pressable onPress={handleClose} style={styles.headerButton} hitSlop={8} disabled={isSaving}>
                <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>

              <ThemedText type="subtitle" style={[styles.headerTitle, { color: colors.text }]}>
                {title}
              </ThemedText>

              <Animated.View style={checkmarkStyle}>
                <Pressable
                  onPress={handleSave}
                  disabled={!hasChanges || !editable || isSaving}
                  style={[
                    styles.headerButton,
                    { opacity: hasChanges && editable && !isSaving ? 1 : 0.3 },
                  ]}
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
              {/* Input Field */}
              <View
                style={[
                  styles.inputContainer,
                  multiline && styles.inputContainerMultiline,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    borderColor: isDark ? '#38383A' : '#E5E5E5',
                  },
                ]}
              >
                <View style={styles.inputHeader}>
                  <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    {label}
                  </ThemedText>
                  {multiline && maxLength && (
                    <ThemedText style={[styles.charCountInline, { color: colors.textSecondary }]}>
                      {value.length}/{maxLength}
                    </ThemedText>
                  )}
                </View>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    multiline && styles.inputMultiline,
                    { color: colors.text },
                  ]}
                  value={value}
                  onChangeText={setValue}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textSecondary}
                  maxLength={maxLength}
                  multiline={multiline}
                  textAlignVertical={multiline ? 'top' : 'auto'}
                  editable={editable}
                  keyboardType={keyboardType}
                  autoCapitalize={autoCapitalize}
                  autoCorrect={false}
                />
              </View>

              {/* Helper Text */}
              {helperText && (
                <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
                  {helperText}
                </ThemedText>
              )}

              {/* Additional Info */}
              {title === 'Name' && (
                <ThemedText style={[styles.helperText, { color: colors.textSecondary, marginTop: 8 }]}>
                  You can only change your name twice within 14 days.
                </ThemedText>
              )}
            </View>
          </KeyboardAvoidingView>
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

// ─── Field Row (tappable) ─────────────────────────────────────────────────────

interface FieldRowProps {
  label: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
  isDark: boolean;
  colors: any;
  delay?: number;
}

export const FieldRow: React.FC<FieldRowProps> = ({
  label,
  value,
  placeholder = '',
  onPress,
  isDark,
  colors,
  delay = 0,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hasValue = value.length > 0;

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(delay)}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.fieldRow,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? '#38383A' : '#E5E5E5',
            },
          ]}
        >
          <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            {label}
          </ThemedText>
          <ThemedText
            style={[
              styles.fieldValue,
              {
                color: hasValue ? colors.text : colors.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {hasValue ? value : placeholder}
          </ThemedText>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  keyboardView: {
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
    fontFamily: Fonts.semiBold,
    fontSize: 17,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 70,
  },
  inputContainerMultiline: {
    minHeight: 140,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  charCountInline: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  input: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    padding: 0,
    margin: 0,
    lineHeight: 24,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 4,
  },
  helperText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 16,
    lineHeight: 18,
  },

  // ── Field Row
  fieldRow: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 60,
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
});
