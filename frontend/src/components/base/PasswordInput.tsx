import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Input from './Input';
import { colors, spacing, typography } from '@theme';

interface PasswordInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  showRequirements?: boolean;
  confirmPassword?: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'Pelo menos 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Uma letra minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Um número', test: (p) => /[0-9]/.test(p) },
  { label: 'Um símbolo', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  showRequirements = false,
  confirmPassword,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const matchError = confirmPassword !== undefined && confirmPassword.length > 0 && value !== confirmPassword;

  return (
    <View style={styles.container}>
      <Input
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!visible}
        error={error || (matchError ? 'Senhas não coincidem' : undefined)}
      />
      <TouchableOpacity
        onPress={() => setVisible((v) => !v)}
        accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
        accessibilityRole="button"
      >
        <Text style={styles.toggle}>{visible ? 'Ocultar' : 'Mostrar'}</Text>
      </TouchableOpacity>
      {showRequirements && value.length > 0 ? (
        <View style={styles.requirements}>
          {requirements.map((req) => {
            const passed = req.test(value);
            return (
              <Text key={req.label} style={[styles.requirement, passed ? styles.requirementMet : styles.requirementUnmet]}>
                {passed ? '✓' : '✕'} {req.label}
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  toggle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  requirements: {
    marginTop: spacing.sm,
  },
  requirement: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  requirementMet: {
    color: colors.success,
  },
  requirementUnmet: {
    color: colors.error,
  },
});
