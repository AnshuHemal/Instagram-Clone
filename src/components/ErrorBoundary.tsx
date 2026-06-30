import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

// ─── Fallback UI ──────────────────────────────────────────────────────────────

interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }]}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3040" />
        </View>

        <ThemedText style={[styles.title, { color: colors.text }]}>
          Something went wrong
        </ThemedText>

        <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
          We're sorry for the inconvenience. Please try again.
        </ThemedText>

        {__DEV__ && error && (
          <View style={[styles.errorDetails, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }]}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error.message}
            </Text>
          </View>
        )}

        <Pressable onPress={onRetry} style={[styles.retryButton, { backgroundColor: '#0095F6' }]}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorDetails: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    maxHeight: 120,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
});