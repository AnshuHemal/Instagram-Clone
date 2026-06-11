import React, { useState, useEffect, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { followService } from '@/services/follow';

type FollowButtonProps = {
  targetUserId: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean, followersCount?: number) => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined' | 'icon';
  showIcon?: boolean;
};

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  initialIsFollowing = false,
  onFollowChange,
  size = 'medium',
  variant = 'filled',
  showIcon = false,
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const scale = useSharedValue(1);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(async () => {
    // Optimistic update
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    });

    try {
      let result;
      if (newFollowing) {
        result = await followService.followUser(targetUserId);
      } else {
        result = await followService.unfollowUser(targetUserId);
      }

      if (result.success) {
        setIsFollowing(result.following);
        onFollowChange?.(result.following, result.followersCount);
      } else {
        setIsFollowing(!newFollowing);
      }
    } catch (err) {
      setIsFollowing(!newFollowing);
      console.error('Follow toggle error:', err);
    }
  }, [targetUserId, isFollowing, onFollowChange]);

  const getContainerStyle = () => {
    const base: any[] = [styles.container];

    if (size === 'small') base.push(styles.containerSmall);
    else if (size === 'large') base.push(styles.containerLarge);
    else base.push(styles.containerMedium);

    if (variant === 'filled' && !isFollowing) {
      base.push(styles.containerFilled);
    } else if (variant === 'outlined' || isFollowing) {
      base.push(styles.containerOutlined);
    }

    return base;
  };

  const getTextColor = () => {
    if (variant === 'filled' && !isFollowing) return '#FFFFFF';
    return isFollowing ? '#262626' : '#0095F6';
  };

  const getLabel = () => {
    if (isFollowing) {
      return variant === 'icon' ? null : 'Following';
    }
    return variant === 'icon' ? null : 'Follow';
  };

  if (variant === 'icon') {
    return (
      <Animated.View entering={FadeIn.duration(100)} style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          style={[
            styles.iconButton,
            isFollowing && styles.iconButtonFollowing,
          ]}
          hitSlop={8}
        >
          <Ionicons
            name={isFollowing ? 'person-remove-outline' : 'person-add-outline'}
            size={20}
            color={isFollowing ? '#FF3040' : '#0095F6'}
          />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(100)} style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          ...getContainerStyle(),
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        {showIcon && !isFollowing && (
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
    borderColor: '#DBDBDB',
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
});
