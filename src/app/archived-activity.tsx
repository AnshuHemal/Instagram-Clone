import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  FadeIn,
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';
import { InstagramBottomSheet } from '@/components/InstagramBottomSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'stories' | 'highlights' | 'calendar' | 'map';
type ArchiveType = 'Stories archive' | 'Posts archive' | 'Live Archive' | 'Instants archive';

const TABS: TabType[] = ['stories', 'highlights', 'calendar', 'map'];

export default function ArchivedActivityScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>('stories');
  const [archiveType, setArchiveType] = useState<ArchiveType>('Stories archive');
  const [showArchivePicker, setShowArchivePicker] = useState(false);
  const [showLocationBanner, setShowLocationBanner] = useState(true);

  const scrollViewRef = useRef<Animated.ScrollView>(null);

  // Animated scroll position tracker for tab indicator synchronization
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: scrollX.value / 4,
        },
      ],
    };
  });

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleMoreOptions = () => {
    haptics.light();
    showToast({ message: 'Settings & options coming soon', type: 'info' });
  };

  const handleTabPress = (tab: TabType) => {
    haptics.light();
    setActiveTab(tab);
    const index = TABS.indexOf(tab);
    if (index !== -1) {
      scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / SCREEN_WIDTH);
    const selectedTab = TABS[index];
    if (selectedTab && selectedTab !== activeTab) {
      haptics.light();
      setActiveTab(selectedTab);
    }
  };

  const handleSelectArchiveType = (type: ArchiveType) => {
    haptics.medium();
    setArchiveType(type);
    setShowArchivePicker(false);
    showToast({ message: `Switched to: ${type}`, type: 'success' });
  };

  const labelColor = isDark ? '#FFFFFF' : '#000000';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const divColor = isDark ? '#262626' : '#DBDBDB';
  const tabActiveUnderline = isDark ? '#FFFFFF' : '#000000';

  // Render Calendar Mockup
  const renderCalendar = () => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.calendarWrapper}>
        <Text style={[styles.monthLabel, { color: labelColor }]}>June 2026</Text>
        <View style={styles.weekdaysRow}>
          {weekdays.map((d) => (
            <Text key={d} style={[styles.weekdayText, { color: descColor }]}>
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {/* Empty spacer for Sunday since June 1, 2026 is Monday */}
          <View style={styles.dayCellSpacer} />
          {days.map((day) => (
            <View key={day} style={styles.dayCell}>
              <Text style={[styles.dayText, { color: labelColor }]}>{day}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render Map Mockup
  const renderMap = () => {
    const roadColor = isDark ? '#2A2A2A' : '#EAEAEA';
    const riverColor = isDark ? '#1C3B5E' : '#BEE3F8';
    const landColor = isDark ? '#121212' : '#F7FAFC';
    const greenAreaColor = isDark ? '#1E2F20' : '#E6F4EA';

    return (
      <View style={styles.mapRoot}>
        {showLocationBanner && (
          <View style={[styles.mapBanner, { backgroundColor: isDark ? '#262626' : '#F9F9F9', borderBottomColor: divColor }]}>
            <Text style={[styles.mapBannerText, { color: labelColor }]}>
              When you add a location sticker to your stories, they'll appear on this Map. Only you can see your archive.
            </Text>
            <Pressable onPress={() => setShowLocationBanner(false)} hitSlop={8} style={styles.mapBannerClose}>
              <Ionicons name="close" size={16} color={descColor} />
            </Pressable>
          </View>
        )}

        <View style={[styles.mapCanvas, { backgroundColor: landColor }]}>
          {/* Blue river */}
          <View style={[styles.river, { backgroundColor: riverColor, top: '25%', height: 28, width: '130%', left: '-15%', transform: [{ rotate: '-25deg' }] }]} />

          {/* Green parks */}
          <View style={[styles.greenPatch, { backgroundColor: greenAreaColor, top: '12%', left: '8%', width: 100, height: 70, borderRadius: 25 }]} />
          <View style={[styles.greenPatch, { backgroundColor: greenAreaColor, top: '60%', left: '55%', width: 140, height: 110, borderRadius: 30 }]} />

          {/* Roads */}
          <View style={[styles.road, { backgroundColor: roadColor, top: '45%', height: 5, width: '100%' }]} />
          <View style={[styles.road, { backgroundColor: roadColor, left: '35%', width: 5, height: '100%' }]} />
          <View style={[styles.road, { backgroundColor: roadColor, left: '15%', width: 5, height: '100%', transform: [{ rotate: '35deg' }] }]} />
          <View style={[styles.road, { backgroundColor: roadColor, top: '80%', height: 5, width: '100%', transform: [{ rotate: '-12deg' }] }]} />

          {/* City Labels */}
          <View style={[styles.mapLabelContainer, { top: '15%', left: '10%' }]}>
            <Text style={[styles.mapLabel, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>Kalol</Text>
          </View>
          <View style={[styles.mapLabelContainer, { top: '20%', left: '50%' }]}>
            <Text style={[styles.mapLabel, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>Gandhinagar</Text>
          </View>
          <View style={[styles.mapLabelContainer, { top: '35%', left: '32%' }]}>
            <Text style={[styles.mapLabelSub, { color: isDark ? '#A0AEC0' : '#718096' }]}>Adalaj</Text>
          </View>
          <View style={[styles.mapLabelContainer, { top: '52%', left: '26%' }]}>
            <Text style={[styles.mapLabelMajor, { color: isDark ? '#FFFFFF' : '#1A202C' }]}>Ahmedabad</Text>
          </View>
          <View style={[styles.mapLabelContainer, { top: '65%', left: '8%' }]}>
            <Text style={[styles.mapLabelSub, { color: isDark ? '#A0AEC0' : '#718096' }]}>Sarkhej</Text>
          </View>
          <View style={[styles.mapLabelContainer, { top: '72%', left: '60%' }]}>
            <Text style={[styles.mapLabelSub, { color: isDark ? '#A0AEC0' : '#718096' }]}>Barejadi</Text>
          </View>
          <View style={[styles.mapLabelContainer, { top: '82%', left: '68%' }]}>
            <Text style={[styles.mapLabelSub, { color: isDark ? '#A0AEC0' : '#718096' }]}>Mahemdavad</Text>
          </View>
          <View style={[styles.mapLabelContainer, { top: '90%', left: '60%' }]}>
            <Text style={[styles.mapLabelSub, { color: isDark ? '#A0AEC0' : '#718096' }]}>Kheda</Text>
          </View>

          {/* Map Info watermark */}
          <View style={styles.mapWatermark}>
            <Ionicons name="information-circle" size={14} color={descColor} />
          </View>
        </View>
      </View>
    );
  };

  // Render Posts Archive
  const renderPostsArchive = () => (
    <Animated.View entering={FadeIn} style={styles.emptyContainer}>
      <View style={[styles.clockCircle, { borderColor: labelColor }]}>
        <Feather name="rotate-ccw" size={36} color={labelColor} />
      </View>
      <Text style={[styles.emptyTitle, { color: labelColor }]}>No Archived Posts</Text>
      <Text style={[styles.emptyDesc, { color: descColor }]}>
        When you archive posts, they'll show up here. Only you can see them. Archive posts by tapping on the ⋮ button.
      </Text>
    </Animated.View>
  );

  // Render Live Archive
  const renderLiveArchive = () => (
    <Animated.View entering={FadeIn} style={styles.emptyContainer}>
      <View style={[styles.clockCircle, { borderColor: labelColor }]}>
        <Feather name="rotate-ccw" size={36} color={labelColor} />
      </View>
      <Text style={[styles.emptyTitle, { color: labelColor }]}>No live video archives</Text>
      <Text style={[styles.emptyDesc, { color: descColor }]}>
        Archived videos aren't visible unless you share them. Videos you shared publicly will be used to improve AI at Meta.{' '}
        <Text
          style={{ color: '#0095F6', fontFamily: Fonts.semiBold }}
          onPress={() => showToast({ message: 'Meta AI details', type: 'info' })}
        >
          Learn more
        </Text>
      </Text>
      <Pressable
        onPress={() => { haptics.medium(); showToast({ message: 'Redirecting to archive settings...', type: 'info' }); }}
        style={styles.liveSettingsBtn}
      >
        <Text style={styles.liveSettingsBtnText}>Manage archive settings</Text>
      </Pressable>
    </Animated.View>
  );

  // Render Instants Archive
  const renderInstantsArchive = () => (
    <Animated.View entering={FadeIn} style={styles.emptyContainer}>
      {/* Grid Icon with sparkles */}
      <View style={styles.instantsIconContainer}>
        {/* Sparkle lines around grid */}
        <View style={[styles.sparkle, { backgroundColor: '#FF8A00', top: 12, left: -14, width: 8, height: 2, transform: [{ rotate: '20deg' }] }]} />
        <View style={[styles.sparkle, { backgroundColor: '#FF007A', top: 30, left: -14, width: 8, height: 2, transform: [{ rotate: '-20deg' }] }]} />
        <View style={[styles.sparkle, { backgroundColor: '#FF8A00', top: 12, right: -14, width: 8, height: 2, transform: [{ rotate: '-20deg' }] }]} />
        <View style={[styles.sparkle, { backgroundColor: '#7B00FF', top: 30, right: -14, width: 8, height: 2, transform: [{ rotate: '20deg' }] }]} />
        
        {/* Instants grid icon */}
        <Ionicons name="grid-outline" size={44} color={labelColor} />
      </View>
      
      <Text style={[styles.emptyTitle, { color: labelColor }]}>There's nothing here yet</Text>
      <Text style={[styles.emptyDesc, { color: descColor }]}>
        When you start sending instants, they'll appear here.
      </Text>

      {/* Capture trigger black/white circle action button */}
      <Pressable
        onPress={() => { haptics.medium(); showToast({ message: 'Instant capture active', type: 'success' }); }}
        style={[styles.instantActionBtn, { backgroundColor: isDark ? '#FFFFFF' : '#0F1419' }]}
      >
        <Ionicons name="sparkles-sharp" size={20} color={isDark ? '#000000' : '#FFFFFF'} />
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 6, borderBottomColor: divColor },
        ]}
      >
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color={labelColor} />
        </Pressable>

        <Pressable onPress={() => { haptics.light(); setShowArchivePicker(true); }} style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: labelColor }]}>{archiveType}</Text>
          <Feather name="chevron-down" size={16} color={labelColor} style={styles.headerChevron} />
        </Pressable>

        {archiveType !== 'Instants archive' ? (
          <Pressable onPress={handleMoreOptions} hitSlop={12} style={styles.moreBtn}>
            <Feather name="more-vertical" size={22} color={labelColor} />
          </Pressable>
        ) : (
          <View style={{ width: 34 }} />
        )}
      </View>

      {/* Tab bar (only visible for Stories archive) */}
      {archiveType === 'Stories archive' && (
        <View style={[styles.tabBar, { borderBottomColor: divColor }]}>
          {/* Tab 1: Stories Archive */}
          <Pressable onPress={() => handleTabPress('stories')} style={styles.tabItem}>
            <Feather
              name="rotate-ccw"
              size={22}
              color={activeTab === 'stories' ? labelColor : descColor}
            />
          </Pressable>

          {/* Tab 2: Highlights Archive */}
          <Pressable onPress={() => handleTabPress('highlights')} style={styles.tabItem}>
            <View style={styles.highlightsIconWrapper}>
              <Feather
                name="rotate-ccw"
                size={22}
                color={activeTab === 'highlights' ? labelColor : descColor}
              />
              <Ionicons
                name="heart"
                size={9}
                color={activeTab === 'highlights' ? labelColor : descColor}
                style={styles.heartMini}
              />
            </View>
          </Pressable>

          {/* Tab 3: Calendar */}
          <Pressable onPress={() => handleTabPress('calendar')} style={styles.tabItem}>
            <MaterialIcons
              name="calendar-today"
              size={22}
              color={activeTab === 'calendar' ? labelColor : descColor}
            />
          </Pressable>

          {/* Tab 4: Locations */}
          <Pressable onPress={() => handleTabPress('map')} style={styles.tabItem}>
            <Ionicons
              name="location-outline"
              size={23}
              color={activeTab === 'map' ? labelColor : descColor}
            />
          </Pressable>

          {/* Dynamic sliding bottom indicator */}
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                backgroundColor: tabActiveUnderline,
                width: SCREEN_WIDTH / 4,
              },
              animatedIndicatorStyle,
            ]}
          />
        </View>
      )}

      {/* Main Content Area */}
      {archiveType === 'Stories archive' ? (
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScrollEnd}
          style={styles.contentBody}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {/* Tab 1: Stories */}
          <View style={styles.tabPane}>
            <View style={styles.emptyContainer}>
              <View style={[styles.clockCircle, { borderColor: labelColor }]}>
                <Feather name="rotate-ccw" size={36} color={labelColor} />
              </View>
              <Text style={[styles.emptyTitle, { color: labelColor }]}>Add to your story</Text>
              <Text style={[styles.emptyDesc, { color: descColor }]}>
                Keep your stories in your archive after they disappear, so you can look back on your memories. Only you can see what's in your archive.
              </Text>
            </View>
          </View>

          {/* Tab 2: Highlights */}
          <View style={styles.tabPane}>
            <View style={styles.emptyContainer}>
              <View style={[styles.clockCircle, { borderColor: labelColor }]}>
                <Feather name="rotate-ccw" size={36} color={labelColor} />
              </View>
              <Text style={[styles.emptyTitle, { color: labelColor }]}>No archived highlights</Text>
              <Text style={[styles.emptyDesc, { color: descColor }]}>
                When you archive highlights, they'll show up here. Only you can see them.
              </Text>
            </View>
          </View>

          {/* Tab 3: Calendar */}
          <View style={styles.tabPane}>
            {renderCalendar()}
          </View>

          {/* Tab 4: Locations */}
          <View style={styles.tabPane}>
            {renderMap()}
          </View>
        </Animated.ScrollView>
      ) : (
        <View style={styles.fullscreenPane}>
          {archiveType === 'Posts archive' && renderPostsArchive()}
          {archiveType === 'Live Archive' && renderLiveArchive()}
          {archiveType === 'Instants archive' && renderInstantsArchive()}
        </View>
      )}

      {/* Archive Selection Bottom Sheet */}
      <InstagramBottomSheet
        visible={showArchivePicker}
        onClose={() => setShowArchivePicker(false)}
        title="Choose archive type"
      >
        <View style={[styles.sheetContent, { paddingBottom: insets.bottom + 16 }]}>
          {(['Stories archive', 'Posts archive', 'Live Archive', 'Instants archive'] as ArchiveType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => handleSelectArchiveType(type)}
              style={styles.sheetRow}
            >
              <Text style={[
                styles.sheetRowText,
                {
                  color: labelColor,
                  fontFamily: archiveType === type ? Fonts.semiBold : Fonts.regular,
                }
              ]}>
                {type}
              </Text>
              {archiveType === type && (
                <Ionicons name="checkmark-circle" size={20} color="#3897F0" />
              )}
            </Pressable>
          ))}
        </View>
      </InstagramBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19.5,
    letterSpacing: -0.4,
  },
  headerChevron: {
    marginLeft: 4,
  },
  moreBtn: {
    padding: 6,
  },
  tabBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
  },
  highlightsIconWrapper: {
    position: 'relative',
  },
  heartMini: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  contentBody: {
    flex: 1,
  },
  horizontalScrollContent: {
    width: SCREEN_WIDTH * 4,
  },
  tabPane: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  clockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  // Calendar
  calendarWrapper: {
    padding: 24,
  },
  monthLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekdayText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
    width: (SCREEN_WIDTH - 48) / 7,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellSpacer: {
    width: (SCREEN_WIDTH - 48) / 7,
    height: 40,
  },
  dayCell: {
    width: (SCREEN_WIDTH - 48) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  // Map Mockup
  mapRoot: {
    flex: 1,
  },
  mapBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mapBannerText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 17,
    paddingRight: 20,
  },
  mapBannerClose: {
    position: 'absolute',
    top: 10,
    right: 12,
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  river: {
    position: 'absolute',
  },
  greenPatch: {
    position: 'absolute',
    opacity: 0.8,
  },
  road: {
    position: 'absolute',
  },
  mapLabelContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  mapLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 11.5,
  },
  mapLabelSub: {
    fontFamily: Fonts.regular,
    fontSize: 10.5,
  },
  mapLabelMajor: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
    letterSpacing: -0.2,
  },
  mapWatermark: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    opacity: 0.6,
  },
  // Bottom Sheet
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sheetRowText: {
    fontSize: 16,
  },
  // Multi-type specific styles
  fullscreenPane: {
    flex: 1,
  },
  liveSettingsBtn: {
    backgroundColor: '#3897F0',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveSettingsBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  instantsIconContainer: {
    position: 'relative',
    marginBottom: 24,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    borderRadius: 1,
  },
  instantActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },
});
