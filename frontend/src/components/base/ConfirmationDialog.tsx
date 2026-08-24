import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '@theme';
import Button from './Button';
import SecondaryButton from './SecondaryButton';

interface ConfirmationDialogProps {
  _visible?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export default function ConfirmationDialog({
  _visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmationDialogProps) {
  return (
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
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
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
