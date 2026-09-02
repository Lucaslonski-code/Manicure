import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, typography, componentSizes } from '@theme';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function SecondaryButton({ title, onPress, disabled, loading, style, textStyle }: SecondaryButtonProps) {
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
        <ActivityIndicator size="small" color={colors.textSecondary} />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.goldOverlay,
    borderColor: colors.goldLight,
  },
  disabled: {
    borderColor: colors.disabled,
    backgroundColor: colors.disabledBackground,
  },
  text: {
    color: colors.textPrimary,
    ...typography.button,
    letterSpacing: 0.3,
  },
});
