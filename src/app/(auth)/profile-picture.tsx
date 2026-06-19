import React, { useState, useCallback } from 'react';
import { StyleSheet, Pressable, ScrollView, View, Text, Alert, Platform, Image, Modal, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInDown, FadeIn, FadeOut, SlideInDown, SlideOutDown, Layout } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/services/api';

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
  const { showToast } = useToast();
  
  const insets = useSafeAreaInsets();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

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

  const handleSkip = async () => {
    try {
      if (user) {
        await updateProfile(user.name, user.bio, user.avatar, false, 'ADD_CONTACT');
      }
    } catch (e) {
      console.warn('Failed to save onboarding progress:', e);
    }
    router.replace({
      pathname: '/add-contact',
      params: { isPhone }
    });
  };

  const handleFacebookImport = () => {
    setIsLoading(true);
    showToast({ message: 'Importing from Facebook...', type: 'info' });
    setTimeout(async () => {
      // Simulate importing from Facebook
      const randomFacebookAvatar = MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)];
      setAvatarUri(randomFacebookAvatar);
      
      try {
        // Remote URL — update database directly
        await api.patch('/auth/profile', {
          name: fullName,
          bio: user?.bio || 'Welcome to Instagram Clone!',
          avatarUrl: randomFacebookAvatar,
        });
        
        // Update local auth context
        updateProfile(fullName, user?.bio || 'Welcome to Instagram Clone!', randomFacebookAvatar);
        setIsUploaded(true);
        
        showToast({ message: 'Profile picture imported from Facebook successfully!', type: 'success' });
        
        setTimeout(() => {
          handleNext();
        }, 800);
      } catch (err: any) {
        console.error('Failed to save profile picture:', err);
        const errMsg = err.response?.data?.message || 'Failed to save profile picture. Please try again.';
        showToast({ message: errMsg, type: 'error', title: 'Upload Error' });
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };

  const handleAddPicture = async () => {
    setShowPicker(false);
    
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Sorry, we need camera roll permissions to upload a profile picture.'
      );
      return;
    }

    // Launch Image Library with editing enabled
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
      setIsUploaded(false); // Reset upload state for new photo
    }
  };

  const handleChoosePreset = (url: string) => {
    setAvatarUri(url);
    setIsUploaded(false); // Reset upload state for new photo
    setShowPicker(false);
  };

  const handleUpload = async () => {
    if (!avatarUri) return;
    setIsLoading(true);

    try {
      if (avatarUri.startsWith('http')) {
        // Remote URL (preset avatar or Facebook import) — update database directly
        await api.patch('/auth/profile', {
          name: fullName,
          bio: user?.bio || 'Welcome to Instagram Clone!',
          avatarUrl: avatarUri,
        });
        
        // Update local auth context
        updateProfile(fullName, user?.bio || 'Welcome to Instagram Clone!', avatarUri);
        setIsUploaded(true);
        
        showToast({ message: 'Profile picture updated successfully!', type: 'success' });
        
        setTimeout(() => {
          handleNext();
        }, 800);
      } else {
        // Local file URI — upload via FormData
        const formData = new FormData();
        
        // Extract file extension and name
        const uriParts = avatarUri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split('.').pop() || 'jpeg';

        formData.append('file', {
          uri: Platform.OS === 'android' ? avatarUri : avatarUri.replace('file://', ''),
          name: fileName || 'avatar.jpg',
          type: `image/${fileType}`,
        } as any);

        const response = await api.post('/auth/profile/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data && response.data.avatarUrl) {
          // Update local auth context
          updateProfile(fullName, user?.bio || 'Welcome to Instagram Clone!', response.data.avatarUrl);
          setIsUploaded(true);
          
          showToast({ message: 'Profile picture uploaded successfully!', type: 'success' });
          
          setTimeout(() => {
            handleNext();
          }, 800);
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (err: any) {
      console.error('Failed to save profile picture:', err);
      const errMsg = err.response?.data?.message || 'Failed to save profile picture. Please try again.';
      Alert.alert('Upload Error', errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    try {
      if (user) {
        await updateProfile(user.name, user.bio, user.avatar, false, 'ADD_CONTACT');
      }
    } catch (e) {
      console.warn('Failed to save onboarding progress:', e);
    }
    router.replace({
      pathname: '/add-contact',
      params: { isPhone }
    });
  };

  const handlePressPrimary = () => {
    if (!avatarUri) {
      setShowPicker(true);
    } else if (isUploaded) {
      handleNext();
    } else {
      handleUpload();
    }
  };

  const getButtonText = () => {
    if (!avatarUri) return "Add picture";
    if (isUploaded) return "Next";
    return "Upload";
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
            <Pressable 
              onPress={() => setShowPicker(true)}
              style={[styles.avatarCircle, { backgroundColor: isDark ? '#262626' : '#F2F2F7' }]}
            >
              {avatarUri ? (
                <Animated.Image 
                  entering={FadeIn.duration(300)}
                  source={{ uri: avatarUri }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <Ionicons name="person" size={54} color={isDark ? '#8E8E93' : '#AEAEB2'} />
              )}
            </Pressable>

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
            onPress={handlePressPrimary}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {getButtonText()}
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
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalContainer}>
          {/* Backdrop */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPicker(false)}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={[StyleSheet.absoluteFill, styles.modalBackdrop]}
            />
          </Pressable>

          {/* Sheet — slides up from bottom */}
          <Animated.View
            entering={SlideInDown.springify().damping(20).stiffness(160)}
            exiting={SlideOutDown.duration(220)}
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 0,
              },
            ]}
          >
            {/* Grab Handle */}
            <View style={[styles.dragHandle, { backgroundColor: isDark ? '#48484A' : '#D1D1D6' }]} />

            {/* Title */}
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Select Profile Photo
            </Text>

            {/* Choose from Library */}
            <Pressable
              onPress={handleAddPicture}
              style={[styles.libraryButton, { backgroundColor: '#0064E0' }]}
            >
              <Ionicons name="image-outline" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.libraryButtonText}>Choose from Library</Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6' }]} />
              <Text style={[styles.dividerText, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>Or choose a preset</Text>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6' }]} />
            </View>

            {/* Avatar Grid */}
            <View style={styles.avatarsGrid}>
              {MOCK_AVATARS.map((url, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleChoosePreset(url)}
                  style={({ pressed }) => [
                    styles.gridItem,
                    pressed && { opacity: 0.72, transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <Image source={{ uri: url }} style={styles.gridAvatar} />
                </Pressable>
              ))}
            </View>

            {/* Cancel */}
            <Pressable
              onPress={() => setShowPicker(false)}
              style={({ pressed }) => [
                styles.cancelButton,
                { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        </View>
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
  // ── Modal Sheet ──
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 24,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
    marginTop: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  avatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 40,
    overflow: 'hidden',
  },
  gridAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cancelButton: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  libraryButton: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  libraryButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 12.5,
    fontFamily: Fonts.medium,
  },
});
