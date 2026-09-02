import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, typography, componentSizes, elevation } from '@theme';

interface DangerButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function DangerButton({ title, onPress, disabled, loading, style, textStyle }: DangerButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      style={[
        styles.button,
        pressed && !disabled && !loading && styles.pressed,
        disabled && styles.disabled,
        { height: componentSizes.buttonHeight },
        style,
      ]}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.surface} />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.sm,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    backgroundColor: colors.disabled,
    ...elevation.none,
  },
  text: {
    color: colors.surface,
    ...typography.button,
    letterSpacing: 0.3,
  },
});
