import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, View, Text, Modal, BackHandler, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useLoading } from '@/contexts/LoadingContext';
import { Fonts } from '@/constants/theme';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function OtpScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ target?: string; isPhone?: string; fromAddContact?: string }>();
  const insets = useSafeAreaInsets();

  const [target, setTarget] = useState(params.target || '');
  const [isPhoneMode, setIsPhoneMode] = useState(params.isPhone === 'true');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  // Sync params when screen is loaded or navigated to
  useEffect(() => {
    if (params.target) setTarget(params.target);
    if (params.isPhone) setIsPhoneMode(params.isPhone === 'true');
  }, [params.target, params.isPhone]);

  // Focus the input when confirmation screen is mounted/visible
  useEffect(() => {
    const timer = setTimeout(() => {
      codeInputRef.current?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

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

  const isStep2Valid = code.trim().length === 6;

  const handleNext = async () => {
    setError('');
    if (!isStep2Valid) {
      setError('Please enter the 6-digit confirmation code.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register/verify-otp', {
        emailOrPhone: target.trim().toLowerCase(),
        code: code.trim(),
      });
      
      const { signupToken } = res.data;
      setIsLoading(false);
      
      if (params.fromAddContact === 'true') {
        try {
          if (user) {
            await updateProfile(user.name, user.bio, user.avatar, false, 'FOLLOW');
          }
        } catch (e) {
          console.warn('Failed to save onboarding progress:', e);
        }
        router.push({
          pathname: '/follow-suggestions',
          params: { isPhone: isPhoneMode ? 'true' : 'false' }
        });
      } else {
        router.push({
          pathname: '/password',
          params: {
            phoneOrEmail: target,
            isPhone: isPhoneMode ? 'true' : 'false',
            signupToken,
          },
        });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Invalid or expired confirmation code.';
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setCode('');
    setShowBottomSheet(false);
    showLoading();
    try {
      await api.post('/auth/register/send-otp', {
        emailOrPhone: target.trim().toLowerCase(),
        isPhone: isPhoneMode,
      });
      showToast({
        title: 'Code Sent',
        message: `A new confirmation code has been sent to ${target}.`,
        type: 'success',
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to resend confirmation code. Please try again.';
      setError(errorMsg);
      showToast({
        title: 'Error',
        message: errorMsg,
        type: 'error',
      });
    } finally {
      hideLoading();
    }
  };

  const handleChangeContact = () => {
    setShowBottomSheet(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: '/signup',
        params: {
          step: 'PHONE_OR_EMAIL',
          isPhone: isPhoneMode ? 'true' : 'false',
        },
      });
    }
  };

  const handleToggleChannel = () => {
    setShowBottomSheet(false);
    // Switch channel and redirect back to signup screen to let user type the new contact details
    router.replace({
      pathname: '/signup',
      params: {
        step: 'PHONE_OR_EMAIL',
        isPhone: isPhoneMode ? 'false' : 'true',
      },
    });
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
              Enter the confirmation code
            </Text>
            
            <Text style={[styles.subtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
              To confirm your profile, enter the 6-digit code we sent to {target}.
            </Text>

            {/* Hidden text input coordinating the boxes */}
            <TextInput
              ref={codeInputRef}
              value={code}
              onChangeText={(val) => {
                const cleaned = val.replace(/[^0-9]/g, '');
                setCode(cleaned);
              }}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.hiddenInput}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              autoFocus
            />

            {/* 6 Visual OTP Boxes */}
            <Pressable onPress={() => codeInputRef.current?.focus()} style={styles.otpContainer}>
              {Array.from({ length: 6 }).map((_, index) => {
                const digit = code[index] || '';
                const isBoxFocused = isInputFocused && (
                  index === code.length ||
                  (index === 5 && code.length === 6)
                );

                return (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        borderColor: error
                          ? '#FA3E3E'
                          : isBoxFocused
                            ? (isDark ? '#FFFFFF' : '#000000')
                            : (isDark ? '#262626' : '#DBDBDB'),
                      },
                    ]}
                  >
                    <Text style={[styles.otpDigit, { color: colors.text }]}>
                      {digit}
                    </Text>
                  </View>
                );
              })}
            </Pressable>

            {error ? (
              <Text style={styles.errorText}>
                {error}
              </Text>
            ) : null}

            {/* Action Buttons */}
            <Pressable
              style={[styles.primaryButton, { backgroundColor: isStep2Valid && !isLoading ? '#0064E0' : 'rgba(0, 100, 224, 0.4)', marginTop: 20 }]}
              disabled={!isStep2Valid || isLoading}
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
              onPress={() => setShowBottomSheet(true)}
            >
              <Text style={[styles.secondaryButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                I didn't get the code
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Sheet Dialog Modal */}
      <Modal
        visible={showBottomSheet}
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setShowBottomSheet(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* Backdrop Pressable */}
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => setShowBottomSheet(false)}
          >
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
            />
          </Pressable>

          <Animated.View
            entering={SlideInDown.duration(250)}
            exiting={SlideOutDown.duration(200)}
            style={[
              styles.bottomSheet,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom, 24)
              }
            ]}
          >
            {/* Gray drag indicator bar */}
            <View style={[styles.dragHandle, { backgroundColor: isDark ? '#3A3A3C' : '#CCCCCC' }]} />

            {/* Close icon */}
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setShowBottomSheet(false)} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
              </Pressable>
            </View>

            {/* Rounded Options Menu Card */}
            <View style={[styles.menuContainer, { 
              borderColor: isDark ? '#262626' : '#EAEAEA',
              backgroundColor: isDark ? '#121212' : '#FFFFFF'
            }]}>
              <Pressable 
                onPress={handleResend} 
                style={[styles.menuItem, { borderBottomWidth: 0.8, borderColor: isDark ? '#262626' : '#EAEAEA' }]}
              >
                <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  Resend confirmation code
                </Text>
              </Pressable>

              <Pressable 
                onPress={handleChangeContact} 
                style={[styles.menuItem, { borderBottomWidth: 0.8, borderColor: isDark ? '#262626' : '#EAEAEA' }]}
              >
                <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {isPhoneMode ? 'Change mobile number' : 'Change email'}
                </Text>
              </Pressable>

              <Pressable 
                onPress={handleToggleChannel} 
                style={styles.menuItem}
              >
                <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {isPhoneMode ? 'Confirm by email' : 'Confirm by mobile number'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Custom Exit Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        statusBarTranslucent
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
  secondaryButton: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 12 },
  secondaryButtonText: { fontFamily: Fonts.bold, fontSize: 15 },
  
  // OTP Styles
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    marginBottom: 28,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDigit: {
    fontSize: 22,
    fontFamily: Fonts.bold,
  },

  // Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 12,
    minHeight: 320,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 16,
  },
  dragHandle: {
    width: 36,
    height: 4.5,
    borderRadius: 2.25,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
    marginLeft: -4,
  },
  menuContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  menuItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
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
});
