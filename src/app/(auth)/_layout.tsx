import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="password" />
      <Stack.Screen name="birthday" />
      <Stack.Screen name="username" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="forgot" />
    </Stack>
  );
}
