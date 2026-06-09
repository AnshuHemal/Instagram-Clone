import React, { useState, useCallback } from 'react';
import { StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, View, Text, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useLoading } from '@/contexts/LoadingContext';
import { InstagramInput } from '@/components/InstagramInput';
import { Fonts } from '@/constants/theme';

export default function ForgotScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showLoading, hideLoading } = useLoading();

  const [searchVal, setSearchVal] = useState('');
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [error, setError] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFbLoading, setIsFbLoading] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContinue = () => {
    const cleaned = searchVal.trim();
    if (!cleaned) return;

    setError('');
    setIsLoading(true);

    // Mock search logic
    setTimeout(() => {
      setIsLoading(false);
      if (isPhoneMode && cleaned.length < 7) {
        setError('Please enter a valid phone number.');
      } else if (!isPhoneMode && cleaned.length < 3) {
        setError('Please enter a valid email or username.');
      } else {
        Alert.alert(
          'Recovery Sent',
          isPhoneMode 
            ? `We have sent a login link via SMS to ${cleaned}.` 
            : `We have sent a login link to ${cleaned}.`,
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      }
    }, 1200);
  };

  const handleFacebookLogin = () => {
    setIsFbLoading(true);
    setTimeout(() => {
      setIsFbLoading(false);
      Alert.alert(
        'Facebook Login',
        'Successfully logged in with Facebook mock account.',
        [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
      );
    }, 1000);
  };

  const toggleSearchMode = () => {
    setSearchVal('');
    setError('');
    setIsPhoneMode(!isPhoneMode);
  };

  const handleHelpPress = () => {
    setShowHelpModal(true);
  };

  const isInputValid = searchVal.trim().length > 0;

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
              Find your account
            </Text>

            <Text style={[styles.subtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
              {isPhoneMode ? 'Enter your mobile number.' : 'Enter your email or username.'}
            </Text>

            <Pressable onPress={handleHelpPress} style={styles.helpLink}>
              <Text style={styles.helpLinkText}>Can't reset your password?</Text>
            </Pressable>

            <View style={styles.inputContainer}>
              <InstagramInput
                label={isPhoneMode ? 'Mobile number' : 'Email or username'}
                value={searchVal}
                onChangeText={setSearchVal}
                keyboardType={isPhoneMode ? 'phone-pad' : 'email-address'}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                error={error}
              />
            </View>

            {/* Continue button */}
            <Pressable
              style={[
                styles.primaryButton,
                { 
                  backgroundColor: isInputValid && !isLoading ? '#0064E0' : 'rgba(0, 100, 224, 0.4)', 
                  marginTop: 20 
                }
              ]}
              disabled={!isInputValid || isLoading}
              onPress={handleContinue}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </Pressable>

            {/* Mode Switcher Link */}
            <Pressable onPress={toggleSearchMode} style={styles.switchModeButton}>
              <Text style={[styles.switchModeText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {isPhoneMode ? 'Find by email or username' : 'Find by mobile number'}
              </Text>
            </Pressable>

            {/* OR Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? '#262626' : '#DBDBDB' }]} />
              <Text style={[styles.dividerText, { color: isDark ? '#A8A8A8' : '#737373' }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? '#262626' : '#DBDBDB' }]} />
            </View>

            {/* Facebook Login Button */}
            <Pressable
              style={[
                styles.facebookButton,
                { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }
              ]}
              disabled={isLoading || isFbLoading}
              onPress={handleFacebookLogin}
            >
              {isFbLoading ? (
                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
              ) : (
                <>
                  <Ionicons name="logo-facebook" size={20} color={isDark ? '#FFFFFF' : '#000000'} style={styles.facebookIcon} />
                  <Text style={[styles.facebookButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    Log in with Facebook
                  </Text>
                </>
              )}
            </Pressable>

          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Help Bottom Sheet Modal */}
      <Modal
        visible={showHelpModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.helpModalOverlay}>
          {/* Backdrop Pressable */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowHelpModal(false)}
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
            style={[styles.helpBottomSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
          >
            {/* Drag Handle */}
            <View style={[styles.dragHandle, { backgroundColor: isDark ? '#3A3A3C' : '#CCCCCC' }]} />

            {/* Close Button on Left */}
            <View style={styles.helpHeader}>
              <Pressable onPress={() => setShowHelpModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.helpContent}>
              {/* Title */}
              <Text style={[styles.helpTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                To help you find your account, we need more info
              </Text>

              {/* Subtitle description */}
              <Text style={[styles.helpText, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                {isPhoneMode 
                  ? "Enter your mobile number so that we can use a secure process to help you get back in."
                  : "Enter your email or username so that we can use a secure process to help you get back in."
                }
              </Text>

              {/* OK Button */}
              <Pressable
                style={[styles.primaryButton, { backgroundColor: '#0064E0', marginTop: 24 }]}
                onPress={() => setShowHelpModal(false)}
              >
                <Text style={styles.primaryButtonText}>OK</Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </View>
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
    paddingBottom: 24,
  },
  topBar: { height: 48, justifyContent: 'center', marginTop: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  innerContainer: { flex: 1, marginTop: 10 },
  title: { fontSize: 24, fontFamily: Fonts.bold, marginBottom: 12 },
  subtitle: { fontSize: 15, fontFamily: Fonts.regular, lineHeight: 20, marginBottom: 4 },
  helpLink: { marginBottom: 24 },
  helpLinkText: { color: '#0064E0', fontFamily: Fonts.semiBold, fontSize: 15 },
  inputContainer: { width: '100%' },
  primaryButton: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', width: '100%' },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 15 },
  switchModeButton: { alignSelf: 'center', marginTop: 24, paddingVertical: 8 },
  switchModeText: { fontSize: 15, fontFamily: Fonts.bold },
  
  // Divider Styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },

  // Facebook Button Styles
  facebookButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  facebookIcon: {
    marginRight: 8,
  },
  facebookButtonText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  
  // Help Bottom Sheet Styles
  helpModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  helpBottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 12,
    maxHeight: '45%',
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
  helpHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
    marginLeft: -4,
  },
  helpContent: {
    paddingBottom: 16,
  },
  helpTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    marginBottom: 12,
    textAlign: 'left',
    lineHeight: 28,
  },
  helpText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    textAlign: 'left',
  },
});
