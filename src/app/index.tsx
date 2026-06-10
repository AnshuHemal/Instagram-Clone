import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SplashScreen } from '@/components/SplashScreen';
import { useTheme } from '@/contexts/ThemeContext';
import { StyleSheet, View } from 'react-native';

export default function RootIndex() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // 1. Enforce a minimum display time for the splash logo (e.g., 800ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // 2. Trigger navigation only AFTER auth details are fully resolved and minimum time has elapsed
  useEffect(() => {
    if (minTimeElapsed && !authLoading) {
      if (user) {
        if (user.isOnboarded) {
          router.replace('/(tabs)');
        } else {
          // Route the user to their specific pending step from user.onboardingStep
          const stepRouteMap: { [key: string]: string } = {
            PERMISSIONS: '/(auth)/permissions',
            PROFILE_PICTURE: '/(auth)/profile-picture',
            FOLLOW: '/(auth)/follow-suggestions',
          };
          const targetRoute = stepRouteMap[user.onboardingStep] || '/(auth)/permissions';
          router.replace({
            pathname: targetRoute as any,
            params: { isPhone: 'false' }
          });
        }
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [minTimeElapsed, authLoading, user]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <SplashScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
