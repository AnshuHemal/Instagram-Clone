import React, { useState, useCallback } from 'react';
import { StyleSheet, Pressable, ScrollView, View, Text, Platform, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import * as Contacts from 'expo-contacts';
import * as Notifications from 'expo-notifications';

export default function PermissionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ isPhone?: string }>();
  const isPhone = params.isPhone || 'false';
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  // Disable hardware back button on Android
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        return true; // prevent going back
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }, [])
  );

  const handleSkip = () => {
    router.replace({
      pathname: '/profile-picture',
      params: { isPhone }
    });
  };

  const completeFlow = () => {
    setIsLoading(false);
    router.replace({
      pathname: '/profile-picture',
      params: { isPhone }
    });
  };

  const handleNext = async () => {
    setIsLoading(true);
    
    try {
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
          finalStatus = status;
        }
        console.log('Notification permission status:', finalStatus);
      }
    } catch (error) {
      console.warn('Error requesting notifications permission:', error);
    }

    try {
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Contacts.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Contacts.requestPermissionsAsync();
          finalStatus = status;
        }
        console.log('Contacts permission status:', finalStatus);
      }
    } catch (error) {
      console.warn('Error requesting contacts permission:', error);
    }

    completeFlow();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]} edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Header Bar */}
      <View style={[styles.topBar, { justifyContent: 'flex-end' }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Animated Main Content Wrapper */}
        <Animated.View entering={FadeInRight.duration(350).springify()} style={styles.innerContainer}>
          
          {/* Headline Title */}
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Allow Instagram to access your device?
          </Text>

          {/* List Item 1: Notifications */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.listItem}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
              <Ionicons name="notifications-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.listItemTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Notifications
              </Text>
              <Text style={[styles.listItemDescription, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                Turning on notifications helps you keep up with your friends. You can also turn on notifications for messages only.
              </Text>
            </View>
          </Animated.View>

          {/* List Item 2: Contacts */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.listItem}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
              <Ionicons name="book-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.listItemTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Contacts
              </Text>
              <Text style={[styles.listItemDescription, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                Contacts on this device will be periodically synced and stored securely on our servers to help recommend more relevant people and things. <Text style={styles.linkText}>Learn more</Text>
              </Text>
            </View>
          </Animated.View>
          
        </Animated.View>

        {/* Bottom Actions Area */}
        <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.bottomArea}>
          <Text style={[styles.helperText, { color: isDark ? '#A8A8A8' : '#737373' }]}>
            Next, allow access or skip these steps. You can change these settings anytime. If you already have Instagram on your device, some settings may have been turned on previously.
          </Text>

          <Pressable
            style={[styles.primaryButton, { backgroundColor: isLoading ? 'rgba(0, 100, 224, 0.6)' : '#0064E0' }]}
            disabled={isLoading}
            onPress={handleNext}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Next</Text>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 20 : 28,
  },
  innerContainer: {
    flex: 1,
    marginTop: 18,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    lineHeight: 36,
    marginBottom: 36,
    letterSpacing: -0.5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  textContainer: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 14.5,
    fontFamily: Fonts.regular,
    lineHeight: 20.5,
  },
  linkText: {
    color: '#0064E0',
    fontFamily: Fonts.semiBold,
  },
  bottomArea: {
    marginTop: 40,
  },
  helperText: {
    fontSize: 12.5,
    fontFamily: Fonts.regular,
    lineHeight: 18.5,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  primaryButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 15.5,
  },
});
