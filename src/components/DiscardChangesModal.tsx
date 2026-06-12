import React from 'react';
import { StyleSheet, View, Text, Pressable, Modal } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Fonts } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

interface DiscardChangesModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DiscardChangesModal: React.FC<DiscardChangesModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable 
          style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ThemedText style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Discard changes?
          </ThemedText>
          
          <ThemedText style={[styles.subtitle, { color: isDark ? '#A8A8A8' : '#737373' }]}>
            You have unsaved changes. Are you sure you want to discard them?
          </ThemedText>

          <View style={styles.buttonContainer}>
            <Pressable onPress={onConfirm} style={styles.button}>
              <Text style={[styles.buttonTextDiscard, { color: '#FA3E3E' }]}>
                DISCARD
              </Text>
            </Pressable>

            <Pressable onPress={onCancel} style={styles.button}>
              <Text style={[styles.buttonTextKeep, { color: '#0064E0' }]}>
                KEEP EDITING
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 10,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    alignItems: 'flex-end',
    gap: 18,
  },
  button: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  buttonTextDiscard: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  buttonTextKeep: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
});
