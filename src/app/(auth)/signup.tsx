import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, View, Text, Modal, BackHandler, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { InstagramInput } from '@/components/InstagramInput';
import { Fonts } from '@/constants/theme';
import { api } from '@/services/api';

type SignupStep = 'PHONE_OR_EMAIL' | 'NAME';

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: SignupStep; phoneOrEmail?: string; isPhone?: string; password?: string; birthday?: string; username?: string; signupToken?: string }>();
  const { colors, isDark } = useTheme();

  const [step, setStep] = useState<SignupStep>('PHONE_OR_EMAIL');
  const [isPhoneMode, setIsPhoneMode] = useState(true);
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupToken, setSignupToken] = useState(params.signupToken || '');

  // Sync params when coming back from OTP, password or username screens
  useEffect(() => {
    if (params.step) {
      setStep(params.step);
    }
    if (params.phoneOrEmail) {
      setPhoneOrEmail(params.phoneOrEmail);
    }
    if (params.isPhone) {
      setIsPhoneMode(params.isPhone === 'true');
    }
    if (params.password) {
      setPassword(params.password);
    }
    if (params.birthday) {
      setBirthday(params.birthday);
    }
    if (params.username) {
      setUsername(params.username);
    }
    if (params.signupToken) {
      setSignupToken(params.signupToken);
    }
  }, [params.step, params.phoneOrEmail, params.isPhone, params.password, params.birthday, params.username, params.signupToken]);

  // Listen for hardware back press on Android (only when signup screen is active/focused)
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (step === 'PHONE_OR_EMAIL' || step === 'NAME') {
          setShowConfirmModal(true);
          return true; // prevent default behavior
        } else if (step === 'USERNAME') {
          setStep('NAME');
          return true;
        }
        return false; // let default behavior happen
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }, [step, phoneOrEmail, isPhoneMode, password, birthday])
  );

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{7,15}$/;

  const isStep1Valid = isPhoneMode
    ? phoneRegex.test(phoneOrEmail.trim())
    : emailRegex.test(phoneOrEmail.trim());

  const isNameValid = name.trim().length > 0;
  const isStep4Valid = username.trim().length >= 3;

  useEffect(() => {
    if (name.trim()) {
      const suggested = name.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 100);
      setUsername(suggested);
    }
  }, [name]);

  const handleNext = async () => {
    setError('');
    if (step === 'PHONE_OR_EMAIL') {
      if (!isStep1Valid) {
        setError(isPhoneMode ? 'Please enter a valid mobile number (7-15 digits).' : 'Please enter a valid email address.');
        return;
      }
      setIsLoading(true);
      try {
        await api.post('/auth/register/send-otp', {
          emailOrPhone: phoneOrEmail.trim().toLowerCase(),
          isPhone: isPhoneMode,
        });
        
        setIsLoading(false);
        router.push({
          pathname: '/otp',
          params: {
            target: phoneOrEmail,
            isPhone: isPhoneMode ? 'true' : 'false',
          },
        });
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to send verification code. Please try again.';
        setError(errorMsg);
        setIsLoading(false);
      }
    } else if (step === 'NAME') {
      if (!isNameValid) {
        setError('Please enter your name.');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        router.push({
          pathname: '/username',
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
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 'PHONE_OR_EMAIL' || step === 'NAME') {
      setShowConfirmModal(true);
    } else if (step === 'USERNAME') {
      setStep('NAME');
    }
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
          <View style={styles.topBar}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          </View>

          <View style={styles.innerContainer}>
            {step === 'PHONE_OR_EMAIL' && (
              <Animated.View entering={FadeInRight.duration(200)} exiting={FadeOutLeft.duration(200)} style={styles.stepContent}>
                <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {isPhoneMode ? "What's your mobile number?" : "What's your email address?"}
                </Text>
                <Text style={[styles.subtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                  {isPhoneMode ? "Enter the mobile number where you can be contacted. No one will see this on your profile." : "Enter the email address where you can be contacted. No one will see this on your profile."}
                </Text>
                <InstagramInput
                  label={isPhoneMode ? "Mobile number" : "Email address"}
                  value={phoneOrEmail}
                  onChangeText={setPhoneOrEmail}
                  keyboardType={isPhoneMode ? "phone-pad" : "email-address"}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={error}
                />
                <Text style={[styles.helperText, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                  {isPhoneMode ? "You may receive WhatsApp and SMS notifications from us. " : "You may receive email notifications from us. "}
                  <Text style={styles.linkText}>Learn more</Text>
                </Text>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: isStep1Valid && !isLoading ? '#0064E0' : 'rgba(0, 100, 224, 0.4)', marginTop: 20 }]}
                  disabled={!isStep1Valid || isLoading}
                  onPress={handleNext}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Next</Text>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.secondaryButton, { backgroundColor: isDark ? '#262626' : '#F0F2F5' }]}
                  onPress={() => {
                    setIsPhoneMode(!isPhoneMode);
                    setPhoneOrEmail('');
                    setError('');
                  }}
                >
                  <Text style={[styles.secondaryButtonText, { color: isDark ? '#FFFFFF' : '#262626' }]}>
                    {isPhoneMode ? "Sign up with email" : "Sign up with mobile number"}
                  </Text>
                </Pressable>
              </Animated.View>
            )}



            {step === 'NAME' && (
              <Animated.View entering={FadeInRight.duration(200)} exiting={FadeOutLeft.duration(200)} style={styles.stepContent}>
                <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>What's your name?</Text>
                <Text style={[styles.subtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                  Add your name so friends can find you.
                </Text>
                <InstagramInput label="Full name" value={name} onChangeText={setName} autoCorrect={false} error={error} />
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: isNameValid && !isLoading ? '#0064E0' : 'rgba(0, 100, 224, 0.4)', marginTop: 20 }]}
                  disabled={!isNameValid || isLoading}
                  onPress={handleNext}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Next</Text>
                  )}
                </Pressable>
              </Animated.View>
            )}
          </View>

          <View style={styles.footerContainer}>
            {step === 'PHONE_OR_EMAIL' && (
              <Pressable 
                onPress={() => {
                  setShowAccountModal(true);
                }} 
                style={styles.loginLink}
              >
                <Text style={styles.loginLinkText}>I already have an account</Text>
              </Pressable>
            )}
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
          style={styles.modalOverlay} 
          onPress={() => setShowConfirmModal(false)}
        >
          <Pressable 
            style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Do you want to stop creating your account?
            </Text>
            
            <Text style={[styles.modalSubtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
              If you stop now, you'll lose any progress you've made.
            </Text>

            <View style={styles.modalButtonContainer}>
              <Pressable 
                onPress={() => {
                  setShowConfirmModal(false);
                  if (router.canGoBack()) {
                    router.dismissAll();
                  } else {
                    router.replace('/login');
                  }
                }}
                style={styles.modalButton}
              >
                <Text style={[styles.modalButtonTextBlue, { color: '#0064E0' }]}>
                  STOP CREATING ACCOUNT
                </Text>
              </Pressable>

              <Pressable 
                onPress={() => setShowConfirmModal(false)}
                style={styles.modalButton}
              >
                <Text style={[styles.modalButtonTextRed, { color: '#FA3E3E' }]}>
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
  stepContent: { width: '100%' },
  title: { fontSize: 24, fontFamily: Fonts.semiBold, marginBottom: 12 },
  subtitle: { fontSize: 14, fontFamily: Fonts.regular, lineHeight: 20, marginBottom: 24 },
  helperText: { fontSize: 12, fontFamily: Fonts.regular, lineHeight: 18, marginTop: 12, marginBottom: 8 },
  linkText: { color: '#0064E0', fontFamily: Fonts.semiBold },
  errorText: { color: '#FF3040', fontSize: 12, fontFamily: Fonts.regular, textAlign: 'center', marginTop: 12 },
  primaryButton: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', width: '100%' },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Fonts.semiBold, fontSize: 15 },
  secondaryButton: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 12 },
  secondaryButtonText: { fontFamily: Fonts.semiBold, fontSize: 15 },
  footerContainer: { width: '100%', alignItems: 'center', marginTop: 40, paddingBottom: 30 },
  loginLink: { paddingVertical: 12 },
  loginLinkText: { color: '#0064E0', fontFamily: Fonts.semiBold, fontSize: 15 },
  // Confirmation Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
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
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 10,
    lineHeight: 24,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtonContainer: {
    alignItems: 'flex-end',
    gap: 18,
  },
  modalButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  modalButtonTextBlue: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  modalButtonTextRed: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
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
