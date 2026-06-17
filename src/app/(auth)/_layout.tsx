import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthLayout() {
  const { isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Smooth right-to-left slide for all auth screens
        animation: 'slide_from_right',
        animationDuration: 260,
        contentStyle: {
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
        },
      }}
    >
      <Stack.Screen name="login" options={{ animation: 'fade' }} />
      <Stack.Screen name="signup" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="password" />
      <Stack.Screen name="birthday" />
      <Stack.Screen name="username" />
      <Stack.Screen name="terms" />
      {/* Onboarding screens — no back gesture */}
      <Stack.Screen
        name="permissions"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="profile-picture"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="add-contact"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="follow-suggestions"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="forgot" />
      <Stack.Screen name="notification-preferences" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="hashtag" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
