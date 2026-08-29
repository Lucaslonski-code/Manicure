import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, spacing, radius, elevation } from '@theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'appointment' | 'gold';
}

export default function Card({ children, style, variant = 'default' }: CardProps) {
  const cardStyle = [
    styles.card,
    variant === 'appointment' && styles.appointment,
    variant === 'gold' && styles.goldAccent,
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    ...elevation.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appointment: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  goldAccent: {
    borderTopWidth: 3,
    borderTopColor: colors.gold,
  },
});
