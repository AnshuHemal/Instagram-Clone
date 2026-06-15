import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, getOnboardingRoute } from '@/contexts/AuthContext';
import { SplashScreen } from '@/components/SplashScreen';
import { useTheme } from '@/contexts/ThemeContext';

// Minimum time (ms) to show the splash screen even if auth resolves instantly.
// This prevents a jarring flash of the splash before the first real screen.
const SPLASH_MIN_DURATION = 900;

export default function RootIndex() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isDark } = useTheme();

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // ── Minimum splash display timer ──────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), SPLASH_MIN_DURATION);
    return () => clearTimeout(t);
  }, []);

  // ── Navigate once both guards are satisfied ───────────────────────────────
  useEffect(() => {
    if (!minTimeElapsed || authLoading) return;

    if (!user) {
      // No authenticated session → show login
      router.replace('/(auth)/login');
      return;
    }

    if (user.isOnboarded) {
      // Fully onboarded → go straight to the main app
      router.replace('/(tabs)');
      return;
    }

    // Mid-onboarding → resume from where they left off
    const targetRoute = getOnboardingRoute(user.onboardingStep);
    router.replace({
      pathname: targetRoute as any,
      params: { isPhone: 'false' },
    });
  }, [minTimeElapsed, authLoading, user]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
      ]}
    >
      <SplashScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
