import React, { useState, useCallback } from 'react';
import { StyleSheet, Pressable, ScrollView, View, Text, Alert, Platform, Image, Modal, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInDown, Layout } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Fonts } from '@/constants/theme';

const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', // Female 1
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', // Male 1
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', // Female 2
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', // Male 2
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', // Female 3
];

export default function ProfilePictureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ isPhone?: string }>();
  const isPhone = params.isPhone || 'false';
  const { colors, isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fallbacks in case user state isn't initialized yet
  const username = user?.username || 'insforgetester';
  const fullName = user?.name || 'Insforge Tester';

  // Disable Android back action
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
      pathname: '/add-contact',
      params: { isPhone }
    });
  };

  const handleFacebookImport = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Simulate importing from Facebook
      const randomFacebookAvatar = MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)];
      setAvatarUri(randomFacebookAvatar);
      setIsLoading(false);
      Alert.alert("Import Success", "Successfully imported profile picture from Facebook!");
    }, 1200);
  };

  const handleChoosePhoto = (url: string) => {
    setAvatarUri(url);
    setShowPicker(false);
  };

  const handleNext = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (avatarUri) {
        updateProfile(fullName, user?.bio || 'Welcome to Instagram Clone!', avatarUri);
      }
      setIsLoading(false);
      router.replace({
        pathname: '/add-contact',
        params: { isPhone }
      });
    }, 600);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header top bar */}
      <View style={[styles.topBar, { justifyContent: 'flex-end' }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContainer}>
          {/* Main Titles */}
          <Animated.View entering={FadeInRight.duration(300)}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Add profile picture
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
              Add a profile picture so your friends know it's you.
            </Text>
          </Animated.View>

          {/* Central Card */}
          <Animated.View 
            entering={FadeInRight.delay(150).duration(350)}
            style={[
              styles.profileCard, 
              { 
                backgroundColor: isDark ? '#121212' : '#FFFFFF',
                borderColor: isDark ? '#262626' : '#EAEAEA',
                shadowColor: isDark ? '#000000' : '#000000',
              }
            ]}
          >
            {/* Avatar Container */}
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#262626' : '#F2F2F7' }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={54} color={isDark ? '#8E8E93' : '#AEAEB2'} />
              )}
            </View>

            {/* Username & Name */}
            <Text style={[styles.usernameText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {username}
            </Text>
            <Text style={[styles.nameText, { color: isDark ? '#8E8E93' : '#737373' }]}>
              {fullName}
            </Text>
          </Animated.View>
        </View>

        {/* Action Button Row */}
        <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.bottomArea}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: '#0064E0' }]}
            disabled={isLoading}
            onPress={avatarUri ? handleNext : () => setShowPicker(true)}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {avatarUri ? "Next" : "Add picture"}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={handleFacebookImport} style={styles.facebookButton} disabled={isLoading}>
            <Text style={styles.facebookButtonText}>
              Import from Facebook
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Modern Picker Options Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Grab Handle */}
            <View style={[styles.dragHandle, { backgroundColor: isDark ? '#3A3A3C' : '#CCCCCC' }]} />
            
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Select Profile Photo
            </Text>

            {/* Grid of mock avatars */}
            <View style={styles.avatarsGrid}>
              {MOCK_AVATARS.map((url, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleChoosePhoto(url)}
                  style={styles.gridItem}
                >
                  <Image source={{ uri: url }} style={styles.gridAvatar} />
                </Pressable>
              ))}
            </View>

            <Pressable 
              onPress={() => setShowPicker(false)}
              style={[styles.cancelButton, { backgroundColor: isDark ? '#262626' : '#F2F2F7' }]}
            >
              <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14.5,
    fontFamily: Fonts.regular,
    lineHeight: 20.5,
    marginBottom: 44,
  },
  profileCard: {
    width: '85%',
    aspectRatio: 0.95,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    // Shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  usernameText: {
    fontSize: 17.5,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  bottomArea: {
    marginTop: 40,
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
  facebookButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  facebookButtonText: {
    color: '#0064E0',
    fontFamily: Fonts.bold,
    fontSize: 14.5,
  },
  // Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  dragHandle: {
    width: 36,
    height: 4.5,
    borderRadius: 2.25,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: 24,
  },
  avatarsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 28,
    gap: 12,
  },
  gridItem: {
    width: '28%',
    aspectRatio: 1.0,
    borderRadius: 38,
    overflow: 'hidden',
  },
  gridAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cancelButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 15.5,
  },
});
