import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, View, Text, BackHandler, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useLoading } from '@/contexts/LoadingContext';
import { InstagramInput } from '@/components/InstagramInput';
import { Fonts } from '@/constants/theme';

export default function PasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showLoading, hideLoading } = useLoading();
  const params = useLocalSearchParams<{ phoneOrEmail?: string; isPhone?: string; password?: string; signupToken?: string }>();

  const [phoneOrEmail, setPhoneOrEmail] = useState(params.phoneOrEmail || '');
  const [isPhoneMode, setIsPhoneMode] = useState(params.isPhone === 'true');
  const [password, setPassword] = useState(params.password || '');
  const [signupToken, setSignupToken] = useState(params.signupToken || '');
  const [rememberLoginInfo, setRememberLoginInfo] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync params when loaded
  useEffect(() => {
    if (params.phoneOrEmail) setPhoneOrEmail(params.phoneOrEmail);
    if (params.isPhone) setIsPhoneMode(params.isPhone === 'true');
    if (params.password) setPassword(params.password);
    if (params.signupToken) setSignupToken(params.signupToken);
  }, [params.phoneOrEmail, params.isPhone, params.password, params.signupToken]);

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

  const isPasswordValid = password.trim().length >= 6;

  const handleNext = () => {
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push({
        pathname: '/birthday',
        params: {
          phoneOrEmail: phoneOrEmail,
          isPhone: isPhoneMode ? 'true' : 'false',
          password: password,
          signupToken: signupToken,
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
          {/* Header Top Bar */}
          <View style={styles.topBar}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          </View>

          {/* Form Content */}
          <View style={styles.innerContainer}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Create a password
            </Text>
            
            <Text style={[styles.subtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
              Create a password with at least 6 letters or numbers. It should be something others can't guess.
            </Text>

            <InstagramInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              error={error}
            />

            {/* Checkbox Row */}
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setRememberLoginInfo(!rememberLoginInfo)}
            >
              <Ionicons
                name={rememberLoginInfo ? "checkbox" : "square-outline"}
                size={22}
                color={rememberLoginInfo ? '#0064E0' : (isDark ? '#8E8E93' : '#737373')}
              />
              <Text style={[styles.checkboxText, { color: isDark ? '#FFFFFF' : '#262626' }]}>
                Remember login info. <Text style={styles.linkText}>Learn more</Text>
              </Text>
            </Pressable>

            {/* Action Button */}
            <Pressable
              style={[styles.primaryButton, { backgroundColor: password.length >= 6 && !isLoading ? '#0064E0' : 'rgba(0, 100, 224, 0.4)', marginTop: 20 }]}
              disabled={password.length < 6 || isLoading}
              onPress={handleNext}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Next</Text>
              )}
            </Pressable>
          </View>

          {/* Footer link */}
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
  errorText: { color: '#FF3040', fontSize: 12, fontFamily: Fonts.regular, textAlign: 'center', marginTop: 12 },
  primaryButton: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', width: '100%' },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 15 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
    paddingHorizontal: 4,
  },
  checkboxText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  linkText: { color: '#0064E0', fontFamily: Fonts.bold },
  footerContainer: { width: '100%', alignItems: 'center', marginTop: 40, paddingBottom: 10 },
  loginLink: { paddingVertical: 12 },
  loginLinkText: { color: '#0064E0', fontFamily: Fonts.bold, fontSize: 15 },
  // Confirmation Modal Styles
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
