import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Input from './Input';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';

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
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <Input
            label={label}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            secureTextEntry={!visible}
            error={error || (matchError ? 'Senhas não coincidem' : undefined)}
            containerStyle={styles.inputContainerInner}
          />
        </View>
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          style={styles.toggleButton}
          accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
          accessibilityRole="button"
        >
          <AppIcon
            name={visible ? 'eye-off' : 'eye'}
            size={iconSizes.md}
            color="secondary"
          />
        </TouchableOpacity>
      </View>
      {showRequirements && value.length > 0 ? (
        <View style={styles.requirementsCard}>
          {requirements.map((req) => {
            const passed = req.test(value);
            return (
              <View key={req.label} style={styles.requirementRow}>
                <AppIcon
                  name={passed ? 'check' : 'error'}
                  size={iconSizes.sm}
                  color={passed ? 'success' : 'error'}
                />
                <Text style={[styles.requirement, passed ? styles.requirementMet : styles.requirementUnmet]}>
                  {req.label}
                </Text>
              </View>
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
  inputWrapper: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerInner: {
    flex: 1,
  },
  toggleButton: {
    position: 'absolute',
    right: spacing.md,
    top: 28,
    padding: spacing.xs,
    zIndex: 1,
  },
  requirementsCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requirement: {
    ...typography.bodySmall,
    marginLeft: spacing.sm,
  },
  requirementMet: {
    color: colors.success,
  },
  requirementUnmet: {
    color: colors.error,
  },
});
