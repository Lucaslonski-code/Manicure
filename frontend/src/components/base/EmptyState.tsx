import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import Button from './Button';
import AppIcon from '@components/icons/AppIcon';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: 'sparkles' | 'calendar' | 'bell' | 'user' | 'search' | 'time' | 'mail' | 'document-text';
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'sparkles',
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AppIcon name={icon} size={iconSizes.lg} color="gold" />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.actionContainer}>
          <Button title={actionLabel} onPress={onAction} variant="gold" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxxxxl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.modal,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxxxxl,
    ...elevation.sm,
  },
  title: {
    ...typography.section,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxxxl,
    lineHeight: 22,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 280,
  },
});
