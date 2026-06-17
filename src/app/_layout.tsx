import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { StoriesProvider } from '@/contexts/StoriesContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { ReelsProvider } from '@/contexts/ReelsContext';
import { PostsProvider } from '@/contexts/PostsContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { BadgeProvider } from '@/contexts/BadgeContext';
import { SavedProvider } from '@/contexts/SavedContext';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { NotificationBannerBridge } from '@/components/NotificationBannerBridge';

// Configure how notifications are displayed while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Create a default Android notification channel
(async () => {
  if (typeof Notifications.setNotificationChannelAsync === 'function') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E1306C',
      });
    } catch (_) {
      // Not on Android or already set
    }
  }
})();

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
                      <SavedProvider>
                        <BadgeProvider>
                          <ToastProvider>
                            <RootLayoutContent />
                          </ToastProvider>
                        </BadgeProvider>
                      </SavedProvider>
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
  const router = useRouter();

  // Handle notification taps: navigate to notifications screen
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // Navigate to notifications screen whenever user taps a push notification
        try {
          router.push('/notifications');
        } catch (err) {
          console.warn('[PushTap] Navigation failed:', err);
        }
      },
    );
    return () => subscription.remove();
  }, [router]);

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
        <Stack.Screen
          name="post/[id]"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="edit-post/[id]"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="hashtag/[tag]"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="settings"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
      </Stack>
      <LoadingOverlay />
      <StatusBar style="auto" />
    </>
  );
}
