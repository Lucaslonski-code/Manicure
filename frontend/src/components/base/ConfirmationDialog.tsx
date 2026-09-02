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
  variant?: 'danger' | 'warning' | 'info';
  destructive?: boolean;
  loading?: boolean;
}

export default function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant,
  destructive = false,
  loading = false,
}: ConfirmationDialogProps) {
  const isDestructive = variant === 'danger' || destructive;

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
        <Text style={[styles.title, isDestructive && styles.titleDestructive]}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <SecondaryButton title={cancelLabel} onPress={onCancel} style={styles.cancelBtn} />
          <Button
            title={confirmLabel}
            onPress={onConfirm}
            loading={loading}
            style={isDestructive ? styles.destructiveButton : undefined}
          />
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
    padding: spacing.screenPadding,
  },
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    ...typography.section,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    flexShrink: 1,
  },
  titleDestructive: {
    color: colors.error,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginVertical: spacing.xxxxxxl,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    minWidth: 80,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
});
