import React, { useState } from 'react';
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

  const handleUpdatePassword = async () => {
    try {
      setError('');
      newPasswordSchema.parse({ password, confirmPassword });
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova senha</Text>
      <Text style={styles.text}>
        Digite sua nova senha abaixo.
      </Text>
      <PasswordInput
        label="Senha"
        value={password}
        onChangeText={setPassword}
        placeholder="******"
        showRequirements
      />
      <PasswordInput
        label="Confirmar senha"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="******"
        confirmPassword={password}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>Senha atualizada!</Text> : null}
      <Button title="Atualizar senha" onPress={handleUpdatePassword} disabled={loading || success} />
      <TouchableOpacity onPress={() => navigation.replace('Login')}>
        <Text style={styles.link}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.headingLarge,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  text: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginBottom: spacing.xl,
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
