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
  ScrollView,
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
import { api } from '@/services/api';

interface UsernameEditModalProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSave: (value: string) => void | Promise<void>;
}

export const UsernameEditModal: React.FC<UsernameEditModalProps> = ({
  visible,
  value: initialValue,
  onClose,
  onSave,
}) => {
  const { colors, isDark } = useTheme();
  const [username, setUsername] = useState(initialValue);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const checkmarkScale = useSharedValue(1);

  // Sync state on visibility change
  useEffect(() => {
    if (visible) {
      setUsername(initialValue);
      setError('');
      setSuggestions([]);
      setChecking(false);
      setHasChanges(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible, initialValue]);

  // Debounced username availability check
  useEffect(() => {
    if (!visible) return;

    const cleaned = username.trim().toLowerCase();
    setHasChanges(cleaned !== initialValue.toLowerCase());

    if (!cleaned || cleaned === initialValue.toLowerCase()) {
      setError('');
      setSuggestions([]);
      setChecking(false);
      return;
    }

    if (cleaned.length < 3) {
      setError('Please choose a username of at least 3 characters.');
      setSuggestions([]);
      setChecking(false);
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(cleaned)) {
      setError('Username can only contain letters, numbers, underscores, and periods.');
      setSuggestions([]);
      setChecking(false);
      return;
    }

    setChecking(true);

    const checkAvailability = async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${encodeURIComponent(cleaned)}`);
        const { available, suggestions: suggs } = res.data.data || res.data;
        if (!available) {
          setError(`The username ${username} is not available.`);
          setSuggestions(suggs || []);
        } else {
          setError('');
          setSuggestions([]);
        }
      } catch (err) {
        setError('');
        setSuggestions([]);
      } finally {
        setChecking(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      checkAvailability();
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [username, visible, initialValue]);

  // Handle hardware back press
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
  }, [visible, hasChanges, isSaving]);

  const handleClose = () => {
    if (isSaving) return;
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    const cleaned = username.trim().toLowerCase();
    if (error || checking || cleaned.length < 3 || isSaving) return;

    setIsSaving(true);
    checkmarkScale.value = withTiming(0.8, { duration: 100 }, () => {
      checkmarkScale.value = withTiming(1, { duration: 100 });
    });

    try {
      await onSave(cleaned);
      onClose();
    } catch (err) {
      console.error('Failed to save username:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const isUsernameValid = username.trim().length >= 3 && /^[a-zA-Z0-9_.]+$/.test(username) && !error && !checking;

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
                Username
              </ThemedText>

              <Animated.View style={checkmarkStyle}>
                <Pressable
                  onPress={handleSave}
                  disabled={!hasChanges || !isUsernameValid || checking || isSaving}
                  style={[
                    styles.headerButton,
                    { opacity: hasChanges && isUsernameValid && !checking && !isSaving ? 1 : 0.3 },
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
            <ScrollView 
              style={styles.content} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Input Box */}
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    borderColor: error 
                      ? '#FA3E3E' 
                      : (isUsernameValid && username.trim().toLowerCase() !== initialValue.toLowerCase() ? '#00A859' : (isDark ? '#38383A' : '#E5E5E5')),
                  },
                ]}
              >
                <View style={styles.inputHeader}>
                  <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Username
                  </ThemedText>
                  <View style={styles.feedbackContainer}>
                    {checking && (
                      <ActivityIndicator size="small" color="#0095F6" style={styles.loader} />
                    )}
                    {isUsernameValid && username.trim().toLowerCase() !== initialValue.toLowerCase() && (
                      <Ionicons name="checkmark-circle" size={18} color="#00A859" />
                    )}
                    {error !== '' && (
                      <Ionicons name="alert-circle" size={18} color="#FA3E3E" />
                    )}
                  </View>
                </View>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { color: colors.text }]}
                  value={username}
                  onChangeText={(val) => setUsername(val.replace(/\s+/g, ''))}
                  placeholder="Enter username"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={30}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Error Message */}
              {error !== '' && (
                <ThemedText style={styles.errorText}>
                  {error}
                </ThemedText>
              )}

              {/* Suggestions list when username is taken */}
              {suggestions.length > 0 && (
                <Animated.View 
                  entering={FadeInDown.duration(300)}
                  style={[
                    styles.suggestionsContainer,
                    { 
                      borderColor: isDark ? '#262626' : '#DBDBDB',
                      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' 
                    }
                  ]}
                >
                  {suggestions.map((suggested, index) => {
                    const isLast = index === suggestions.length - 1;
                    return (
                      <Pressable
                        key={suggested}
                        onPress={() => setUsername(suggested)}
                        style={[
                          styles.suggestionRow,
                          !isLast && { 
                            borderBottomWidth: 0.8, 
                            borderBottomColor: isDark ? '#262626' : '#EAEAEA' 
                          }
                        ]}
                      >
                        <ThemedText style={styles.suggestionText}>
                          {suggested}
                        </ThemedText>
                        <Ionicons 
                          name="checkmark-circle-outline" 
                          size={20} 
                          color="#00A859" 
                        />
                      </Pressable>
                    );
                  })}
                </Animated.View>
              )}

              {/* Helper Text */}
              <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
                You can edit your username up to 5 times in 30 minutes.
              </ThemedText>
            </ScrollView>
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
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loader: {
    marginRight: 2,
  },
  input: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    padding: 0,
    margin: 0,
    lineHeight: 24,
  },
  helperText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 16,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#FA3E3E',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 16,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
  },
  suggestionText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
});
