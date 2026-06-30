import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, View, Text, Modal, BackHandler, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useLoading } from '@/contexts/LoadingContext';
import { InstagramInput } from '@/components/InstagramInput';
import { Fonts } from '@/constants/theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysInMonth = (monthIndex: number, year: number) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

export default function BirthdayScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showLoading, hideLoading } = useLoading();
  const params = useLocalSearchParams<{ phoneOrEmail?: string; isPhone?: string; password?: string; birthday?: string; signupToken?: string }>();
  const insets = useSafeAreaInsets();

  // Extract navigation parameters
  const [phoneOrEmail, setPhoneOrEmail] = useState(params.phoneOrEmail || '');
  const [isPhoneMode, setIsPhoneMode] = useState(params.isPhone === 'true');
  const [password, setPassword] = useState(params.password || '');
  const [signupToken, setSignupToken] = useState(params.signupToken || '');

  // Birthday states
  const currentYear = new Date().getFullYear(); // 2026
  const YEARS = Array.from({ length: 120 }, (_, i) => currentYear - i); // 2026 down to 1907

  // Default selection is 20 years ago (June 8, 2006 if today is June 8, 2026) to make it highly realistic
  const [selectedMonth, setSelectedMonth] = useState(5); // June (0-indexed)
  const [selectedDay, setSelectedDay] = useState(8);
  const [selectedYear, setSelectedYear] = useState(2006);

  // Confirmed values (saved on "Done")
  const [confirmedMonth, setConfirmedMonth] = useState(5);
  const [confirmedDay, setConfirmedDay] = useState(8);
  const [confirmedYear, setConfirmedYear] = useState(2006);

  const [error, setError] = useState('');

  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // FlatList refs for columns
  const monthRef = useRef<FlatList>(null);
  const dayRef = useRef<FlatList>(null);
  const yearRef = useRef<FlatList>(null);

  // Sync params when loaded
  useEffect(() => {
    if (params.phoneOrEmail) setPhoneOrEmail(params.phoneOrEmail);
    if (params.isPhone) setIsPhoneMode(params.isPhone === 'true');
    if (params.password) setPassword(params.password);
    
    // Parse existing birthday if available
    if (params.birthday) {
      const parts = params.birthday.split(' ');
      if (parts.length === 3) {
        const mName = parts[0];
        const dVal = parseInt(parts[1].replace(',', ''), 10);
        const yVal = parseInt(parts[2], 10);
        
        const mIdx = MONTHS.indexOf(mName);
        if (mIdx !== -1 && !isNaN(dVal) && !isNaN(yVal)) {
          setSelectedMonth(mIdx);
          setSelectedDay(dVal);
          setSelectedYear(yVal);
          setConfirmedMonth(mIdx);
          setConfirmedDay(dVal);
          setConfirmedYear(yVal);
        }
      }
    }
    if (params.signupToken) {
      setSignupToken(params.signupToken);
    }
  }, [params.phoneOrEmail, params.isPhone, params.password, params.birthday, params.signupToken]);

  const handleBack = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  // Intercept Android hardware back press
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        handleBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }, [handleBack])
  );

  // Age calculation based on confirmed birthday
  const age = (() => {
    const today = new Date();
    let calculatedAge = today.getFullYear() - confirmedYear;
    const monthDiff = today.getMonth() - confirmedMonth;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < confirmedDay)) {
      calculatedAge--;
    }
    return Math.max(0, calculatedAge);
  })();

  const formattedDate = `${MONTHS[confirmedMonth]} ${confirmedDay}, ${confirmedYear}`;

  useEffect(() => {
    if (age <= 0) {
      setError("It looks like you entered the wrong info. Please be sure to use your real birthday.");
    } else {
      setError('');
    }
  }, [age]);

  const handleNext = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push({
        pathname: '/signup',
        params: {
          step: 'NAME',
          phoneOrEmail: phoneOrEmail,
          isPhone: isPhoneMode ? 'true' : 'false',
          password: password,
          birthday: formattedDate,
          signupToken: signupToken,
        },
      });
    }, 600);
  };

  // Build list data with spacers (2 at start, 2 at end) for snapping to center
  const monthData = ['', '', ...MONTHS, '', ''];

  const daysCount = getDaysInMonth(selectedMonth, selectedYear);
  const daysArray = Array.from({ length: daysCount }, (_, i) => String(i + 1));
  const dayData = ['', '', ...daysArray, '', ''];

  const yearData = ['', '', ...YEARS.map(String), '', ''];

  // Scroll FlatLists to current selected values when bottom sheet opens
  useEffect(() => {
    if (showBottomSheet) {
      // Revert temporary selected values to confirmed values when opening
      setSelectedMonth(confirmedMonth);
      setSelectedDay(confirmedDay);
      setSelectedYear(confirmedYear);

      setTimeout(() => {
        // Initial scroll to values
        const mIdx = confirmedMonth;
        const dIdx = confirmedDay - 1;
        const yIdx = YEARS.indexOf(confirmedYear);

        monthRef.current?.scrollToOffset({ offset: mIdx * 44, animated: false });
        dayRef.current?.scrollToOffset({ offset: dIdx * 44, animated: false });
        if (yIdx !== -1) {
          yearRef.current?.scrollToOffset({ offset: yIdx * 44, animated: false });
        }
      }, 120);
    }
  }, [showBottomSheet]);

  const handleScrollEnd = (type: 'month' | 'day' | 'year', offsetY: number) => {
    const index = Math.round(offsetY / 44);
    if (type === 'month') {
      const val = Math.max(0, Math.min(11, index));
      setSelectedMonth(val);

      // Check days bounds for new month selection
      const daysInNewMonth = getDaysInMonth(val, selectedYear);
      if (selectedDay > daysInNewMonth) {
        setSelectedDay(daysInNewMonth);
        dayRef.current?.scrollToOffset({ offset: (daysInNewMonth - 1) * 44, animated: true });
      }
    } else if (type === 'day') {
      const maxDays = getDaysInMonth(selectedMonth, selectedYear);
      const val = Math.max(0, Math.min(maxDays - 1, index));
      setSelectedDay(val + 1);
    } else if (type === 'year') {
      const val = Math.max(0, Math.min(YEARS.length - 1, index));
      const yearVal = YEARS[val];
      setSelectedYear(yearVal);

      // Check days bounds for new year selection (e.g. February in leap years)
      const daysInNewMonth = getDaysInMonth(selectedMonth, yearVal);
      if (selectedDay > daysInNewMonth) {
        setSelectedDay(daysInNewMonth);
        dayRef.current?.scrollToOffset({ offset: (daysInNewMonth - 1) * 44, animated: true });
      }
    }
  };

  const handleScrollDragEnd = (type: 'month' | 'day' | 'year', event: any) => {
    if (!event.nativeEvent.decelerating) {
      handleScrollEnd(type, event.nativeEvent.contentOffset.y);
    }
  };

  const handleMomentumScrollEnd = (type: 'month' | 'day' | 'year', event: any) => {
    handleScrollEnd(type, event.nativeEvent.contentOffset.y);
  };

  const handleDonePicker = () => {
    setConfirmedMonth(selectedMonth);
    setConfirmedDay(selectedDay);
    setConfirmedYear(selectedYear);
    setShowBottomSheet(false);
  };

  const renderPickerItem = (item: string, index: number, type: 'month' | 'day' | 'year') => {
    if (item === '') {
      return <View style={styles.pickerItemSpacer} />;
    }

    let isSelected = false;
    if (type === 'month') {
      isSelected = index - 2 === selectedMonth;
    } else if (type === 'day') {
      isSelected = index - 2 === selectedDay - 1;
    } else if (type === 'year') {
      isSelected = index - 2 === YEARS.indexOf(selectedYear);
    }

    return (
      <View style={styles.pickerItem}>
        <Text
          style={[
            styles.pickerItemText,
            {
              color: isDark ? '#FFFFFF' : '#000000',
              fontWeight: isSelected ? '700' : '400',
              opacity: isSelected ? 1.0 : 0.4,
              fontSize: isSelected ? 17 : 15,
            },
          ]}
        >
          {item}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}
    >
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          </View>

          {/* Core Birthday Content */}
          <View style={styles.innerContainer}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              What's your birthday?
            </Text>

            <Text style={[styles.subtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
              Use your own birthday, even if this account is for a business, a pet, or something else. No one will see this unless you choose to share it.{' '}
              <Text
                style={{ color: '#0064E0', fontWeight: '600' }}
                onPress={() => setShowExplanationModal(true)}
              >
                Why do I need to provide my birthday?
              </Text>
            </Text>

            {/* Tap-to-pick Birthday input field */}
            <Pressable onPress={() => setShowBottomSheet(true)} style={styles.inputContainer}>
              <View pointerEvents="none">
                <InstagramInput
                  label={`Birthday (${age} years old)`}
                  value={formattedDate}
                  editable={false}
                  error={error}
                />
              </View>
            </Pressable>

            {/* Next Progression button */}
            <Pressable
              style={[
                styles.primaryButton,
                { 
                  backgroundColor: error || isLoading ? 'rgba(0, 100, 224, 0.4)' : '#0064E0', 
                  marginTop: error ? 12 : 24 // Adjust spacing dynamically depending on error text
                }
              ]}
              disabled={!!error || isLoading}
              onPress={handleNext}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Next</Text>
              )}
            </Pressable>
          </View>

          {/* Footer Back Link */}
          <View style={styles.footerContainer}>
            <Pressable
              onPress={() => {
                setShowAccountModal(true);
              }}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>I already have an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Date Picker Bottom Sheet Modal */}
      <Modal
        visible={showBottomSheet}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setShowBottomSheet(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop Pressable sibling to prevent touch conflicts */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowBottomSheet(false)}
          >
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
            />
          </Pressable>

          {/* Scroll wheel bottom sheet */}
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
            {/* Slide Down Drag indicator */}
            <View style={[styles.dragHandle, { backgroundColor: isDark ? '#3A3A3C' : '#CCCCCC' }]} />

            {/* Header with Cancel and Done */}
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setShowBottomSheet(false)} style={styles.sheetHeaderBtn}>
                <Text style={[styles.sheetHeaderBtnText, { color: isDark ? '#A8A8A8' : '#737373' }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.sheetHeaderTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Birthday</Text>
              <Pressable onPress={handleDonePicker} style={styles.sheetHeaderBtn}>
                <Text style={[styles.sheetHeaderBtnTextBlue, { color: '#0064E0' }]}>Done</Text>
              </Pressable>
            </View>

            {/* Multi-column Custom Scroller */}
            <View style={styles.pickersContainer}>
              {/* Highlight selection guides */}
              <View style={[styles.highlightBar, { borderColor: isDark ? '#262626' : '#EAEAEA' }]} pointerEvents="none" />

              {/* Month Column */}
              <FlatList
                ref={monthRef}
                data={monthData}
                extraData={selectedMonth}
                renderItem={({ item, index }) => renderPickerItem(item, index, 'month')}
                keyExtractor={(_, index) => `month-${index}`}
                snapToInterval={44}
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                getItemLayout={(data, index) => ({ length: 44, offset: 44 * index, index })}
                onMomentumScrollEnd={(e) => handleMomentumScrollEnd('month', e)}
                onScrollEndDrag={(e) => handleScrollDragEnd('month', e)}
                style={styles.pickerColumn}
                contentContainerStyle={styles.pickerColumnContent}
              />

              {/* Day Column */}
              <FlatList
                ref={dayRef}
                data={dayData}
                extraData={selectedDay}
                renderItem={({ item, index }) => renderPickerItem(item, index, 'day')}
                keyExtractor={(_, index) => `day-${index}`}
                snapToInterval={44}
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                getItemLayout={(data, index) => ({ length: 44, offset: 44 * index, index })}
                onMomentumScrollEnd={(e) => handleMomentumScrollEnd('day', e)}
                onScrollEndDrag={(e) => handleScrollDragEnd('day', e)}
                style={styles.pickerColumn}
                contentContainerStyle={styles.pickerColumnContent}
              />

              {/* Year Column */}
              <FlatList
                ref={yearRef}
                data={yearData}
                extraData={selectedYear}
                renderItem={({ item, index }) => renderPickerItem(item, index, 'year')}
                keyExtractor={(_, index) => `year-${index}`}
                snapToInterval={44}
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                getItemLayout={(data, index) => ({ length: 44, offset: 44 * index, index })}
                onMomentumScrollEnd={(e) => handleMomentumScrollEnd('year', e)}
                onScrollEndDrag={(e) => handleScrollDragEnd('year', e)}
                style={styles.pickerColumn}
                contentContainerStyle={styles.pickerColumnContent}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Explanatory Bottom Sheet Modal */}
      <Modal
        visible={showExplanationModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setShowExplanationModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop Pressable sibling to prevent touch conflicts */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowExplanationModal(false)}
          >
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
              styles.explanationBottomSheet,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom, 24)
              }
            ]}
          >
            {/* Drag Handle */}
            <View style={[styles.dragHandle, { backgroundColor: isDark ? '#3A3A3C' : '#CCCCCC' }]} />

            {/* Close Button on Left */}
            <View style={styles.explanationHeader}>
              <Pressable onPress={() => setShowExplanationModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.explanationContent}>
              {/* Left Aligned Bold Title */}
              <Text style={[styles.explanationTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Birthdays
              </Text>

              {/* Subtitle / Paragraph */}
              <Text style={[styles.explanationText, { color: isDark ? '#A8A8A8' : '#737373' }]}>
                Providing your birthday improves the features and ads you see, and helps to keep the Instagram community safe. You can find your birthday in your account settings.{' '}
                <Text style={styles.learnMoreLinkText} onPress={() => alert('Learn more link clicked')}>
                  Learn more
                </Text>
              </Text>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <Pressable
          style={styles.confirmModalOverlay}
          onPress={() => setShowConfirmModal(false)}
        >
          <Pressable
            style={[styles.confirmModalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.confirmModalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Do you want to stop creating your account?
            </Text>

            <Text style={[styles.confirmModalSubtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
              If you stop now, you'll lose any progress you've made.
            </Text>

            <View style={styles.confirmModalButtonContainer}>
              <Pressable
                onPress={() => {
                  setShowConfirmModal(false);
                  if (router.canGoBack()) {
                    router.dismissAll();
                  } else {
                    router.replace('/login');
                  }
                }}
                style={styles.confirmModalButton}
              >
                <Text style={[styles.confirmModalButtonTextBlue, { color: '#0064E0' }]}>
                  STOP CREATING ACCOUNT
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowConfirmModal(false)}
                style={styles.confirmModalButton}
              >
                <Text style={[styles.confirmModalButtonTextRed, { color: '#FA3E3E' }]}>
                  CONTINUE CREATING ACCOUNT
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Already Have an Account Confirmation Modal */}
      <Modal
        visible={showAccountModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowAccountModal(false)}
      >
        <Pressable 
          style={styles.accountModalOverlay} 
          onPress={() => setShowAccountModal(false)}
        >
          <Pressable 
            style={[styles.accountModalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.accountModalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Already have an account?
            </Text>

            <View style={styles.accountModalButtonContainer}>
              <Pressable 
                onPress={() => setShowAccountModal(false)}
                style={styles.accountModalButton}
              >
                <Text style={styles.accountModalButtonTextRed}>
                  CONTINUE CREATING ACCOUNT
                </Text>
              </Pressable>

              <Pressable 
                onPress={() => {
                  setShowAccountModal(false);
                  if (router.canGoBack()) {
                    router.dismissAll();
                  } else {
                    router.replace('/login');
                  }
                }}
                style={styles.accountModalButton}
              >
                <Text style={styles.accountModalButtonTextBlue}>
                  LOG IN
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeContainer: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topBar: { height: 48, justifyContent: 'center', marginTop: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  innerContainer: { flex: 1, marginTop: 10 },
  title: { fontSize: 24, fontFamily: Fonts.semiBold, marginBottom: 12 },
  subtitle: { fontSize: 14, fontFamily: Fonts.regular, lineHeight: 20, marginBottom: 24 },
  inputContainer: { marginTop: 4 },
  explanationLink: { alignSelf: 'flex-start', marginTop: 16 },
  linkText: { color: '#0064E0', fontFamily: Fonts.semiBold, fontSize: 14 },
  primaryButton: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', width: '100%' },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Fonts.semiBold, fontSize: 15 },
  footerContainer: { width: '100%', alignItems: 'center', marginTop: 40, paddingBottom: 30 },
  loginLink: { paddingVertical: 12 },
  loginLinkText: { color: '#0064E0', fontFamily: Fonts.semiBold, fontSize: 15 },
  
  // Custom Date Picker Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 12,
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
    marginBottom: 8,
  },
  sheetHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  sheetHeaderTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  sheetHeaderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sheetHeaderBtnText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
  },
  sheetHeaderBtnTextBlue: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  
  // Scroller wheel container
  pickersContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 220,
    position: 'relative',
    justifyContent: 'space-between',
  },
  highlightBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 88,
    height: 44,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  pickerColumn: {
    flex: 1,
    height: 220,
  },
  pickerColumnContent: {
    alignItems: 'stretch',
  },
  pickerItemSpacer: {
    height: 44,
  },
  pickerItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontFamily: Fonts.regular,
  },

  // Confirmation/Explanation Modal Styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalCard: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 10,
    lineHeight: 24,
  },
  confirmModalSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmModalButtonContainer: {
    alignItems: 'flex-end',
    gap: 18,
  },
  confirmModalButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  confirmModalButtonTextBlue: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  confirmModalButtonTextRed: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  
  // Explanation Bottom Sheet styles
  explanationBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 12,
    maxHeight: '50%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 16,
  },
  explanationHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  closeBtn: {
    padding: 4,
    marginLeft: -4,
  },
  explanationContent: {
    paddingBottom: 24,
  },
  explanationTitle: {
    fontSize: 22,
    fontFamily: Fonts.semiBold,
    marginBottom: 12,
    textAlign: 'left',
  },
  explanationText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    textAlign: 'left',
  },
  learnMoreLinkText: {
    color: '#0064E0',
    fontFamily: Fonts.semiBold,
  },
  accountModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountModalCard: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  accountModalTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 24,
    lineHeight: 24,
  },
  accountModalButtonContainer: {
    alignItems: 'flex-end',
    gap: 18,
    marginTop: 8,
  },
  accountModalButton: {
    paddingVertical: 8,
  },
  accountModalButtonTextRed: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#FA3E3E',
    letterSpacing: 0.3,
  },
  accountModalButtonTextBlue: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#0064E0',
    letterSpacing: 0.3,
  },
});
