import React, { useState, useEffect, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { followService } from '@/services/follow';
import { useTheme } from '@/contexts/ThemeContext';

type FollowButtonProps = {
  targetUserId: string;
  initialIsFollowing?: boolean;
  initialIsRequested?: boolean;
  isPrivate?: boolean;
  onFollowChange?: (status: 'following' | 'requested' | 'not_following', followersCount?: number) => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined' | 'icon';
  showIcon?: boolean;
  fullWidth?: boolean;
};

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  initialIsFollowing = false,
  initialIsRequested = false,
  isPrivate = false,
  onFollowChange,
  size = 'medium',
  variant = 'filled',
  showIcon = false,
  fullWidth = false,
}) => {
  const { colors, isDark } = useTheme();
  const [status, setStatus] = useState<'following' | 'requested' | 'not_following'>(() => {
    if (initialIsFollowing) return 'following';
    if (initialIsRequested) return 'requested';
    return 'not_following';
  });
  const scale = useSharedValue(1);

  useEffect(() => {
    if (initialIsFollowing) {
      setStatus('following');
    } else if (initialIsRequested) {
      setStatus('requested');
    } else {
      setStatus('not_following');
    }
  }, [initialIsFollowing, initialIsRequested]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(async () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    });

    const previousStatus = status;

    if (status === 'following') {
      // Optimistic update
      setStatus('not_following');
      try {
        const result = await followService.unfollowUser(targetUserId);
        if (result.success) {
          onFollowChange?.('not_following', result.followersCount);
        } else {
          setStatus(previousStatus);
        }
      } catch (err) {
        setStatus(previousStatus);
        console.error('Unfollow error:', err);
      }
    } else if (status === 'requested') {
      // Optimistic update
      setStatus('not_following');
      try {
        const result = await followService.cancelFollowRequest(targetUserId);
        if (result.success) {
          onFollowChange?.('not_following');
        } else {
          setStatus(previousStatus);
        }
      } catch (err) {
        setStatus(previousStatus);
        console.error('Cancel request error:', err);
      }
    } else {
      // Optimistic update
      const targetStatus = isPrivate ? 'requested' : 'following';
      setStatus(targetStatus);
      try {
        const result = await followService.followUser(targetUserId);
        if (result.success) {
          const finalStatus = result.requested ? 'requested' : 'following';
          setStatus(finalStatus);
          onFollowChange?.(finalStatus, result.followersCount);
        } else {
          setStatus(previousStatus);
        }
      } catch (err) {
        setStatus(previousStatus);
        console.error('Follow error:', err);
      }
    }
  }, [targetUserId, status, isPrivate, onFollowChange]);

  const getContainerStyle = () => {
    const base: any[] = [styles.container];

    if (size === 'small') base.push(styles.containerSmall);
    else if (size === 'large') base.push(styles.containerLarge);
    else base.push(styles.containerMedium);

    const isActive = status === 'following' || status === 'requested';

    if (variant === 'filled' && !isActive) {
      base.push(styles.containerFilled);
    } else if (variant === 'outlined' || isActive) {
      base.push([styles.containerOutlined, { borderColor: isDark ? '#3E3E42' : '#DBDBDB' }]);
    }

    return base;
  };

  const getTextColor = () => {
    const isActive = status === 'following' || status === 'requested';
    if (variant === 'filled' && !isActive) return '#FFFFFF';
    return isActive ? (isDark ? '#E5E5EA' : '#262626') : '#0095F6';
  };

  const getLabel = () => {
    if (status === 'following') {
      return variant === 'icon' ? null : 'Following';
    }
    if (status === 'requested') {
      return variant === 'icon' ? null : 'Requested';
    }
    return variant === 'icon' ? null : 'Follow';
  };

  if (variant === 'icon') {
    const isRemove = status === 'following' || status === 'requested';
    return (
      <Animated.View entering={FadeIn.duration(100)} style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          style={[
            styles.iconButton,
            isRemove && styles.iconButtonFollowing,
          ]}
          hitSlop={8}
        >
          <Ionicons
            name={isRemove ? 'person-remove-outline' : 'person-add-outline'}
            size={20}
            color={isRemove ? '#FF3040' : '#0095F6'}
          />
        </Pressable>
      </Animated.View>
    );
  }

  const isFollowText = status === 'not_following';

  return (
    <Animated.View entering={FadeIn.duration(100)} style={[animatedStyle, fullWidth && styles.fillParent]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          ...getContainerStyle(),
          fullWidth && styles.fillParent,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        {showIcon && isFollowText && (
          <Ionicons name="person-add" size={14} color="#FFFFFF" style={styles.icon} />
        )}
        <ThemedText
          style={[
            styles.label,
            { color: getTextColor() },
            size === 'small' && styles.labelSmall,
            size === 'large' && styles.labelLarge,
          ]}
        >
          {getLabel()}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  containerSmall: {
    height: 30,
    paddingHorizontal: 14,
  },
  containerMedium: {
    height: 34,
    paddingHorizontal: 20,
  },
  containerLarge: {
    height: 44,
    paddingHorizontal: 32,
  },
  containerFilled: {
    backgroundColor: '#0095F6',
  },
  containerOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
  },
  labelSmall: {
    fontSize: 12.5,
  },
  labelLarge: {
    fontSize: 15,
  },
  icon: {
    marginRight: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,149,246,0.1)',
  },
  iconButtonFollowing: {
    backgroundColor: 'rgba(255,48,64,0.1)',
  },
  fillParent: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
