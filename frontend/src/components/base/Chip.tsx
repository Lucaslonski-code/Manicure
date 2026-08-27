import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, typography, elevation } from '@theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Chip({ label, selected = false, onPress, disabled = false, style }: ChipProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.gold : colors.border,
          backgroundColor: selected ? colors.goldOverlay : colors.surface,
        },
        disabled && styles.disabled,
        style,
      ]}
      accessibilityLabel={`Filtro ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <Text style={[styles.text, { color: selected ? colors.gold : colors.textPrimary }]}>
        {label}
      </Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    ...elevation.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.label,
    letterSpacing: 0.3,
  },
});
