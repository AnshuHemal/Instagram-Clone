import React, { useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  StyleProp,
  TextStyle,
  ViewStyle,
  Platform,
} from 'react-native';
import { Fonts } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HashtagInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
  numberOfLines?: number;
  textColor?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Splits a string into alternating plain/hashtag segments.
 * e.g. "hello #world foo #bar" →
 *   [{ text: 'hello ', isHashtag: false }, { text: '#world', isHashtag: true }, ...]
 */
function parseHashtags(text: string): Array<{ text: string; isHashtag: boolean }> {
  const parts: Array<{ text: string; isHashtag: boolean }> = [];
  const regex = /#\w+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isHashtag: false });
    }
    parts.push({ text: match[0], isHashtag: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isHashtag: false });
  }

  return parts;
}

// ─── Shared text style ────────────────────────────────────────────────────────
// These values MUST match between the Text render layer and the TextInput
// so that characters overlay pixel-perfectly.
const FONT_SIZE = 15;
const LINE_HEIGHT = 22;
const PADDING_VERTICAL = 0;
const PADDING_HORIZONTAL = 0;

const sharedTextStyle: TextStyle = {
  fontFamily: Fonts.regular,
  fontSize: FONT_SIZE,
  lineHeight: LINE_HEIGHT,
  paddingVertical: PADDING_VERTICAL,
  paddingHorizontal: PADDING_HORIZONTAL,
  // Android needs explicit letter spacing to match
  letterSpacing: 0,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function HashtagInput({
  value,
  onChangeText,
  placeholder,
  style,
  numberOfLines = 4,
  textColor = '#000000',
}: HashtagInputProps) {
  const inputRef = useRef<TextInput>(null);
  const segments = parseHashtags(value);

  return (
    <View style={[styles.container, style]}>
      {/* ── Render layer (behind): colored hashtag tokens ── */}
      <Text
        pointerEvents="none"
        style={[styles.renderLayer, sharedTextStyle, { color: textColor }]}
        numberOfLines={numberOfLines}
      >
        {segments.length === 0
          ? null
          : segments.map((seg, i) =>
              seg.isHashtag ? (
                <Text key={i} style={styles.hashtagToken}>
                  {seg.text}
                </Text>
              ) : (
                <Text key={i}>{seg.text}</Text>
              ),
            )}
      </Text>

      {/* ── Transparent TextInput on top ── */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8E8E8F"
        multiline
        numberOfLines={numberOfLines}
        scrollEnabled={false}
        style={[styles.input, sharedTextStyle]}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  renderLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    color: '#000000',  // base plain text color (overridden by parent theme)
    // The transparent TextInput sits on top, so this layer only shows hashtag colors
  },
  hashtagToken: {
    color: '#0095F6',
  },
  input: {
    color: 'transparent',   // hide native text — render layer provides visuals
    padding: 0,
    margin: 0,
    textAlignVertical: 'top',
    // On iOS, selection cursor color follows `tintColor`; keep it visible
    ...Platform.select({
      ios: { paddingTop: 0 },
      android: { paddingTop: 0 },
    }),
  },
});
