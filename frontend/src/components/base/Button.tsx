import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, typography, elevation, componentSizes } from '@theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'gold';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({ title, onPress, disabled, loading, variant = 'primary', style, textStyle }: ButtonProps) {
  const [pressed, setPressed] = useState(false);

  const buttonStyle = [
    styles.button,
    variant === 'secondary' && styles.secondary,
    pressed && !disabled && !loading && styles.pressed,
    disabled && styles.disabled,
    style,
  ];

  const textColor = variant === 'secondary' ? colors.textPrimary : colors.surface;
  const textStyleFinal = [styles.text, { color: textColor }, textStyle];

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      style={[{ minHeight: componentSizes.buttonHeight }, buttonStyle]}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'secondary' ? colors.textPrimary : colors.surface} />
      ) : (
        <Text style={textStyleFinal}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.xxxxxxl,
    paddingHorizontal: spacing.xxxxl,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.sm,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.none,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    backgroundColor: colors.disabledBackground,
    ...elevation.none,
  },
  text: {
    ...typography.button,
    letterSpacing: 0.3,
  },
});
