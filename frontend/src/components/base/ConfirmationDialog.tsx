import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { colors, spacing, typography, radius } from '@theme';
import Button from './Button';
import SecondaryButton from './SecondaryButton';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export default function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmationDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.wrapper} accessibilityLabel={`Confirmar ${title}`} accessibilityRole="alert">
        <Text style={[styles.title, destructive && styles.titleDestructive]}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <SecondaryButton title={cancelLabel} onPress={onCancel} />
          </View>
          <View style={styles.actionButton}>
            <Button
              title={confirmLabel}
              onPress={onConfirm}
              style={destructive ? styles.destructiveButton : undefined}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(37, 34, 31, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
  },
  title: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  titleDestructive: {
    color: colors.error,
  },
  message: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginVertical: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
});
