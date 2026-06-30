import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, View, Text, BackHandler, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { Fonts } from '@/constants/theme';

export default function TermsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { registerComplete } = useAuth();
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
  const [isLoading, setIsLoading] = useState(false);
  const [signupToken, setSignupToken] = useState(params.signupToken || '');

  // Extract navigation parameters
  const [phoneOrEmail, setPhoneOrEmail] = useState(params.phoneOrEmail || '');
  const [isPhoneMode, setIsPhoneMode] = useState(params.isPhone === 'true');
  const [password, setPassword] = useState(params.password || '');
  const [birthday, setBirthday] = useState(params.birthday || '');
  const [name, setName] = useState(params.name || '');
  const [username, setUsername] = useState(params.username || '');
  const [error, setError] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Sync params when loaded
  useEffect(() => {
    if (params.phoneOrEmail) setPhoneOrEmail(params.phoneOrEmail);
    if (params.isPhone) setIsPhoneMode(params.isPhone === 'true');
    if (params.password) setPassword(params.password);
    if (params.birthday) setBirthday(params.birthday);
    if (params.name) setName(params.name);
    if (params.username) setUsername(params.username);
    if (params.signupToken) setSignupToken(params.signupToken);
  }, [params.phoneOrEmail, params.isPhone, params.password, params.birthday, params.name, params.username, params.signupToken]);

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

  const handleAgree = async () => {
    setError('');
    setIsLoading(true);
    try {
      const success = await registerComplete(signupToken, password, birthday, name, username);
      if (success) {
        // Redirect to device permissions screen passing parameter
        router.replace({
          pathname: '/permissions',
          params: { isPhone: isPhoneMode ? 'true' : 'false' }
        });
      } else {
        setError('Signup failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const handleLinkPress = (title: string) => {
    Alert.alert('Legal Info', `You tapped the ${title} link. In production, this would open the official agreement page.`);
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
          <Animated.View entering={FadeInRight.duration(200)} style={styles.innerContainer}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Agree to Instagram's terms and policies
            </Text>

            {/* Paragraph 1 */}
            <Text style={[styles.legalParagraph, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              People who use our service may have uploaded your contact information to Instagram.{' '}
              <Text style={styles.linkText} onPress={() => handleLinkPress('Learn More')}>
                Learn more
              </Text>
            </Text>

            {/* Paragraph 2 */}
            <Text style={[styles.legalParagraph, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              By tapping <Text style={{ fontWeight: 'bold' }}>I agree</Text>, you agree to create an account and to Instagram's{' '}
              <Text style={styles.linkText} onPress={() => handleLinkPress('Terms')}>
                Terms
              </Text>
              ,{' '}
              <Text style={styles.linkText} onPress={() => handleLinkPress('Privacy Policy')}>
                Privacy Policy
              </Text>{' '}
              and{' '}
              <Text style={styles.linkText} onPress={() => handleLinkPress('Cookies Policy')}>
                Cookies Policy
              </Text>
              .
            </Text>

            {/* Paragraph 3 */}
            <Text style={[styles.legalParagraph, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              The{' '}
              <Text style={styles.linkText} onPress={() => handleLinkPress('Privacy Policy')}>
                Privacy Policy
              </Text>{' '}
              describes the ways we can use the information we collect when you create a profile. For example, we use this information to provide, personalize and improve our products, including ads.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* I Agree Confirmation button */}
            <Pressable
              style={[styles.primaryButton, { backgroundColor: isLoading ? 'rgba(0, 100, 224, 0.4)' : '#0064E0', marginTop: 24 }]}
              disabled={isLoading}
              onPress={handleAgree}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>I agree</Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Footer Back Link */}
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
  title: { fontSize: 24, fontFamily: Fonts.semiBold, marginBottom: 20, lineHeight: 30 },
  legalParagraph: {
    fontSize: 14.5,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    marginBottom: 20,
  },
  linkText: {
    color: '#0064E0',
    fontFamily: Fonts.semiBold,
  },
  errorText: { color: '#FF3040', fontSize: 12, fontFamily: Fonts.regular, textAlign: 'center', marginTop: 12 },
  primaryButton: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', width: '100%' },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Fonts.semiBold, fontSize: 15 },
  footerContainer: { width: '100%', alignItems: 'center', marginTop: 40, paddingBottom: 30 },
  loginLink: { paddingVertical: 12 },
  loginLinkText: { color: '#0064E0', fontFamily: Fonts.semiBold, fontSize: 15 },
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
    fontFamily: Fonts.semiBold,
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
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  confirmModalButtonTextRed: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
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
    fontFamily: Fonts.semiBold,
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
    fontFamily: Fonts.semiBold,
    color: '#FA3E3E',
    letterSpacing: 0.3,
  },
  accountModalButtonTextBlue: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#0064E0',
    letterSpacing: 0.3,
  },
});
