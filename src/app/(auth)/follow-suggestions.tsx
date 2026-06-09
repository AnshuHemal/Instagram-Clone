import React, { useState, useCallback } from 'react';
import { StyleSheet, Pressable, View, Text, TextInput, FlatList, Image, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';

interface SuggestionUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  verified: boolean;
  checked: boolean;
}

const MOCK_SUGGESTIONS: SuggestionUser[] = [
  {
    id: '1',
    username: 'mohammedsirajofficial',
    displayName: 'Mohammed Siraj',
    avatarUrl: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150',
    verified: true,
    checked: true,
  },
  {
    id: '2',
    username: 'abdevilliers17',
    displayName: 'AB de Villiers',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    verified: true,
    checked: true,
  },
  {
    id: '3',
    username: 'voompla',
    displayName: 'Voompla',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    verified: true,
    checked: true,
  },
  {
    id: '4',
    username: 'dishapatani',
    displayName: 'disha patani (paatni) 🦋',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    verified: true,
    checked: true,
  },
  {
    id: '5',
    username: 'saratendulkar',
    displayName: 'Sara Tendulkar',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    verified: true,
    checked: true,
  },
  {
    id: '6',
    username: 'therock',
    displayName: 'Dwayne Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    verified: true,
    checked: false,
  },
  {
    id: '7',
    username: 'maisamayhoon',
    displayName: 'Samay Raina',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    verified: true,
    checked: false,
  },
  {
    id: '8',
    username: 'vaibhav_sooryavanshi09',
    displayName: 'Vaibhav Sooryavanshi',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    verified: true,
    checked: false,
  },
  {
    id: '9',
    username: 'virat.kohli',
    displayName: 'Virat Kohli',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    verified: true,
    checked: false,
  },
  {
    id: '10',
    username: 'cristiano',
    displayName: 'Cristiano Ronaldo',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    verified: true,
    checked: false,
  },
];

export default function FollowSuggestionsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [suggestions, setSuggestions] = useState<SuggestionUser[]>(MOCK_SUGGESTIONS);
  const [searchQuery, setSearchQuery] = useState('');

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
    router.replace('/(tabs)');
  };

  const handleFollow = () => {
    // Navigate home after complete onboarding
    router.replace('/(tabs)');
  };

  const toggleCheck = (id: string) => {
    setSuggestions(prev => 
      prev.map(user => 
        user.id === id ? { ...user, checked: !user.checked } : user
      )
    );
  };

  const filteredSuggestions = suggestions.filter(user => 
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: SuggestionUser }) => {
    return (
      <Pressable style={styles.userRow} onPress={() => toggleCheck(item.id)}>
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        
        <View style={styles.userDetails}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>
              {item.displayName}
            </Text>
            {item.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#0095F6" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={[styles.username, { color: isDark ? '#8E8E93' : '#737373' }]} numberOfLines={1}>
            {item.username}
          </Text>
        </View>

        <View 
          style={[
            styles.checkbox, 
            { 
              borderColor: isDark ? '#555555' : '#CCCCCC',
              backgroundColor: item.checked 
                ? (isDark ? '#FFFFFF' : '#000000') 
                : 'transparent'
            }
          ]}
        >
          {item.checked && (
            <Ionicons name="checkmark" size={15} color={isDark ? '#000000' : '#FFFFFF'} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]} edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Header bar */}
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Try following 5+ people
        </Text>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>Skip</Text>
        </Pressable>
      </View>

      {/* Main content body */}
      <View style={styles.innerContainer}>
        <Animated.View entering={FadeInRight.duration(300)}>
          <Text style={[styles.subtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
            Following isn't required, but it's recommended for a personalized experience.
          </Text>
        </Animated.View>

        {/* Search bar */}
        <Animated.View entering={FadeInRight.delay(100).duration(300)}>
          <View style={[styles.searchBar, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
            <Ionicons name="search" size={16} color={isDark ? '#8E8E93' : '#737373'} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
              placeholder="Search"
              placeholderTextColor={isDark ? '#8E8E93' : '#737373'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={isDark ? '#8E8E93' : '#737373'} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Accounts List */}
        <FlatList
          data={filteredSuggestions}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Bottom Follow Button */}
      <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.bottomArea}>
        <Pressable
          style={styles.followButton}
          onPress={handleFollow}
        >
          <Text style={styles.followButtonText}>Follow</Text>
        </Pressable>
      </Animated.View>
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
  headerTitle: {
    fontSize: 19.5,
    fontFamily: Fonts.bold,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: 50,
    alignItems: 'flex-end',
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: 18,
  },
  subtitle: {
    fontSize: 14.5,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: Fonts.regular,
    padding: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    maxWidth: '85%',
  },
  username: {
    fontSize: 14.5,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 12 : 24,
    paddingTop: 10,
  },
  followButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 15.5,
  },
});
