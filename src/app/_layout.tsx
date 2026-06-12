import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { StoriesProvider } from '@/contexts/StoriesContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { ReelsProvider } from '@/contexts/ReelsContext';
import { PostsProvider } from '@/contexts/PostsContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LoadingProvider>
          <AuthProvider>
            <SocketProvider>
              <StoriesProvider>
                <ThemeProvider>
                  <ReelsProvider>
                    <PostsProvider>
                      <ToastProvider>
                        <RootLayoutContent />
                      </ToastProvider>
                    </PostsProvider>
                  </ReelsProvider>
                </ThemeProvider>
              </StoriesProvider>
            </SocketProvider>
          </AuthProvider>
        </LoadingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutContent() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(chat)" />
        <Stack.Screen name="create" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="connections"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="notifications"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ animation: 'fade', animationDuration: 200 }}
        />
      </Stack>
      <LoadingOverlay />
      <StatusBar style="auto" />
    </>
  );
}
