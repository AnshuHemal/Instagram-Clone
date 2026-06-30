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
import { NotificationBannerProvider } from '@/contexts/NotificationBannerContext';
import { api } from '@/services/api';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ActionErrorProvider } from '@/contexts/ActionErrorContext';
import { ActionErrorBanner } from '@/components/ActionErrorBanner';

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
      <NetworkProvider>
      <SafeAreaProvider>
        <LoadingProvider>
          <ActionErrorProvider>
          <AuthProvider>
            <SocketProvider>
              <StoriesProvider>
                <ThemeProvider>
                  <ReelsProvider>
                    <PostsProvider>
                      <SavedProvider>
                        <BadgeProvider>
                          <ToastProvider>
                            <NotificationBannerProvider>
                              <RootLayoutContent />
                            </NotificationBannerProvider>
                          </ToastProvider>
                        </BadgeProvider>
                      </SavedProvider>
                    </PostsProvider>
                  </ReelsProvider>
                </ThemeProvider>
              </StoriesProvider>
            </SocketProvider>
          </AuthProvider>
          </ActionErrorProvider>
        </LoadingProvider>
      </SafeAreaProvider>
      </NetworkProvider>
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

  // Refresh push token on every launch
  useEffect(() => {
    const registerPushToken = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus !== 'granted') return;
        const tokenData = await Notifications.getExpoPushTokenAsync();
        if (tokenData?.data) {
          // Fire-and-forget: update token on server (token can rotate between launches)
          api.patch('/auth/push-token', { pushToken: tokenData.data }).catch(() => {});
        }
      } catch (_) {}
    };
    registerPushToken();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(chat)" />
        <Stack.Screen name="create" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="create-story" options={{ presentation: 'fullScreenModal' }} />
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
          name="reel/[id]"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="settings"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="account-privacy"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="blocked-accounts"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="notification-preferences"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="sharing-across-apps"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="friends-feed-activity"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="account-status"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="features-you-cant-use"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="under-18-availability"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="removed-content-status"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="about"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="about-profile"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="account-type-tools"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="app-website-permissions"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="apps-websites"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="message-links"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="browser-settings"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="data-usage-settings"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="language-settings"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="accessibility"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="dark-mode-settings"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="closed-captions"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="archive-download-settings"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="device-permissions-settings"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="device-permission-detail"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="like-share-counts"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="following-invites"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="limit-interactions"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="sharing-settings"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="comments-settings"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="tags-mentions-settings"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="restricted-accounts"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="content-preferences"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="sensitive-content-control"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="political-content-control"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="add-words-phrases"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
        <Stack.Screen
          name="hidden-words"
          options={{ animation: 'slide_from_right', animationDuration: 250 }}
        />
      </Stack>
      <LoadingOverlay />
      <OfflineBanner />
      <ActionErrorBanner />
      <StatusBar style="auto" />
    </>
  );
}
