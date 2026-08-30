import React, { useState } from 'react';
import { TextInput, View, Text, TextInputProps, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, typography, elevation, componentSizes } from '@theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export default function Input({ label, error, containerStyle, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          focused && styles.inputFocused,
        ]}
        placeholderTextColor={colors.disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...typography.input,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    height: componentSizes.inputHeight,
    ...elevation.none,
  },
  inputFocused: {
    borderColor: colors.gold,
    borderWidth: 1.5,
    ...elevation.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
