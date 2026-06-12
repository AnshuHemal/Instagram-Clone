import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
  ScrollView,
  Alert,
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
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

const PRONOUN_DICTIONARY: Record<string, string[]> = {
  English: ['he', 'him', 'his', 'she', 'her', 'hers', 'they', 'them', 'theirs', 'it', 'its', 'xe', 'xem', 'xyr', 'fae', 'faer'],
  Spanish: ['él', 'ella', 'elle', 'ellos', 'ellas', 'nosotros', 'nosotras'],
  Portuguese: ['ele', 'ela', 'elu', 'dele', 'dela', 'delu', 'eles', 'elas', 'elus'],
  French: ['il', 'elle', 'iel', 'on', 'lui', 'ielles'],
  German: ['er', 'sie', 'es', 'ihn', 'ihm', 'ihr', 'ihnen'],
};

interface PronounsModalProps {
  visible: boolean;
  value: string;
  showToFollowers: boolean;
  onClose: () => void;
  onSave: (pronouns: string, showToFollowers: boolean) => void | Promise<void>;
}

export const PronounsModal: React.FC<PronounsModalProps> = ({
  visible,
  value: initialValue,
  showToFollowers: initialShowToFollowers,
  onClose,
  onSave,
}) => {
  const { colors, isDark } = useTheme();

  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [inputText, setInputText] = useState('');
  const [showToFollowersOnly, setShowToFollowersOnly] = useState(initialShowToFollowers);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const checkmarkScale = useSharedValue(1);
  const switchProgress = useSharedValue(initialShowToFollowers ? 1 : 0);

  // Sync parameters when visible
  useEffect(() => {
    if (visible) {
      const parsed = initialValue ? initialValue.split('/') : [];
      setSelectedChips(parsed);
      setSelectedLanguage('English');
      setInputText('');
      setShowToFollowersOnly(initialShowToFollowers);
      switchProgress.value = withTiming(initialShowToFollowers ? 1 : 0, { duration: 200 });
      setIsSaving(false);
      
      // Auto-focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible, initialValue, initialShowToFollowers]);

  // Sync animated switch whenever state updates
  useEffect(() => {
    switchProgress.value = withTiming(showToFollowersOnly ? 1 : 0, { duration: 200 });
  }, [showToFollowersOnly]);

  // Compute live search suggestions based on input and current language
  useEffect(() => {
    const query = inputText.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      return;
    }

    const words = PRONOUN_DICTIONARY[selectedLanguage] || [];
    const filtered = words.filter(
      (word) => word.startsWith(query) && !selectedChips.includes(word)
    );
    setSuggestions(filtered);
  }, [inputText, selectedLanguage, selectedChips]);

  // Back press interception
  useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      if (isSaving) return true;
      handleClose();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [visible, selectedChips, showToFollowersOnly, isSaving]);

  const hasChanges = () => {
    const currentJoined = selectedChips.join('/');
    return currentJoined !== initialValue || showToFollowersOnly !== initialShowToFollowers;
  };

  const handleClose = () => {
    if (isSaving) return;
    if (hasChanges()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    checkmarkScale.value = withTiming(0.8, { duration: 100 }, () => {
      checkmarkScale.value = withTiming(1, { duration: 100 });
    });

    const joinedPronouns = selectedChips.join('/');
    try {
      await onSave(joinedPronouns, showToFollowersOnly);
      onClose();
    } catch (err) {
      console.error('Failed to save pronouns:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const removeChip = (chip: string) => {
    setSelectedChips(selectedChips.filter((c) => c !== chip));
  };

  const addChip = (chip: string) => {
    if (selectedChips.length >= 4) {
      Alert.alert('Limit reached', 'You can add up to 4 pronouns only.', [{ text: 'OK' }]);
      return;
    }
    setSelectedChips([...selectedChips, chip]);
    setInputText('');
    inputRef.current?.focus();
  };

  // Reanimated switch track color
  const switchTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      switchProgress.value,
      [0, 1],
      [isDark ? '#3A3A3C' : '#E5E5E5', '#34C759']
    );
    return { backgroundColor };
  });

  // Reanimated switch thumb position
  const switchThumbStyle = useAnimatedStyle(() => {
    const translateX = interpolate(switchProgress.value, [0, 1], [0, 20]);
    return {
      transform: [{ translateX }],
    };
  });

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
                Pronouns
              </ThemedText>

              <Animated.View style={checkmarkStyle}>
                <Pressable
                  onPress={handleSave}
                  disabled={!hasChanges() || isSaving}
                  style={[
                    styles.headerButton,
                    { opacity: hasChanges() && !isSaving ? 1 : 0.3 },
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
            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              
              {/* Tag Input Field Container */}
              <View style={[styles.inputBox, { borderColor: isDark ? '#38383A' : '#E5E5E5', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                <View style={styles.chipsContainer}>
                  {selectedChips.map((chip) => (
                    <Animated.View
                      key={chip}
                      entering={FadeInDown.duration(150)}
                      style={[styles.chip, { backgroundColor: isDark ? '#3A3A3C' : '#EFEFEF' }]}
                    >
                      <ThemedText style={styles.chipText}>{chip}</ThemedText>
                      <Pressable onPress={() => removeChip(chip)} hitSlop={6} disabled={isSaving}>
                        <Ionicons name="close-circle" size={16} color={isDark ? '#8E8E93' : '#8E8E93'} />
                      </Pressable>
                    </Animated.View>
                  ))}
                  
                  {selectedChips.length < 4 && (
                    <TextInput
                      ref={inputRef}
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder={selectedChips.length === 0 ? "Add your pronouns" : ""}
                      placeholderTextColor={colors.textSecondary}
                      value={inputText}
                      onChangeText={setInputText}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSaving}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && inputText === '' && selectedChips.length > 0) {
                          const updated = [...selectedChips];
                          updated.pop();
                          setSelectedChips(updated);
                        }
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Horizontal Languages Selector */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.languagesBar}
                contentContainerStyle={styles.languagesBarContent}
              >
                {Object.keys(PRONOUN_DICTIONARY).map((lang) => {
                  const isSelected = selectedLanguage === lang;
                  return (
                    <Pressable
                      key={lang}
                      onPress={() => setSelectedLanguage(lang)}
                      style={[
                        styles.languagePill,
                        {
                          backgroundColor: isSelected
                            ? '#0095F6'
                            : (isDark ? '#1C1C1E' : '#F2F2F7'),
                        },
                      ]}
                      disabled={isSaving}
                    >
                      <ThemedText
                        style={[
                          styles.languageText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.text,
                            fontFamily: isSelected ? Fonts.bold : Fonts.regular,
                          },
                        ]}
                      >
                        {lang}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Autocomplete Suggestions */}
              {suggestions.length > 0 && (
                <Animated.View
                  entering={FadeInDown.duration(200)}
                  style={[
                    styles.suggestionsBox,
                    {
                      borderColor: isDark ? '#262626' : '#DBDBDB',
                      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    },
                  ]}
                >
                  {suggestions.map((suggestion, index) => {
                    const isLast = index === suggestions.length - 1;
                    return (
                      <Pressable
                        key={suggestion}
                        onPress={() => addChip(suggestion)}
                        style={[
                          styles.suggestionRow,
                          !isLast && { borderBottomWidth: 0.8, borderBottomColor: isDark ? '#262626' : '#EAEAEA' },
                        ]}
                        disabled={isSaving}
                      >
                        <ThemedText style={[styles.suggestionText, { color: colors.text }]}>
                          {suggestion}
                        </ThemedText>
                        <Ionicons name="add" size={18} color="#0095F6" />
                      </Pressable>
                    );
                  })}
                </Animated.View>
              )}

              {/* Help Text */}
              <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
                Add up to 4 pronouns to your profile so people know how to refer to you. You can edit or remove them at any time.{' '}
                <ThemedText
                  style={{ color: '#0095F6', textDecorationLine: 'underline' }}
                  onPress={() => {
                    Alert.alert(
                      'Pronouns help',
                      'Pronouns on your profile let people know how to refer to you. You can select pronouns in multiple languages and control who sees them.',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  Learn more
                </ThemedText>
              </ThemedText>

              {/* Show to followers only Toggle */}
              <View style={[styles.toggleSection, { borderTopColor: colors.border }]}>
                <Pressable
                  onPress={() => !isSaving && setShowToFollowersOnly(!showToFollowersOnly)}
                  style={styles.toggleRow}
                >
                  <View style={styles.toggleTextContainer}>
                    <ThemedText style={[styles.toggleTitle, { color: colors.text }]}>
                      Show to followers only
                    </ThemedText>
                    <ThemedText style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                      When this is turned on, only people who follow you will see your pronouns.
                    </ThemedText>
                  </View>
                  <Animated.View style={[styles.toggleTrack, switchTrackStyle]}>
                    <Animated.View style={[styles.toggleThumb, switchThumbStyle]} />
                  </Animated.View>
                </Pressable>
              </View>

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
    fontFamily: Fonts.bold,
    fontSize: 17,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 62,
    justifyContent: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  textInput: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    padding: 0,
    margin: 0,
    minWidth: 120,
    flexGrow: 1,
  },
  helperText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    marginTop: 16,
  },
  languagesBar: {
    marginTop: 16,
    maxHeight: 38,
  },
  languagesBarContent: {
    gap: 10,
  },
  languagePill: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
  },
  suggestionsBox: {
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
    height: 48,
  },
  suggestionText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  toggleSection: {
    marginTop: 24,
    borderTopWidth: 0.5,
    paddingTop: 20,
    paddingBottom: 40,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toggleTextContainer: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  toggleSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  toggleTrack: {
    width: 51,
    height: 31,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
