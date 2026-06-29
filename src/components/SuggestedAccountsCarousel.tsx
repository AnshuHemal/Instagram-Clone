import React, { useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Text,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInRight,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface SuggestedUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isFollowing?: boolean;
  mutualFollowers?: number;
}

interface SuggestedUserCardProps {
  user: SuggestedUser;
  index: number;
  onFollow: (id: string) => void;
  onDismiss: (id: string) => void;
}

const SuggestedUserCard: React.FC<SuggestedUserCardProps> = ({
  user,
  index,
  onFollow,
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const followScale = useSharedValue(1);

  const followAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: followScale.value }],
  }));

  const handleFollowPress = () => {
    followScale.value = withSpring(0.92, { damping: 12 }, () => {
      followScale.value = withSpring(1, { damping: 12 });
    });
    haptics.light();
    onFollow(user.id);
  };

  const isFollowing = user.isFollowing;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 80).duration(350).springify()}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
        },
      ]}
    >
      {/* Dismiss button */}
      <Pressable
        onPress={() => { haptics.light(); onDismiss(user.id); }}
        style={styles.dismissBtn}
        hitSlop={8}
      >
        <Ionicons name="close" size={14} color={colors.textSecondary} />
      </Pressable>

      {/* Avatar */}
      <Pressable onPress={() => router.push({ pathname: '/profile', params: { userId: user.id } })}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&size=100&bold=true` }}
            style={styles.avatar}
            contentFit="cover"
          />
          {user.isVerified && (
            <Animated.View entering={ZoomIn.delay(index * 80 + 200)} style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#0095F6" />
            </Animated.View>
          )}
        </View>
      </Pressable>

      {/* Username */}
      <Pressable onPress={() => router.push({ pathname: '/profile', params: { userId: user.id } })}>
        <Text numberOfLines={1} style={[styles.username, { color: colors.text, fontFamily: Fonts.semiBold }]}>
          {user.username}
        </Text>
      </Pressable>

      {/* Display name / mutual followers */}
      {user.mutualFollowers && user.mutualFollowers > 0 ? (
        <Text numberOfLines={1} style={[styles.mutualText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
          {user.mutualFollowers} mutual follower{user.mutualFollowers > 1 ? 's' : ''}
        </Text>
      ) : (
        <Text numberOfLines={1} style={[styles.mutualText, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
          {user.displayName || 'Suggested for you'}
        </Text>
      )}

      {/* Follow button */}
      <Animated.View style={[followAnimStyle, { marginTop: 12, width: '100%' }]}>
        <Pressable
          onPress={handleFollowPress}
          style={[
            styles.followBtn,
            isFollowing
              ? {
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: isDark ? '#555' : '#DBDBDB',
                }
              : { backgroundColor: '#0095F6' },
          ]}
        >
          <Text
            style={[
              styles.followBtnText,
              { color: isFollowing ? colors.text : '#FFFFFF', fontFamily: Fonts.semiBold },
            ]}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

interface SuggestedAccountsCarouselProps {
  suggestions: SuggestedUser[];
  onFollow: (id: string) => void;
  onDismiss: (id: string) => void;
  onSeeAll: () => void;
}

export const SuggestedAccountsCarousel: React.FC<SuggestedAccountsCarouselProps> = React.memo(({
  suggestions,
  onFollow,
  onDismiss,
  onSeeAll,
}) => {
  const { colors, isDark } = useTheme();

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={18} color="#0095F6" style={{ marginRight: 6 }} />
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.semiBold }]}>
            Suggested for you
          </Text>
        </View>
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={[styles.seeAllText, { fontFamily: Fonts.semiBold }]}>See all</Text>
        </Pressable>
      </View>

      {/* Cards Carousel */}
      <FlatList
        horizontal
        data={suggestions}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <SuggestedUserCard
            user={item}
            index={index}
            onFollow={onFollow}
            onDismiss={onDismiss}
          />
        )}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
  },
  seeAllText: {
    fontSize: 13,
    color: '#0095F6',
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 10,
  },
  card: {
    width: 148,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dismissBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(128,128,128,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#222',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  username: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 120,
  },
  mutualText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 3,
    maxWidth: 120,
  },
  followBtn: {
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  followBtnText: {
    fontSize: 13,
  },
});
