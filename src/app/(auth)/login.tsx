import React, { useState } from 'react';
import { StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { ThemedText } from '@/components/themed-text';
import { InstagramInput } from '@/components/InstagramInput';
import { Fonts } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { login } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        router.replace('/(tabs)');
      } else {
        setError('Incorrect username or password. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Incorrect username or password. Please try again.');
      setIsLoading(false);
    }
  };

  const isFormValid = username.trim().length > 0 && password.trim().length > 5;

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
          {/* Top Language Dropdown Selector */}
          <View style={styles.languageContainer}>
            <Pressable style={styles.languageSelector}>
              <Text style={[styles.languageText, { color: isDark ? '#8E8E93' : '#737373' }]}>
                English (US)
              </Text>
              <Ionicons name="chevron-down" size={14} color={isDark ? '#8E8E93' : '#737373'} />
            </Pressable>
          </View>

          {/* Central Logo Box */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/instagram_splash.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>

          {/* Login Form Fields */}
          <View style={styles.formContainer}>
            <InstagramInput
              label="Username, email or mobile number"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <InstagramInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Log in Pill Button */}
            <Pressable
              style={[
                styles.loginButton,
                {
                  backgroundColor: isFormValid && !isLoading ? '#0064E0' : 'rgba(0, 100, 224, 0.4)',
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

            {/* Forgot Password Link */}
            <Pressable 
              style={styles.forgotButton}
              onPress={() => router.push('/forgot')}
            >
              <Text style={[styles.forgotButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Forgot password?
              </Text>
            </Pressable>
          </View>

          {/* Footer Actions & Meta Branding */}
          <View style={styles.footerContainer}>
            {/* Create Outlined Account Button */}
            <Pressable 
              style={[styles.createButton, { borderColor: '#0064E0' }]}
              onPress={() => router.push('/signup')}
            >
              <Text style={[styles.createButtonText, { color: '#0064E0' }]}>Create new account</Text>
            </Pressable>

            {/* Meta Branding */}
            <View style={styles.metaBranding}>
              <Text style={[styles.metaText, { color: isDark ? '#737373' : '#8E8E8F' }]}>from</Text>
              <View style={styles.metaLogoRow}>
                <Image
                  source={require('@/assets/images/meta.png')}
                  style={[styles.metaIcon, { tintColor: isDark ? '#FFFFFF' : '#0064E0' }]}
                  contentFit="contain"
                />
                <Text style={[styles.metaTextBold, { color: isDark ? '#FFFFFF' : '#000000' }]}>Meta</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  languageContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  languageText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  formContainer: {
    width: '100%',
    gap: 12,
  },
  errorText: {
    color: '#FF3040',
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 4,
  },
  loginButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  forgotButtonText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
    marginTop: 60,
  },
  createButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#0064E0',
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  metaBranding: {
    alignItems: 'center',
    gap: 4,
    paddingBottom: 10,
  },
  metaLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaIcon: {
    width: 15,
    height: 15,
  },
  metaTextBold: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
});
