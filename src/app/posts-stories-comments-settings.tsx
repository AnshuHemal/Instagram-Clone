import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

export default function PostsStoriesCommentsSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [likes, setLikes] = useState<'off' | 'follow' | 'everyone'>('off');
  const [likeMilestones, setLikeMilestones] = useState<'off' | 'on'>('on');
  const [likesCommentsOnPhotosOfYou, setLikesCommentsOnPhotosOfYou] = useState<'off' | 'follow' | 'everyone'>('off');
  const [photosOfYou, setPhotosOfYou] = useState<'off' | 'follow' | 'everyone'>('off');
  const [comments, setComments] = useState<'off' | 'follow' | 'everyone'>('off');
  const [commentLikesPins, setCommentLikesPins] = useState<'off' | 'on'>('off');
  const [stickerResponses, setStickerResponses] = useState<'off' | 'on'>('on');
  const [commentDailyDigest, setCommentDailyDigest] = useState<'off' | 'follow' | 'everyone'>('everyone');
  const [postsSuggestedForYou, setPostsSuggestedForYou] = useState<'off' | 'on'>('on');
  const [firstPostsStories, setFirstPostsStories] = useState<'off' | 'follow' | 'everyone'>('off');
  const [notes, setNotes] = useState<'off' | 'on'>('on');
  const [storyComments, setStoryComments] = useState<'off' | 'follow' | 'everyone'>('everyone');
  const [addToPostSubmissions, setAddToPostSubmissions] = useState<'off' | 'on'>('on');
  const [addedToPost, setAddedToPost] = useState<'off' | 'on'>('on');
  const [collaborationInvites, setCollaborationInvites] = useState<'off' | 'follow' | 'on'>('on');

  const handleBack = () => {
    router.back();
    haptics.light();
  };

  const handleSystemSettingsPress = () => {
    haptics.light();
    Linking.openSettings().catch((err) => {
      console.error('Failed to open settings:', err);
      showToast({
        message: 'Unable to open system settings',
        type: 'error',
      });
    });
  };

  const divColor = isDark ? '#262626' : '#EFEFEF';
  const descColor = isDark ? '#737373' : '#8E8E8F';
  const labelColor = isDark ? '#FFFFFF' : '#000000';

  const renderRadioOption = (
    label: string,
    value: string,
    currentValue: string,
    onPress: () => void
  ) => {
    const isSelected = currentValue === value;
    return (
      <Pressable onPress={onPress} style={styles.radioRow}>
        <Text style={[styles.radioLabel, { color: labelColor }]}>{label}</Text>
        <View style={[
          styles.radioOuter,
          { borderColor: isSelected ? (isDark ? '#FFFFFF' : '#000000') : '#BDBDBD' }
        ]}>
          {isSelected && (
            <View style={[styles.radioInner, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]} />
          )}
        </View>
      </Pressable>
    );
  };

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
          <Ionicons name="arrow-back" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Posts, stories and comments
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)}>
          {/* Likes */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Likes</Text>
            {renderRadioOption('Off', 'off', likes, () => { haptics.light(); setLikes('off'); })}
            {renderRadioOption('From profiles I follow', 'follow', likes, () => { haptics.light(); setLikes('follow'); })}
            {renderRadioOption('From everyone', 'everyone', likes, () => { haptics.light(); setLikes('everyone'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed liked your photo.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Like milestones */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Like milestones</Text>
            {renderRadioOption('Off', 'off', likeMilestones, () => { haptics.light(); setLikeMilestones('off'); })}
            {renderRadioOption('On', 'on', likeMilestones, () => { haptics.light(); setLikeMilestones('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>Your post has 100 likes.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Likes and comments on photos of you */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Likes and comments on photos of you</Text>
            {renderRadioOption('Off', 'off', likesCommentsOnPhotosOfYou, () => { haptics.light(); setLikesCommentsOnPhotosOfYou('off'); })}
            {renderRadioOption('From profiles I follow', 'follow', likesCommentsOnPhotosOfYou, () => { haptics.light(); setLikesCommentsOnPhotosOfYou('follow'); })}
            {renderRadioOption('From everyone', 'everyone', likesCommentsOnPhotosOfYou, () => { haptics.light(); setLikesCommentsOnPhotosOfYou('everyone'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed commented on a post you're tagged in.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Photos of you */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Photos of you</Text>
            {renderRadioOption('Off', 'off', photosOfYou, () => { haptics.light(); setPhotosOfYou('off'); })}
            {renderRadioOption('From profiles I follow', 'follow', photosOfYou, () => { haptics.light(); setPhotosOfYou('follow'); })}
            {renderRadioOption('From everyone', 'everyone', photosOfYou, () => { haptics.light(); setPhotosOfYou('everyone'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed tagged you in a photo.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Comments */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Comments</Text>
            {renderRadioOption('Off', 'off', comments, () => { haptics.light(); setComments('off'); })}
            {renderRadioOption('From profiles I follow', 'follow', comments, () => { haptics.light(); setComments('follow'); })}
            {renderRadioOption('From everyone', 'everyone', comments, () => { haptics.light(); setComments('everyone'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed commented: "Nice shot!"</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Comment likes and pins */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Comment likes and pins</Text>
            {renderRadioOption('Off', 'off', commentLikesPins, () => { haptics.light(); setCommentLikesPins('off'); })}
            {renderRadioOption('On', 'on', commentLikesPins, () => { haptics.light(); setCommentLikesPins('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed liked your comment: "Nice shot!" and other similar notifications.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Sticker responses */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Sticker responses</Text>
            {renderRadioOption('Off', 'off', stickerResponses, () => { haptics.light(); setStickerResponses('off'); })}
            {renderRadioOption('On', 'on', stickerResponses, () => { haptics.light(); setStickerResponses('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>You have new responses to your poll sticker.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Comment daily digest */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Comment daily digest</Text>
            {renderRadioOption('Off', 'off', commentDailyDigest, () => { haptics.light(); setCommentDailyDigest('off'); })}
            {renderRadioOption('From profiles I follow', 'follow', commentDailyDigest, () => { haptics.light(); setCommentDailyDigest('follow'); })}
            {renderRadioOption('From everyone', 'everyone', commentDailyDigest, () => { haptics.light(); setCommentDailyDigest('everyone'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed recently commented on this post: Nice shot!</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Posts suggested for you */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Posts suggested for you</Text>
            {renderRadioOption('Off', 'off', postsSuggestedForYou, () => { haptics.light(); setPostsSuggestedForYou('off'); })}
            {renderRadioOption('On', 'on', postsSuggestedForYou, () => { haptics.light(); setPostsSuggestedForYou('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed shared a post you might like.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* First posts and stories */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>First posts and stories</Text>
            {renderRadioOption('Off', 'off', firstPostsStories, () => { haptics.light(); setFirstPostsStories('off'); })}
            {renderRadioOption('From profiles I follow', 'follow', firstPostsStories, () => { haptics.light(); setFirstPostsStories('follow'); })}
            {renderRadioOption('From everyone', 'everyone', firstPostsStories, () => { haptics.light(); setFirstPostsStories('everyone'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>See johnappleseed's first story on Instagram, and other similar notifications.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Notes */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Notes</Text>
            {renderRadioOption('Off', 'off', notes, () => { haptics.light(); setNotes('off'); })}
            {renderRadioOption('On', 'on', notes, () => { haptics.light(); setNotes('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed, janeappleseed and 3 others shared notes.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Story Comments */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Story Comments</Text>
            {renderRadioOption('Off', 'off', storyComments, () => { haptics.light(); setStoryComments('off'); })}
            {renderRadioOption('From profiles I follow', 'follow', storyComments, () => { haptics.light(); setStoryComments('follow'); })}
            {renderRadioOption('From everyone', 'everyone', storyComments, () => { haptics.light(); setStoryComments('everyone'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed commented: Nice shot!</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Add to post submissions */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Add to post submissions</Text>
            {renderRadioOption('Off', 'off', addToPostSubmissions, () => { haptics.light(); setAddToPostSubmissions('off'); })}
            {renderRadioOption('On', 'on', addToPostSubmissions, () => { haptics.light(); setAddToPostSubmissions('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed and 3 others want to add to your post. Review their submissions.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Added to post */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Added to post</Text>
            {renderRadioOption('Off', 'off', addedToPost, () => { haptics.light(); setAddedToPost('off'); })}
            {renderRadioOption('On', 'on', addedToPost, () => { haptics.light(); setAddedToPost('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed added your photo to their post.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Collaboration invites */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: labelColor }]}>Collaboration invites</Text>
            {renderRadioOption('Off', 'off', collaborationInvites, () => { haptics.light(); setCollaborationInvites('off'); })}
            {renderRadioOption('From profiles I follow', 'follow', collaborationInvites, () => { haptics.light(); setCollaborationInvites('follow'); })}
            {renderRadioOption('On', 'on', collaborationInvites, () => { haptics.light(); setCollaborationInvites('on'); })}
            <Text style={[styles.sectionDesc, { color: descColor }]}>johnappleseed invited you to collaborate on a post.</Text>
            <View style={[styles.divider, { backgroundColor: divColor }]} />
          </View>

          {/* Additional Options */}
          <Pressable
            onPress={handleSystemSettingsPress}
            style={styles.systemSettingsRow}
          >
            <Text style={[styles.systemSettingsText, { color: '#3897F0' }]}>
              Additional options in system settings...
            </Text>
            <Text style={[styles.systemSettingsDesc, { color: descColor }]}>
              These settings affect any Instagram accounts logged into this device
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
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
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    letterSpacing: -0.4,
    textAlign: 'center',
    flex: 1,
    paddingLeft: 0,
  },
  scroll: {
    paddingTop: 16,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16.5,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  radioLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 18.5,
    marginTop: 6,
    marginBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 4,
  },
  systemSettingsRow: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  systemSettingsText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    marginBottom: 8,
  },
  systemSettingsDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
