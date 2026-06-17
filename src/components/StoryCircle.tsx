import React from 'react';
import { StyleSheet, View, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { haptics } from '@/utils/haptics';

interface StoryCircleProps {
  username: string;
  avatar: string;
  isSeen?: boolean;
  onPress?: () => void;
  size?: number;
  showUsername?: boolean;
}

export const StoryCircle: React.FC<StoryCircleProps> = ({
  username,
  avatar,
  isSeen = false,
  onPress,
  size = 60,
  showUsername = true,
}) => {
  const { colors } = useTheme();
  const ringSize = size + 6;
  const innerSize = size + 2;

  const handlePress = () => {
    if (onPress) {
      haptics.onButtonPress();
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.6 }]}
    >
      {isSeen ? (
        <View
          style={[
            styles.seenRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderColor: colors.border,
            },
          ]}
        >
          <Image source={{ uri: avatar }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
        </View>
      ) : (
        <LinearGradient
          colors={colors.storyRing as any}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradientRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
            },
          ]}
        >
          <View
            style={[
              styles.innerRing,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
                backgroundColor: colors.background,
              },
            ]}
          >
            <Image source={{ uri: avatar }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
          </View>
        </LinearGradient>
      )}
      {showUsername && (
        <ThemedText type="small" numberOfLines={1} style={[styles.username, { color: colors.textSecondary }]}>
          {username}
        </ThemedText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 15,
  },
  gradientRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  seenRing: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatar: {
    resizeMode: 'cover',
  },
  username: {
    fontSize: 11,
    marginTop: 5,
    maxWidth: 70,
    textAlign: 'center',
  },
});
