import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import PasswordInput from '@components/base/PasswordInput';
import { newPasswordSchema } from '@forms/schemas';
import { colors, spacing, typography, radius, elevation } from '@theme';

const LOGO = require('../../../assets/IconAppWhite.png');

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
      <View style={styles.content}>
        <View style={styles.brandContainer}>
          <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Nova senha</Text>
        <Text style={styles.text}>
          Digite sua nova senha abaixo.
        </Text>

        <View style={styles.formCard}>
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
          <Button
            title="Atualizar senha"
            onPress={handleUpdatePassword}
            disabled={loading || success}
            loading={loading}
            style={styles.updateButton}
          />
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.link}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  brandContainer: {
    marginBottom: spacing.xxxxxxl,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  text: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxxxl,
  },
  formCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  updateButton: {
    marginTop: spacing.xxxxxxl,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  success: {
    ...typography.bodySmall,
    color: colors.success,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  link: {
    ...typography.bodySmall,
    color: colors.gold,
    textAlign: 'center',
    marginTop: spacing.xxxxxxl,
    fontWeight: '500',
  },
});
