import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, View, Text, BackHandler, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { InstagramInput } from '@/components/InstagramInput';
import { Fonts } from '@/constants/theme';
import { api } from '@/services/api';

export default function UsernameScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { signup } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const params = useLocalSearchParams<{ 
    phoneOrEmail?: string; 
    isPhone?: string; 
    password?: string; 
    birthday?: string;
    name?: string;
    username?: string;
    signupToken?: string;
  }>();
  const [signupToken, setSignupToken] = useState(params.signupToken || '');

  // Extract navigation parameters
  const [phoneOrEmail, setPhoneOrEmail] = useState(params.phoneOrEmail || '');
  const [isPhoneMode, setIsPhoneMode] = useState(params.isPhone === 'true');
  const [password, setPassword] = useState(params.password || '');
  const [birthday, setBirthday] = useState(params.birthday || '');
  const [name, setName] = useState(params.name || '');

  // Username states
  const [username, setUsername] = useState(params.username || '');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync params when loaded
  useEffect(() => {
    if (params.phoneOrEmail) setPhoneOrEmail(params.phoneOrEmail);
    if (params.isPhone) setIsPhoneMode(params.isPhone === 'true');
    if (params.password) setPassword(params.password);
    if (params.birthday) setBirthday(params.birthday);
    if (params.name) setName(params.name);
    if (params.signupToken) setSignupToken(params.signupToken);
  }, [params.phoneOrEmail, params.isPhone, params.password, params.birthday, params.name, params.signupToken]);

  // Generate suggested username on mount if none is set
  useEffect(() => {
    if (name && !username) {
      const suggested = name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
      setUsername(suggested);
    }
  }, [name, username]);

  // Check username availability from NestJS backend with debouncing
  useEffect(() => {
    const checkAvailability = async () => {
      const cleaned = username.trim().toLowerCase();
      if (!cleaned) {
        setError('');
        setSuggestions([]);
        return;
      }

      if (cleaned.length < 3) {
        setError('Please choose a username of at least 3 characters.');
        setSuggestions([]);
        return;
      }

      if (!/^[a-zA-Z0-9_.]+$/.test(cleaned)) {
        setError('Username can only contain letters, numbers, underscores, and periods.');
        setSuggestions([]);
        return;
      }

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
      }
    };

    const delayDebounce = setTimeout(() => {
      checkAvailability();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [username]);

  const handleBack = useCallback(() => {
    setError('');
    setShowConfirmModal(true);
  }, []);

  // Intercept Android hardware back press
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        handleBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }, [handleBack])
  );

  const isUsernameValid = username.trim().length >= 3 && /^[a-zA-Z0-9_.]+$/.test(username) && !error;

  const handleNext = () => {
    setError('');
    if (!isUsernameValid) {
      setError('Please choose a username of at least 3 characters with letters, numbers, underscores, or periods.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push({
        pathname: '/terms',
        params: {
          phoneOrEmail,
          isPhone: isPhoneMode ? 'true' : 'false',
          password,
          birthday,
          name,
          username,
          signupToken,
        },
      });
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}
    >
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          </View>

          {/* Form Content */}
          <View style={styles.innerContainer}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Create a username
            </Text>

            <Text style={[styles.subtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
              Add a username or use our suggestion. You can change this at any time.
            </Text>

            <InstagramInput
              label="Username"
              value={username}
              onChangeText={(val) => {
                setError('');
                setUsername(val.replace(/\s+/g, ''));
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              success={isUsernameValid}
              error={error}
            />

            {/* Suggestions list when username is taken */}
            {suggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { 
                borderColor: isDark ? '#262626' : '#DBDBDB',
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' 
              }]}>
                {suggestions.map((suggested, index) => {
                  const isLast = index === suggestions.length - 1;
                  return (
                    <Pressable
                      key={suggested}
                      onPress={() => {
                        setUsername(suggested);
                        setError('');
                        setSuggestions([]);
                      }}
                      style={[
                        styles.suggestionRow,
                        !isLast && { 
                          borderBottomWidth: 0.8, 
                          borderBottomColor: isDark ? '#262626' : '#EAEAEA' 
                        }
                      ]}
                    >
                      <Text style={[styles.suggestionText, { color: colors.text }]}>
                        {suggested}
                      </Text>
                      <Ionicons 
                        name="checkmark-circle-outline" 
                        size={22} 
                        color="#00A859" 
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Next Progression button */}
            <Pressable
              style={[
                styles.primaryButton,
                { 
                  backgroundColor: isUsernameValid && !isLoading ? '#0064E0' : 'rgba(0, 100, 224, 0.4)', 
                  marginTop: 24 
                }
              ]}
              disabled={!isUsernameValid || isLoading}
              onPress={handleNext}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Next</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footerContainer}>
            <Pressable
              onPress={() => {
                setShowAccountModal(true);
              }}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>I already have an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Custom Exit Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <Pressable 
          style={styles.confirmModalOverlay} 
          onPress={() => setShowConfirmModal(false)}
        >
          <Pressable 
            style={[styles.confirmModalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.confirmModalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Do you want to stop creating your account?
            </Text>
            
            <Text style={[styles.confirmModalSubtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
              If you stop now, you'll lose any progress you've made.
            </Text>

            <View style={styles.confirmModalButtonContainer}>
              <Pressable 
                onPress={() => {
                  setShowConfirmModal(false);
                  if (router.canGoBack()) {
                    router.dismissAll();
                  } else {
                    router.replace('/login');
                  }
                }}
                style={styles.confirmModalButton}
              >
                <Text style={[styles.confirmModalButtonTextBlue, { color: '#0064E0' }]}>
                  STOP CREATING ACCOUNT
                </Text>
              </Pressable>

              <Pressable 
                onPress={() => setShowConfirmModal(false)}
                style={styles.confirmModalButton}
              >
                <Text style={[styles.confirmModalButtonTextRed, { color: '#FA3E3E' }]}>
                  CONTINUE CREATING ACCOUNT
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Already Have an Account Confirmation Modal */}
      <Modal
        visible={showAccountModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <Pressable 
          style={styles.accountModalOverlay} 
          onPress={() => setShowAccountModal(false)}
        >
          <Pressable 
            style={[styles.accountModalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.accountModalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Already have an account?
            </Text>

            <View style={styles.accountModalButtonContainer}>
              <Pressable 
                onPress={() => setShowAccountModal(false)}
                style={styles.accountModalButton}
              >
                <Text style={styles.accountModalButtonTextRed}>
                  CONTINUE CREATING ACCOUNT
                </Text>
              </Pressable>

              <Pressable 
                onPress={() => {
                  setShowAccountModal(false);
                  if (router.canGoBack()) {
                    router.dismissAll();
                  } else {
                    router.replace('/login');
                  }
                }}
                style={styles.accountModalButton}
              >
                <Text style={styles.accountModalButtonTextBlue}>
                  LOG IN
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeContainer: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topBar: { height: 48, justifyContent: 'center', marginTop: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  innerContainer: { flex: 1, marginTop: 10 },
  title: { fontSize: 24, fontFamily: Fonts.bold, marginBottom: 12 },
  subtitle: { fontSize: 14, fontFamily: Fonts.regular, lineHeight: 20, marginBottom: 24 },
  primaryButton: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', width: '100%' },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 15 },
  footerContainer: { width: '100%', alignItems: 'center', marginTop: 40, paddingBottom: 30 },
  loginLink: { paddingVertical: 12 },
  loginLinkText: { color: '#0064E0', fontFamily: Fonts.bold, fontSize: 15 },
  
  // Suggestions Styles
  suggestionsContainer: {
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 16,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
  },
  suggestionText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalCard: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 10,
    lineHeight: 24,
  },
  confirmModalSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmModalButtonContainer: {
    alignItems: 'flex-end',
    gap: 18,
  },
  confirmModalButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  confirmModalButtonTextBlue: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  confirmModalButtonTextRed: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  accountModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountModalCard: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  accountModalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 24,
    lineHeight: 24,
  },
  accountModalButtonContainer: {
    alignItems: 'flex-end',
    gap: 18,
    marginTop: 8,
  },
  accountModalButton: {
    paddingVertical: 8,
  },
  accountModalButtonTextRed: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#FA3E3E',
    letterSpacing: 0.3,
  },
  accountModalButtonTextBlue: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0064E0',
    letterSpacing: 0.3,
  },
});
