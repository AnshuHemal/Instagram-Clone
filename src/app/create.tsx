import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, Image, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { MOCK_POSTS, Post } from '@/constants/mockData';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800', // Food
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800', // City
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', // Beach
  'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800', // Cabin
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800', // Abstract
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0]);

  const handleShare = () => {
    if (!caption.trim()) return;

    const newPost: Post = {
      id: `p_new_${Date.now()}`,
      user: {
        username: user?.username || 'antigravity_coder',
        name: user?.name || 'Antigravity Dev',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      },
      imageUrl: selectedImage,
      caption: caption.trim(),
      likesCount: 0,
      commentsCount: 0,
      comments: [],
      timestamp: '1 second ago',
      isLiked: false,
      isBookmarked: false,
      location: location.trim() ? location.trim() : undefined,
    };

    // Prepend to database
    MOCK_POSTS.unshift(newPost);
    
    // Increment postsCount on user
    if (user) {
      user.postsCount = user.postsCount + 1;
    }

    // Reset Form
    setCaption('');
    setLocation('');
    setSelectedImage(PRESET_IMAGES[0]);

    // Go back to Home Feed
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const isFormValid = caption.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 90}
    >
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle} type="subtitle">
            New Post
          </ThemedText>
          <Pressable onPress={handleShare} disabled={!isFormValid} style={styles.headerButton}>
            <ThemedText type="smallBold" style={{ color: isFormValid ? colors.primary : colors.textSecondary }}>
              Share
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Selected Image Preview */}
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          </View>

          {/* Preset Images Selection */}
          <View style={styles.presetsSection}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Select a Photo
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsList}>
              {PRESET_IMAGES.map((imgUrl, index) => {
                const isSelected = imgUrl === selectedImage;
                return (
                  <Pressable
                    key={index}
                    onPress={() => setSelectedImage(imgUrl)}
                    style={[
                      styles.presetItem,
                      isSelected && { borderColor: colors.primary, borderWidth: 3 },
                    ]}
                  >
                    <Image source={{ uri: imgUrl }} style={styles.presetImage} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="create-outline" size={20} color={colors.text} style={styles.inputIcon} />
              <TextInput
                placeholder="Write a caption..."
                placeholderTextColor={isDark ? '#8E8E8F' : '#9E9E9E'}
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={3}
                style={[styles.inputField, { color: colors.text }]}
              />
            </View>

            <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="location-outline" size={20} color={colors.text} style={styles.inputIcon} />
              <TextInput
                placeholder="Add location"
                placeholderTextColor={isDark ? '#8E8E8F' : '#9E9E9E'}
                value={location}
                onChangeText={setLocation}
                style={[styles.inputField, { color: colors.text }]}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 56,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#000000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  presetsSection: {
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  presetsList: {
    gap: 12,
  },
  presetItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  presetImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  formContainer: {
    paddingHorizontal: 15,
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 0.5,
    paddingVertical: 15,
  },
  inputIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    textAlignVertical: 'top',
  },
});
