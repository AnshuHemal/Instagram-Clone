import React, { useState } from 'react';
import { StyleSheet, View, Image, Pressable, ScrollView, FlatList, TextInput, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { MOCK_POSTS } from '@/constants/mockData';

const { width } = Dimensions.get('window');
const GRID_SIZE = width / 3;

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, theme, toggleTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  
  // Tabs: 'posts' | 'saved'
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  
  // Edit Profile Modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');

  // Filter posts
  const userPosts = MOCK_POSTS.filter((post) => post.user.username === user?.username);
  const savedPosts = MOCK_POSTS.filter((post) => post.isBookmarked);

  const handleEditProfileSave = () => {
    updateProfile(editName, editBio, '');
    setIsEditModalVisible(false);
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  if (!user) {
    return null;
  }

  const postsToRender = activeTab === 'posts' ? userPosts : savedPosts;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Profile Header Settings Bar */}
      <View style={styles.topSettingsBar}>
        <ThemedText type="subtitle" style={styles.usernameTitle}>
          {user.username}
        </ThemedText>
        <View style={styles.settingsIcons}>
          <Pressable onPress={toggleTheme} style={styles.iconButton}>
            <Ionicons
              name={theme === 'dark' ? 'sunny' : 'moon'}
              size={22}
              color={colors.text}
            />
          </Pressable>
          <Pressable onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={24} color="#FF3040" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Stats Block */}
        <View style={styles.profileInfoContainer}>
          <Image source={{ uri: user.avatar }} style={styles.profileAvatar} />
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <ThemedText type="subtitle" style={styles.statCount}>
                {userPosts.length}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.textSecondary }]}>
                Posts
              </ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText type="subtitle" style={styles.statCount}>
                {user.followersCount.toLocaleString()}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.textSecondary }]}>
                Followers
              </ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText type="subtitle" style={styles.statCount}>
                {user.followingCount.toLocaleString()}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.textSecondary }]}>
                Following
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioContainer}>
          <ThemedText type="smallBold" style={{ color: colors.text }}>
            {user.name}
          </ThemedText>
          <ThemedText type="small" style={[styles.bioText, { color: colors.text }]}>
            {user.bio}
          </ThemedText>
        </View>

        {/* Edit Profile Button */}
        <View style={styles.actionButtonsContainer}>
          <Pressable
            onPress={() => setIsEditModalVisible(true)}
            style={[styles.profileButton, { backgroundColor: theme === 'dark' ? '#262626' : '#EFEFEF' }]}
          >
            <ThemedText type="smallBold" style={{ color: colors.text }}>
              Edit Profile
            </ThemedText>
          </Pressable>
        </View>

        {/* Tabs Selection */}
        <View style={[styles.tabsBar, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => setActiveTab('posts')}
            style={[styles.tabButton, activeTab === 'posts' && { borderBottomColor: colors.text, borderBottomWidth: 1.5 }]}
          >
            <Ionicons
              name="grid-outline"
              size={22}
              color={activeTab === 'posts' ? colors.text : colors.tabBarInactive}
            />
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('saved')}
            style={[styles.tabButton, activeTab === 'saved' && { borderBottomColor: colors.text, borderBottomWidth: 1.5 }]}
          >
            <Ionicons
              name="bookmark-outline"
              size={22}
              color={activeTab === 'saved' ? colors.text : colors.tabBarInactive}
            />
          </Pressable>
        </View>

        {/* Grid Posts */}
        <View style={styles.gridContainer}>
          {postsToRender.map((post) => (
            <Pressable key={post.id} style={[styles.gridItem, { width: GRID_SIZE, height: GRID_SIZE }]}>
              <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
            </Pressable>
          ))}
          {postsToRender.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'posts' ? 'camera-outline' : 'bookmark-outline'}
                size={48}
                color={colors.textSecondary}
              />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeTab === 'posts' ? 'No posts yet.' : 'No saved posts.'}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setIsEditModalVisible(false)} style={styles.modalHeaderButton}>
                <ThemedText type="small">Cancel</ThemedText>
              </Pressable>
              <ThemedText style={styles.modalTitle} type="smallBold">
                Edit Profile
              </ThemedText>
              <Pressable onPress={handleEditProfileSave} style={styles.modalHeaderButton}>
                <ThemedText type="smallBold" style={{ color: colors.primary }}>
                  Done
                </ThemedText>
              </Pressable>
            </View>

            {/* Modal Inputs */}
            <View style={styles.modalInputsContainer}>
              <View style={[styles.inputGroup, { borderBottomColor: colors.border }]}>
                <ThemedText type="small" style={styles.inputLabel}>
                  Name
                </ThemedText>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Name"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.textInput, { color: colors.text }]}
                />
              </View>

              <View style={[styles.inputGroup, { borderBottomColor: colors.border }]}>
                <ThemedText type="small" style={styles.inputLabel}>
                  Bio
                </ThemedText>
                <TextInput
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Bio"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  style={[styles.textInput, { color: colors.text, height: 60 }]}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSettingsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 50,
  },
  usernameTitle: {
    fontWeight: 'bold',
  },
  settingsIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 5,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  profileAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statCount: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  bioContainer: {
    paddingHorizontal: 15,
    marginTop: 5,
    gap: 4,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionButtonsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  profileButton: {
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  tabsBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    height: 48,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  gridItem: {
    padding: 0.5,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '40%',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 54,
    borderBottomWidth: 0.5,
  },
  modalHeaderButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 16,
  },
  modalInputsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 15,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  inputLabel: {
    width: 60,
    fontWeight: '500',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
});
