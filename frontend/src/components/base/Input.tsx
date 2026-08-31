import React, { useState } from 'react';
import { TextInput, View, Text, TextInputProps, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, typography, elevation, componentSizes } from '@theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightAccessory?: React.ReactNode;
}

export default function Input({ label, error, containerStyle, rightAccessory, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  const hasError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputBox,
          focused && styles.inputFocused,
          hasError && styles.inputErrorBox,
          rightAccessory ? styles.inputBoxWithAccessory : undefined,
        ]}
      >
        <TextInput
          style={[styles.input, rightAccessory ? styles.inputWithAccessory : undefined]}
          placeholderTextColor={colors.disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
      </View>
      {hasError ? <Text style={styles.errorText}>{error}</Text> : null}
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
  inputBox: {
    height: componentSizes.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    ...elevation.none,
  },
  inputBoxWithAccessory: {
    paddingRight: 0,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    ...typography.input,
    paddingVertical: 0,
  },
  inputWithAccessory: {
    paddingRight: 44,
  },
  inputFocused: {
    borderColor: colors.gold,
    borderWidth: 1.5,
  },
  inputErrorBox: {
    borderColor: colors.error,
  },
  accessory: {
    position: 'absolute',
    right: spacing.sm,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
