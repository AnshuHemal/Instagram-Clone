import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, getOnboardingRoute } from '@/contexts/AuthContext';
import { InstagramInput } from '@/components/InstagramInput';
import { Fonts } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Entrance animations ────────────────────────────────────────────────────
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-20);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(24);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    logoTranslateY.value = withSpring(0, { damping: 16, stiffness: 120 });

    formOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    formTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 16, stiffness: 120 }),
    );
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const formAnimStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  // ── Login handler ──────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const loggedInUser = await login(identifier.trim(), password);
      if (!loggedInUser) {
        setError('Incorrect username or password. Please try again.');
        return;
      }

      // Login succeeded — Navigate based on onboarding state.
      if (loggedInUser.isOnboarded) {
        router.replace('/(tabs)');
      } else {
        const targetRoute = getOnboardingRoute(loggedInUser.onboardingStep);
        router.replace({
          pathname: targetRoute as any,
          params: { isPhone: 'false' },
        });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    identifier.trim().length > 0 && password.trim().length >= 6;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
      ]}
    >
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Language selector ── */}
          <View style={styles.languageContainer}>
            <Pressable style={styles.languageSelector}>
              <Text
                style={[
                  styles.languageText,
                  { color: isDark ? '#8E8E93' : '#737373' },
                ]}
              >
                English (US)
              </Text>
              <Ionicons
                name="chevron-down"
                size={13}
                color={isDark ? '#8E8E93' : '#737373'}
              />
            </Pressable>
          </View>

          {/* ── Logo ── */}
          <Animated.View style={[styles.logoContainer, logoAnimStyle]}>
            <Image
              source={require('@/assets/images/instagram_splash.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </Animated.View>

          {/* ── Form ── */}
          <Animated.View style={[styles.formContainer, formAnimStyle]}>
            <InstagramInput
              label="Username, email or mobile number"
              value={identifier}
              onChangeText={(v) => {
                setIdentifier(v);
                if (error) setError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <InstagramInput
              label="Password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) setError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={isFormValid ? handleLogin : undefined}
            />

            {/* Inline error */}
            {error ? (
              <Animated.Text
                entering={FadeInDown.duration(200)}
                style={styles.errorText}
              >
                {error}
              </Animated.Text>
            ) : null}

            {/* Log in button */}
            <Pressable
              style={[
                styles.loginButton,
                {
                  backgroundColor:
                    isFormValid && !isLoading
                      ? '#0064E0'
                      : 'rgba(0, 100, 224, 0.38)',
                },
              ]}
              disabled={!isFormValid || isLoading}
              onPress={handleLogin}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Log in</Text>
              )}
            </Pressable>

            {/* Forgot password */}
            <Pressable
              style={styles.forgotButton}
              onPress={() => router.push('/(auth)/forgot')}
            >
              <Text
                style={[
                  styles.forgotButtonText,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                Forgot password?
              </Text>
            </Pressable>
          </Animated.View>

          {/* ── Footer ── */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(350)}
            style={styles.footerContainer}
          >
            {/* OR divider */}
            <View style={styles.dividerRow}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: isDark ? '#262626' : '#DBDBDB' },
                ]}
              />
              <Text
                style={[
                  styles.dividerText,
                  { color: isDark ? '#A8A8A8' : '#737373' },
                ]}
              >
                OR
              </Text>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: isDark ? '#262626' : '#DBDBDB' },
                ]}
              />
            </View>

            {/* Create new account */}
            <Pressable
              style={[
                styles.createButton,
                { borderColor: isDark ? '#3A3A3C' : '#DBDBDB' },
              ]}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text
                style={[
                  styles.createButtonText,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                Create new account
              </Text>
            </Pressable>

            {/* Meta branding */}
            <View style={styles.metaBranding}>
              <Text
                style={[
                  styles.metaFromText,
                  { color: isDark ? '#737373' : '#8E8E8F' },
                ]}
              >
                from
              </Text>
              <View style={styles.metaRow}>
                <Image
                  source={require('@/assets/images/meta.png')}
                  style={[
                    styles.metaIcon,
                    { tintColor: isDark ? '#FFFFFF' : '#0064E0' },
                  ]}
                  contentFit="contain"
                />
                <Text
                  style={[
                    styles.metaText,
                    { color: isDark ? '#FFFFFF' : '#000000' },
                  ]}
                >
                  Meta
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeContainer: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },

  // Language
  languageContainer: { alignItems: 'center', marginTop: 12 },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  languageText: { fontSize: 14, fontFamily: Fonts.regular },

  // Logo
  logoContainer: { alignItems: 'center', marginTop: 48, marginBottom: 40 },
  logoImage: { width: 72, height: 72 },

  // Form
  formContainer: { width: '100%', gap: 12 },
  errorText: {
    color: '#FF3040',
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 2,
    lineHeight: 18,
  },
  loginButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 15.5,
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  forgotButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },

  // Footer
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.6,
  },
  createButton: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15.5,
  },
  metaBranding: { alignItems: 'center', gap: 4, paddingBottom: 8 },
  metaFromText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaIcon: { width: 16, height: 16 },
  metaText: { fontSize: 15, fontFamily: Fonts.semiBold, letterSpacing: 0.4 },
});
