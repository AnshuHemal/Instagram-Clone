import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Pressable, View, Text, TextInput, FlatList, Image, Platform, BackHandler, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface SuggestionUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  verified: boolean;
  checked: boolean;
}


export default function FollowSuggestionsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, updateProfile } = useAuth();

  const [suggestions, setSuggestions] = useState<SuggestionUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/users/suggestions');
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map((u: any) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          verified: u.verified || false,
          checked: u.checked || false,
        }));
        setSuggestions(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch real suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleSkip = async () => {
    try {
      if (user) {
        await updateProfile(user.name, user.bio, user.avatar, true, 'COMPLETED');
      }
    } catch (e) {
      console.warn('Failed to save onboarding completion state:', e);
    }
    router.replace('/(tabs)');
  };

  const handleFollow = async () => {
    const followingIds = suggestions.filter(u => u.checked).map(u => u.id);
    
    try {
      setIsLoading(true);
      if (followingIds.length > 0) {
        await api.post('/auth/users/follow-multiple', { followingIds });
      }
      
      if (user) {
        await updateProfile(user.name, user.bio, user.avatar, true, 'COMPLETED');
      }
    } catch (err) {
      console.error('Failed to complete follow onboarding step:', err);
    } finally {
      setIsLoading(false);
    }

    // Navigate home after completing onboarding
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
        <View style={{ width: 60 }} />
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>
          Try following 5+ people
        </Text>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>Skip</Text>
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
        {isLoading && suggestions.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0095F6" />
          </View>
        ) : suggestions.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
            <Ionicons name="people-outline" size={48} color={isDark ? '#555555' : '#CCCCCC'} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontFamily: Fonts.bold, color: isDark ? '#FFFFFF' : '#000000', textAlign: 'center', marginBottom: 6 }}>
              No Suggestions Found
            </Text>
            <Text style={{ fontSize: 14, fontFamily: Fonts.regular, color: isDark ? '#A8A8A8' : '#737373', textAlign: 'center' }}>
              Check back later for new accounts to follow.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSuggestions}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Bottom Follow Button */}
      <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.bottomArea}>
        <Pressable
          style={[styles.followButton, isLoading && { opacity: 0.7 }]}
          disabled={isLoading}
          onPress={handleFollow}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.followButtonText}>Follow</Text>
          )}
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
    flex: 1,
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: 60,
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
