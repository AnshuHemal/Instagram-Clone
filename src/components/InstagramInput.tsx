import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TextInputProps, Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';

interface InstagramInputProps extends TextInputProps {
  label: string;
  value: string;
  error?: string;
  success?: boolean;
}

export const InstagramInput: React.FC<InstagramInputProps> = ({
  label,
  value,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  error,
  success,
  ...rest
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  
  const hasValue = value.length > 0;
  const showLabel = isFocused || hasValue;

  // Sync isSecure with secureTextEntry prop changes
  useEffect(() => {
    setIsSecure(secureTextEntry);
  }, [secureTextEntry]);

  // Animation values
  const labelTop = useSharedValue(hasValue ? 6 : 18);
  const labelFontSize = useSharedValue(hasValue ? 11 : 15);
  const inputPaddingTop = useSharedValue(hasValue ? 16 : 0);

  useEffect(() => {
    labelTop.value = withTiming(showLabel ? 6 : 18, { duration: 180 });
    labelFontSize.value = withTiming(showLabel ? 11 : 15, { duration: 180 });
    inputPaddingTop.value = withTiming(showLabel ? 16 : 0, { duration: 180 });
  }, [showLabel]);

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      top: labelTop.value,
      fontSize: labelFontSize.value,
      color: withTiming(
        error
          ? '#FA3E3E'
          : isFocused 
            ? '#0064E0' 
            : (isDark ? '#A8A8A8' : '#737373'),
        { duration: 180 }
      ),
    };
  });

  const animatedInputStyle = useAnimatedStyle(() => {
    return {
      paddingTop: inputPaddingTop.value,
    };
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderColor: error 
              ? '#FA3E3E' 
              : isFocused 
                ? '#0064E0' 
                : (isDark ? '#262626' : '#DBDBDB'),
            height: 58,
          },
        ]}
      >
        <Animated.Text style={[styles.label, animatedLabelStyle]}>
          {label}
        </Animated.Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', height: 54 }}>
          <Animated.View style={[{ flex: 1, height: 54 }, animatedInputStyle]}>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  fontSize: 15,
                },
                style,
              ]}
              value={value}
              onFocus={handleFocus}
              onBlur={handleBlur}
              secureTextEntry={isSecure}
              placeholder=""
              placeholderTextColor="transparent"
              {...rest}
            />
          </Animated.View>

          {/* Render red exclamation warning icon for non-secure fields when there is an error */}
          {error && !secureTextEntry && (
            <View style={{ paddingLeft: 8, justifyContent: 'center', height: '100%' }}>
              <Ionicons 
                name="alert-circle-outline" 
                size={22} 
                color="#FA3E3E" 
              />
            </View>
          )}

          {/* Render green checkmark icon when success is true and no error */}
          {success && !error && (
            <View style={{ paddingLeft: 8, justifyContent: 'center', height: '100%' }}>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={22} 
                color="#00A859" 
              />
            </View>
          )}

          {/* Render red exclamation warning icon for secure fields next to the toggle eye icon */}
          {error && secureTextEntry && (
            <View style={{ paddingLeft: 8, justifyContent: 'center', height: '100%', marginRight: 4 }}>
              <Ionicons 
                name="alert-circle-outline" 
                size={22} 
                color="#FA3E3E" 
              />
            </View>
          )}

          {secureTextEntry && (
            <Pressable 
              onPress={() => setIsSecure(!isSecure)} 
              style={{ paddingLeft: 8, justifyContent: 'center', height: '100%' }}
            >
              <Ionicons 
                name={isSecure ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={isDark ? '#8E8E93' : '#737373'} 
              />
            </Pressable>
          )}
        </View>
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: '#FA3E3E' }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginBottom: 4,
  },
  container: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 16,
    fontFamily: Fonts.regular,
    zIndex: 1,
  },
  input: {
    fontFamily: Fonts.medium,
    width: '100%',
    padding: 0,
    margin: 0,
    height: '100%',
  },
  errorText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 18,
    textAlign: 'left',
  },
});
