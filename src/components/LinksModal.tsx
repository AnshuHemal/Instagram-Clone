import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { DiscardChangesModal } from './DiscardChangesModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutRight,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';

import { UserLink } from '@/contexts/AuthContext';

interface LinksModalProps {
  visible: boolean;
  initialLinks: UserLink[];
  onClose: () => void;
  onSaveLinks: (links: UserLink[]) => void | Promise<void>;
}

export const LinksModal: React.FC<LinksModalProps> = ({
  visible,
  initialLinks,
  onClose,
  onSaveLinks,
}) => {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [links, setLinks] = useState<UserLink[]>(initialLinks);
  const [activeScreen, setActiveScreen] = useState<'list' | 'add'>('list');
  
  // Add link screen state
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const checkmarkScale = useSharedValue(1);

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  useEffect(() => {
    if (visible) {
      setLinks(initialLinks);
      setActiveScreen('list');
      setUrl('');
      setTitle('');
      setIsSaving(false);
    }
  }, [visible, initialLinks]);

  const handleAddScreenBack = () => {
    if (isSaving) return;
    if (url.trim() !== '' || title.trim() !== '') {
      setShowDiscardConfirm(true);
    } else {
      setActiveScreen('list');
    }
  };

  const handleListScreenBack = () => {
    if (isSaving) return;
    onClose();
  };

  useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      if (isSaving) return true;
      if (activeScreen === 'add') {
        handleAddScreenBack();
        return true;
      }
      handleListScreenBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
    };
  }, [visible, activeScreen, url, title, onClose, isSaving]);

  const handleSaveCheckmark = async () => {
    if (isSaving || !url.trim()) return;

    setIsSaving(true);
    checkmarkScale.value = withTiming(0.8, { duration: 100 }, () => {
      checkmarkScale.value = withTiming(1, { duration: 100 });
    });

    // Basic URL validation
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newLink: UserLink = {
      id: Math.random().toString(36).substring(2, 9),
      title: title.trim() || formattedUrl.replace(/^https?:\/\/(www\.)?/i, ''),
      url: formattedUrl,
    };

    const updated = [...links, newLink];

    try {
      await onSaveLinks(updated);
      setLinks(updated);
      
      // Go back to list on success
      setActiveScreen('list');
      setUrl('');
      setTitle('');
    } catch (err) {
      console.error('Failed to add link:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (isSaving) return;
    setIsSaving(true);

    const updated = links.filter((link) => link.id !== id);

    try {
      await onSaveLinks(updated);
      setLinks(updated);
    } catch (err) {
      console.error('Failed to delete link:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.absoluteFill}>
      {activeScreen === 'list' ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.overlay, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}
        >
          <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Pressable onPress={handleListScreenBack} style={styles.headerButton} hitSlop={8} disabled={isSaving}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>

              <ThemedText type="subtitle" style={[styles.headerTitle, { color: colors.text }]}>
                Links
              </ThemedText>

              {isSaving ? (
                <View style={styles.headerButton}>
                  <ActivityIndicator size="small" color="#0095F6" />
                </View>
              ) : (
                <View style={styles.headerSpacer} />
              )}
            </View>

            {/* List Screen Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Add Link Row */}
              <Pressable
                style={[styles.addLinkRow, { opacity: isSaving ? 0.5 : 1 }]}
                onPress={() => !isSaving && setActiveScreen('add')}
                disabled={isSaving}
              >
                <View style={[styles.plusCircle, { borderColor: isDark ? '#333' : '#E5E5E5' }]}>
                  <Ionicons name="add" size={24} color={colors.text} />
                </View>
                <ThemedText style={[styles.addLinkText, { color: colors.text }]}>
                  Add link
                </ThemedText>
              </Pressable>

              <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
                Your links are visible to everyone on and off Instagram.
              </ThemedText>

              {/* Added Links List */}
              {links.length > 0 && (
                <View style={styles.linksList}>
                  {links.map((link, index) => (
                    <Animated.View
                      key={link.id}
                      entering={FadeInDown.duration(300).delay(index * 50)}
                      style={[styles.linkItem, { borderBottomColor: colors.border }]}
                    >
                      <View style={styles.linkInfo}>
                        <ThemedText style={[styles.linkTitle, { color: colors.text }]} numberOfLines={1}>
                          {link.title}
                        </ThemedText>
                        <ThemedText style={[styles.linkUrl, { color: colors.textSecondary }]} numberOfLines={1}>
                          {link.url}
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => handleDeleteLink(link.id)}
                        style={[styles.deleteButton, { opacity: isSaving ? 0.5 : 1 }]}
                        hitSlop={8}
                        disabled={isSaving}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      ) : (
        <Animated.View
          entering={SlideInRight.duration(200)}
          exiting={SlideOutRight.duration(150)}
          style={[styles.overlay, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}
        >
          <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Pressable onPress={handleAddScreenBack} style={styles.headerButton} hitSlop={8} disabled={isSaving}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>

                <ThemedText type="subtitle" style={[styles.headerTitle, { color: colors.text }]}>
                  Add link
                </ThemedText>

                <Animated.View style={checkmarkAnimatedStyle}>
                  <Pressable
                    onPress={handleSaveCheckmark}
                    disabled={!url.trim() || isSaving}
                    style={[styles.headerButton, { opacity: url.trim() && !isSaving ? 1 : 0.3 }]}
                    hitSlop={8}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#0095F6" />
                    ) : (
                      <Ionicons name="checkmark" size={28} color="#0095F6" />
                    )}
                  </Pressable>
                </Animated.View>
              </View>

              {/* Form Content */}
              <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.formContainer}>
                  {/* URL Input Box */}
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        borderColor: isDark ? '#38383A' : '#E5E5E5',
                        opacity: isSaving ? 0.6 : 1,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder="URL"
                      placeholderTextColor={colors.textSecondary}
                      value={url}
                      onChangeText={setUrl}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                      autoFocus={true}
                      editable={!isSaving}
                    />
                  </View>

                  {/* Title Input Box */}
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        borderColor: isDark ? '#38383A' : '#E5E5E5',
                        opacity: isSaving ? 0.6 : 1,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder="Title"
                      placeholderTextColor={colors.textSecondary}
                      value={title}
                      onChangeText={setTitle}
                      autoCapitalize="sentences"
                      editable={!isSaving}
                    />
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      )}
      <DiscardChangesModal
        visible={showDiscardConfirm}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          setActiveScreen('list');
          setUrl('');
          setTitle('');
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
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  plusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLinkText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  helperText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 24,
  },
  linksList: {
    marginTop: 8,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  linkInfo: {
    flex: 1,
    marginRight: 16,
    gap: 2,
  },
  linkTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  linkUrl: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    gap: 16,
    paddingTop: 8,
  },
  inputBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 58,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    padding: 0,
    margin: 0,
  },
});
