import { Tabs, useSegments, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, Pressable, View, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// Tactile spring micro-animation for tab bar buttons
const TabBarButton = (props: any) => {
  const { ref, onPress, accessibilityState, children, style } = props;
  const isSelected = accessibilityState?.selected;
  
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 0.85,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  return (
    <Pressable
      onPress={onPress}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }], flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function TabLayout() {
  const { colors } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];

  // Determine if Reels is the currently active tab
  const isReelsActive = segments.includes('reels');

  // Animated background & border transitions
  const animValue = useRef(new Animated.Value(isReelsActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isReelsActive ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isReelsActive]);

  const animatedBg = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.tabBarBackground, '#000000'],
  });

  const animatedBorder = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, 'rgba(255, 255, 255, 0.12)'],
  });

  const activeColor = isReelsActive ? '#FFFFFF' : colors.tabBarActive;
  const inactiveColor = isReelsActive ? 'rgba(255, 255, 255, 0.4)' : colors.tabBarInactive;
  const tabBgColor = isReelsActive ? '#000000' : colors.tabBarBackground;

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  if (isLoading || !user) {
    return null;
  }

  // Calculate dynamic tab bar height based on Android/iOS bottom safe areas
  const paddingBottom = insets.bottom > 0 ? insets.bottom : 8;
  const tabHeight = Platform.OS === 'ios' 
    ? 50 + insets.bottom 
    : 60 + (insets.bottom > 0 ? insets.bottom - 5 : 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0, // Rendered smoothly via tabBarBackground instead
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 8,
          position: isReelsActive ? 'absolute' : 'relative',
        },
        tabBarBackground: () => (
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: animatedBg,
              borderTopWidth: 0.5,
              borderTopColor: animatedBorder,
            }}
          />
        ),
        tabBarShowLabel: false,
        headerShown: false,
        tabBarButton: (props) => <TabBarButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused 
                ? require('@/assets/images/tabIcons/home_filled.svg') 
                : require('@/assets/images/tabIcons/home_outline.svg')
              }
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? activeColor : inactiveColor,
              }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: 'Reels',
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused 
                ? require('@/assets/images/tabIcons/reels_filled.png') 
                : require('@/assets/images/tabIcons/reels_outline.png')
              }
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? activeColor : inactiveColor,
              }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={focused 
                  ? require('@/assets/images/tabIcons/messenger_filled.png') 
                  : require('@/assets/images/tabIcons/messenger_outline.png')
                }
                style={{
                  width: 24,
                  height: 24,
                  tintColor: focused ? activeColor : inactiveColor,
                }}
                contentFit="contain"
              />
              <View style={{
                position: 'absolute',
                bottom: 1,
                right: 1,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#FF3040',
                borderWidth: 1.5,
                borderColor: tabBgColor,
              }} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24}
              color={focused ? activeColor : inactiveColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={{ uri: user.avatar }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: focused ? 1.5 : 0,
                  borderColor: activeColor,
                }}
                contentFit="cover"
              />
              <View style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#FF3040',
                borderWidth: 1.5,
                borderColor: tabBgColor,
              }} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
