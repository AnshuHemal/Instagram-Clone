import React from 'react';
import { Platform, TextProps } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';

interface TappableTextProps extends TextProps {
  children: string;
  hashtagColor?: string;
  mentionColor?: string;
}

type Segment = { text: string; type: 'plain' | 'hashtag' | 'mention' };

export const TappableText: React.FC<TappableTextProps> = ({
  children,
  hashtagColor = '#0064E0',
  mentionColor = '#0064E0',
  style,
  ...props
}) => {
  const router = useRouter();

  if (!children) return null;

  const segments: Segment[] = [];
  const regex = /(#\w+)|(@\w+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(children)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: children.slice(lastIndex, match.index), type: 'plain' });
    }
    const fullMatch = match[0];
    segments.push({
      text: fullMatch,
      type: fullMatch.startsWith('#') ? 'hashtag' : 'mention',
    });
    lastIndex = match.index + fullMatch.length;
  }
  if (lastIndex < children.length) {
    segments.push({ text: children.slice(lastIndex), type: 'plain' });
  }

  const handlePress = (segment: Segment) => {
    if (segment.type === 'plain') return;
    if (segment.type === 'hashtag') {
      const tag = segment.text.slice(1);
      router.push({ pathname: '/(auth)/hashtag', params: { tag } } as any);
    } else if (segment.type === 'mention') {
      const username = segment.text.slice(1);
      router.push({ pathname: '/(tabs)/profile', params: { username } } as any);
    }
  };

  return (
    <ThemedText style={style} {...props}>
      {segments.map((segment, index) => {
        if (segment.type === 'plain') {
          return <React.Fragment key={index}>{segment.text}</React.Fragment>;
        }
        return (
          <ThemedText
            key={index}
            style={[
              segment.type === 'hashtag' && { color: hashtagColor, fontWeight: '600' as const },
              segment.type === 'mention' && { color: mentionColor, fontWeight: '600' as const },
              Platform.OS === 'web' && { cursor: 'pointer' },
            ]}
            onPress={() => handlePress(segment)}
          >
            {segment.text}
          </ThemedText>
        );
      })}
    </ThemedText>
  );
};