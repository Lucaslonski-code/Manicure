import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import PasswordInput from '@components/base/PasswordInput';
import { newPasswordSchema } from '@forms/schemas';
import { colors, spacing, typography } from '@theme';

export default function NewPasswordScreen({ navigation }: any) {
  const { updatePassword, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleUpdatePassword = async () => {
    try {
      setError('');
      newPasswordSchema.parse({ password, confirmPassword });
      await updatePassword(password);
      setSuccess(true);
      timeoutRef.current = setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>AppManicure</Text>
        <Text style={styles.title}>Nova senha</Text>
        <Text style={styles.text}>
          Digite sua nova senha abaixo.
        </Text>
      </View>

      <View style={styles.form}>
        <PasswordInput
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Crie uma senha"
          showRequirements
        />
        <PasswordInput
          label="Confirmar senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repita a senha"
          confirmPassword={password}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>Senha atualizada!</Text> : null}
        <Button title="Atualizar senha" onPress={handleUpdatePassword} disabled={loading || success} />
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.link}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  brand: {
    ...typography.display,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  text: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: spacing.lg,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  success: {
    ...typography.bodySmall,
    color: colors.success,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  link: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
