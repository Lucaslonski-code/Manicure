import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@theme';

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'gold';
}

export default function StatusBadge({ label, variant = 'default' }: StatusBadgeProps) {
  const backgroundColor = {
    success: 'rgba(74, 124, 89, 0.10)',
    warning: 'rgba(185, 155, 104, 0.10)',
    error: 'rgba(166, 61, 64, 0.10)',
    info: 'rgba(111, 98, 86, 0.08)',
    gold: 'rgba(185, 155, 104, 0.12)',
    default: colors.border,
  }[variant];

  const textColor = {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.textSecondary,
    gold: colors.gold,
    default: colors.textSecondary,
  }[variant];

  return (
    <View
      style={[styles.badge, { backgroundColor }]}
      accessibilityLabel={`Status ${label}`}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.xxxxxxl,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    minHeight: 26,
    justifyContent: 'center',
  },
  text: {
    ...typography.label,
    letterSpacing: 0.3,
  },
});
