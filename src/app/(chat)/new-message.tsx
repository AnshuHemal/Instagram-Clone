import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

interface UserSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

const FALLBACK_SUGGESTED: UserSuggestion[] = [
  {
    id: 'user-harsh',
    username: 'harssh_456',
    displayName: 'Harsh',
    avatarUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150',
  },
  {
    id: 'user-himanshi',
    username: '_himanshi_dudani_',
    displayName: '',
    avatarUrl: '',
  }
];

export default function NewMessageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>(FALLBACK_SUGGESTED);
  const [filteredSuggestions, setFilteredSuggestions] = useState<UserSuggestion[]>(FALLBACK_SUGGESTED);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users/suggestions');
      if (res.data && res.data.data && res.data.data.length > 0) {
        // Merge fallback items with remote items to ensure Harsh and himanshi are always there
        const remote = res.data.data;
        const merged = [...FALLBACK_SUGGESTED];
        remote.forEach((u: any) => {
          if (!merged.find(m => m.username === u.username)) {
            merged.push({
              id: u.id,
              username: u.username,
              displayName: u.displayName || '',
              avatarUrl: u.avatarUrl || u.avatar || '',
            });
          }
        });
        setSuggestions(merged);
        setFilteredSuggestions(merged);
      } else {
        setSuggestions(FALLBACK_SUGGESTED);
        setFilteredSuggestions(FALLBACK_SUGGESTED);
      }
    } catch (err) {
      console.warn('Failed to load suggestions:', err);
      setSuggestions(FALLBACK_SUGGESTED);
      setFilteredSuggestions(FALLBACK_SUGGESTED);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredSuggestions(suggestions);
    } else {
      const query = search.toLowerCase();
      // Search remote endpoint if they type a search string
      const searchRemote = async () => {
        try {
          const res = await api.get('/auth/users/search', { params: { q: query } });
          if (res.data && res.data.data) {
            const results = res.data.data.map((u: any) => ({
              id: u.id,
              username: u.username,
              displayName: u.displayName || '',
              avatarUrl: u.avatarUrl || u.avatar || '',
            }));
            // Merge with local suggestions matching query
            const localMatches = suggestions.filter(
              (u) =>
                u.username.toLowerCase().includes(query) ||
                u.displayName.toLowerCase().includes(query)
            );
            const combined = [...localMatches];
            results.forEach((u: any) => {
              if (!combined.find(c => c.username === u.username)) {
                combined.push(u);
              }
            });
            setFilteredSuggestions(combined);
          }
        } catch {
          // Local filter fallback
          setFilteredSuggestions(
            suggestions.filter(
              (u) =>
                u.username.toLowerCase().includes(query) ||
                u.displayName.toLowerCase().includes(query)
            )
          );
        }
      };
      const delaySearch = setTimeout(searchRemote, 200);
      return () => clearTimeout(delaySearch);
    }
  }, [search, suggestions]);

  const handleSelectUser = async (userId: string) => {
    if (isSaving) return;
    haptics.light();
    setIsSaving(userId);
    try {
      const res = await api.post('/chat/conversations', { partnerId: userId });
      if (res.data && res.data.data && res.data.data.id) {
        // Slide out from the right by pushing the chat screen, but replace to clear stack
        router.replace({ pathname: '/(chat)/[id]', params: { id: res.data.data.id } } as any);
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setIsSaving(null);
    }
  };

  const handleRemoveSuggestion = (id: string) => {
    haptics.selection();
    setSuggestions(prev => prev.filter(u => u.id !== id));
    setFilteredSuggestions(prev => prev.filter(u => u.id !== id));
  };

  const renderSuggestedItem = ({ item, index }: { item: UserSuggestion; index: number }) => {
    return (
      <Animated.View
        entering={FadeInDown.duration(200).delay(index * 40)}
        layout={Layout.springify()}
      >
        <Pressable
          style={({ pressed }) => [
            styles.userRow,
            pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
          ]}
          onPress={() => handleSelectUser(item.id)}
        >
          <View style={styles.avatarContainer}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#262626' : '#EFEFEF' }]}>
                <Ionicons name="person" size={28} color={isDark ? '#8E8E8F' : '#8E8E8F'} />
              </View>
            )}
          </View>

          <View style={styles.userDetails}>
            <Text style={[styles.usernameText, { color: colors.text }]}>{item.username}</Text>
            {item.displayName ? (
              <Text style={[styles.displayNameText, { color: colors.textSecondary }]}>
                {item.displayName}
              </Text>
            ) : null}
          </View>

          {isSaving === item.id ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.actionIcon} />
          ) : (
            <Pressable
              onPress={() => handleRemoveSuggestion(item.id)}
              style={styles.actionIcon}
              hitSlop={12}
            >
              <Ionicons name="close" size={20} color={isDark ? '#8E8E8F' : '#8E8E8F'} />
            </Pressable>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 48 + insets.top }]}>
        <Pressable onPress={() => { haptics.light(); router.back(); }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New message</Text>
      </View>

      {/* "To" Search bar row */}
      <View style={[styles.searchRow, { borderBottomColor: isDark ? '#262626' : '#EFEFEF' }]}>
        <Text style={[styles.toLabel, { color: colors.text }]}>To:</Text>
        <TextInput
          placeholder="Search"
          placeholderTextColor={isDark ? '#8E8E8F' : '#8E8E8F'}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: colors.text }]}
          autoFocus={true}
        />
      </View>

      {/* Main List */}
      <FlatList
        data={filteredSuggestions}
        keyExtractor={(item) => item.id}
        renderItem={renderSuggestedItem}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {/* Group Chat option */}
            <Pressable
              style={({ pressed }) => [
                styles.groupRow,
                pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
              ]}
              onPress={() => { haptics.light(); router.push('/group-chat-add'); }}
            >
              <View style={[styles.groupIconContainer, { backgroundColor: isDark ? '#262626' : '#F2F2F7' }]}>
                <Ionicons name="people-outline" size={24} color={colors.text} />
              </View>
              <Text style={[styles.groupChatText, { color: colors.text }]}>Group chat</Text>
            </Pressable>

            {/* Suggested Section Header */}
            {filteredSuggestions.length > 0 ? (
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No accounts found
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 0.5,
  },
  toLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginRight: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    paddingVertical: 8,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupChatText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginLeft: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  usernameText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  displayNameText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    marginTop: 2,
  },
  actionIcon: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: Fonts.regular,
    fontSize: 15,
    marginTop: 40,
  },
});
