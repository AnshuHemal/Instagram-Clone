import React, { useState } from 'react';
import { StyleSheet, View, FlatList, TextInput, Pressable, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { MOCK_CHATS, MOCK_STORIES } from '@/constants/mockData';

export default function InboxScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');

  const filteredChats = MOCK_CHATS.filter((chat) =>
    chat.user.name.toLowerCase().includes(search.toLowerCase()) ||
    chat.user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.headerTitle} type="subtitle">
          Messages
        </ThemedText>
        <Pressable style={styles.headerButton}>
          <Feather name="edit" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#121212' : '#F0F0F0' }]}>
          <Ionicons name="search-outline" size={18} color={isDark ? '#8E8E8F' : '#8E8E8F'} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={isDark ? '#8E8E8F' : '#8E8E8F'}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      {/* Active Users Horizontal Scroll */}
      <View style={styles.activeUsersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeUsersList}>
          {MOCK_STORIES.map((story) => (
            <View key={story.id} style={styles.activeUserContainer}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: story.avatar }} style={styles.activeAvatar} />
                <View style={[styles.onlineDot, { borderColor: colors.background }]} />
              </View>
              <ThemedText type="small" numberOfLines={1} style={[styles.activeUsername, { color: colors.textSecondary }]}>
                {story.username}
              </ThemedText>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/(chat)/[id]', params: { id: item.id } })}
            style={({ pressed }) => [
              styles.chatItem,
              pressed && { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
            ]}
          >
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: item.user.avatar }} style={styles.chatAvatar} />
              {item.user.isOnline && <View style={[styles.onlineDot, { borderColor: colors.background }]} />}
            </View>
            <View style={styles.chatDetails}>
              <ThemedText type="smallBold" style={{ color: colors.text }}>
                {item.user.name}
              </ThemedText>
              <ThemedText
                type="small"
                numberOfLines={1}
                style={[
                  styles.lastMessageText,
                  { color: item.unreadCount > 0 ? colors.text : colors.textSecondary },
                  item.unreadCount > 0 && { fontWeight: 'bold' },
                ]}
              >
                {item.lastMessage}
              </ThemedText>
            </View>
            <View style={styles.chatMeta}>
              <ThemedText type="small" style={[styles.metaTime, { color: colors.textSecondary }]}>
                {item.lastMessageTime}
              </ThemedText>
              {item.unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <ThemedText type="smallBold" style={styles.unreadText}>
                    {item.unreadCount}
                  </ThemedText>
                </View>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={{ color: colors.textSecondary }}>No messages found.</ThemedText>
          </View>
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
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  activeUsersSection: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
  },
  activeUsersList: {
    paddingHorizontal: 15,
    gap: 15,
  },
  activeUserContainer: {
    alignItems: 'center',
    width: 65,
  },
  avatarWrapper: {
    position: 'relative',
  },
  activeAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CD964',
    borderWidth: 2,
  },
  activeUsername: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  chatAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  chatDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  lastMessageText: {
    marginTop: 3,
  },
  chatMeta: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  metaTime: {
    fontSize: 12,
    marginBottom: 5,
  },
  unreadBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});
