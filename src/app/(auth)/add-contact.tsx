import React, { useState, useCallback } from 'react';
import { StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, View, Text, TextInput, ActivityIndicator, Modal, FlatList, Alert, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInDown, SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Fonts } from '@/constants/theme';
import { api } from '@/services/api';

interface CountryCode {
  code: string;
  name: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'IN +91', name: 'India', flag: '🇮🇳' },
  { code: 'US +1', name: 'United States', flag: '🇺🇸' },
  { code: 'UK +44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA +1', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU +61', name: 'Australia', flag: '🇦🇺' },
  { code: 'AE +971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SG +65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'DE +49', name: 'Germany', flag: '🇩🇪' },
];

export default function AddContactScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ isPhone?: string }>();
  const isPhoneSignup = params.isPhone === 'true'; // If signed up with phone, asks for email. Else asks for phone.
  const { colors, isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [inputValue, setInputValue] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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

  // Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{7,15}$/;

  const isValid = isPhoneSignup 
    ? emailRegex.test(inputValue.trim())
    : phoneRegex.test(inputValue.trim());

  const handleSkip = async () => {
    try {
      if (user) {
        await updateProfile(user.name, user.bio, user.avatar, false, 'FOLLOW');
      }
    } catch (e) {
      console.warn('Failed to save onboarding progress:', e);
    }
    router.push('/follow-suggestions');
  };

  const handleNext = async () => {
    if (!isValid) return;
    setIsLoading(true);
    
    const targetVal = inputValue.trim();
    const isPhone = !isPhoneSignup;
    
    try {
      await api.post('/auth/register/send-otp', {
        emailOrPhone: targetVal.toLowerCase(),
        isPhone,
      });
      
      setIsLoading(false);
      router.push({
        pathname: '/otp',
        params: {
          target: targetVal,
          isPhone: isPhone ? 'true' : 'false',
          fromAddContact: 'true',
        },
      });
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || 'Failed to send confirmation code. Please try again.';
      Alert.alert('Error', errorMsg);
    }
  };

  const renderCountryItem = ({ item }: { item: CountryCode }) => {
    const isSelected = item.code === selectedCountry.code;
    return (
      <Pressable 
        style={[
          styles.countryItem, 
          { borderBottomColor: isDark ? '#262626' : '#F2F2F7' },
          isSelected && { backgroundColor: isDark ? '#262626' : '#F2F2F7' }
        ]} 
        onPress={() => {
          setSelectedCountry(item);
          setShowCountryPicker(false);
        }}
      >
        <Text style={styles.countryFlag}>{item.flag}</Text>
        <Text style={[styles.countryName, { color: isDark ? '#FFFFFF' : '#000000' }]}>{item.name}</Text>
        <Text style={[styles.countryCodeText, { color: isDark ? '#8E8E93' : '#737373' }]}>{item.code}</Text>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}
    >
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right', 'bottom']}>
        {/* Top Header bar */}
        <View style={[styles.topBar, { justifyContent: 'flex-end' }]}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.innerContainer}>
            {/* Title & Subtitle */}
            <Animated.View entering={FadeInRight.duration(300)}>
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {isPhoneSignup ? 'Add an email address' : 'Add a mobile number'}
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                {isPhoneSignup 
                  ? 'Enter the email address where you can be contacted. No one will see this on your profile.' 
                  : 'Enter the mobile number where you can be contacted. No one will see this on your profile.'}
              </Text>
            </Animated.View>

            {/* Input field area */}
            <Animated.View entering={FadeInRight.delay(100).duration(350)}>
              <View 
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    borderColor: isFocused 
                      ? '#0064E0' 
                      : (isDark ? '#262626' : '#DBDBDB'),
                  }
                ]}
              >
                {!isPhoneSignup ? (
                  // Mobile number input with country code dropdown
                  <>
                    <Pressable 
                      style={styles.countrySelector} 
                      onPress={() => setShowCountryPicker(true)}
                    >
                      <Text style={[styles.countryText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        {selectedCountry.code.split(' ')[0]} {selectedCountry.code.split(' ')[1]}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={isDark ? '#8E8E93' : '#737373'} style={{ marginLeft: 4 }} />
                    </Pressable>
                    <View style={[styles.verticalDivider, { backgroundColor: isDark ? '#3E3E42' : '#DBDBDB' }]} />
                    <TextInput
                      style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
                      placeholder="Mobile number"
                      placeholderTextColor={isDark ? '#737373' : '#AEAEB2'}
                      value={inputValue}
                      onChangeText={setInputValue}
                      keyboardType="phone-pad"
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      autoCorrect={false}
                      autoFocus
                    />
                  </>
                ) : (
                  // Email address input
                  <TextInput
                    style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000', paddingLeft: 16 }]}
                    placeholder="Email address"
                    placeholderTextColor={isDark ? '#737373' : '#AEAEB2'}
                    value={inputValue}
                    onChangeText={setInputValue}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoCorrect={false}
                    autoFocus
                  />
                )}
              </View>
            </Animated.View>

            {/* Helper Description details */}
            <Animated.View entering={FadeInRight.delay(200).duration(350)}>
              <Text style={[styles.helperText, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                {isPhoneSignup 
                  ? 'You may receive email notifications from us for security and login purposes.' 
                  : 'You may receive SMS notifications from us for security and login purposes.'}
              </Text>
              
              <Text style={[styles.metaDescription, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                Meta uses this {isPhoneSignup ? 'email address' : 'mobile number'} across all your accounts in Accounts Center to personalize experiences, like connecting people and improving ads on our products.{' '}
                <Text style={styles.learnMoreLink}>Learn more</Text>
              </Text>
            </Animated.View>
          </View>

          {/* Action button section */}
          <Animated.View entering={FadeInDown.delay(300).duration(350)} style={styles.bottomArea}>
            <Pressable
              style={[
                styles.primaryButton,
                { backgroundColor: isValid && !isLoading ? '#0064E0' : 'rgba(0, 100, 224, 0.4)' }
              ]}
              disabled={!isValid || isLoading}
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

      {/* Country Code Picker Bottom Sheet Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCountryPicker(false)}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
            />
          </Pressable>

          <Animated.View
            entering={SlideInDown.duration(250)}
            exiting={SlideOutDown.duration(200)}
            style={[
              styles.bottomSheet,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom, 24)
              }
            ]}
          >
            <View style={[styles.dragHandle, { backgroundColor: isDark ? '#3A3A3C' : '#CCCCCC' }]} />
            
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetHeaderTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Select Country Code</Text>
              <Pressable onPress={() => setShowCountryPicker(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </Pressable>
            </View>

            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={renderCountryItem}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 350 }}
            />
          </Animated.View>
        </View>
      </Modal>
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
    paddingBottom: Platform.OS === 'ios' ? 12 : 24,
  },
  innerContainer: {
    flex: 1,
    marginTop: 18,
  },
  title: {
    fontSize: 26,
    fontFamily: Fonts.semiBold,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14.5,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderWidth: 1,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 12,
    height: '100%',
  },
  countryText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  verticalDivider: {
    width: 1,
    height: '40%',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingRight: 16,
    paddingLeft: 12,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  helperText: {
    fontSize: 14.5,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 18,
  },
  metaDescription: {
    fontSize: 13.5,
    fontFamily: Fonts.regular,
    lineHeight: 18.5,
  },
  learnMoreLink: {
    color: '#0064E0',
    fontFamily: Fonts.semiBold,
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
    fontFamily: Fonts.semiBold,
    fontSize: 15.5,
  },
  // Modal Bottom Sheet
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 16,
  },
  dragHandle: {
    width: 36,
    height: 4.5,
    borderRadius: 2.25,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetHeaderTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  countryFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  countryCodeText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
});
