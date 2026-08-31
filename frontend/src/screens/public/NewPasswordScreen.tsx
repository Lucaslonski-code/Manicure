import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import { useAuthContext } from '@hooks/AuthContext';
import Button from '@components/base/Button';
import PasswordInput from '@components/base/PasswordInput';
import BrandLogo from '@components/base/BrandLogo';
import { newPasswordSchema } from '@forms/schemas';
import { colors, spacing, typography, radius, elevation } from '@theme';

export default function NewPasswordScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { updatePassword, loading } = useAuthContext();
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior="padding"
        keyboardVerticalOffset={insets.top}
        enabled
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandContainer}>
            <BrandLogo size={80} />
          </View>
          <Text style={styles.title}>Nova senha</Text>
          <Text style={styles.text}>Digite sua nova senha abaixo.</Text>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl,
  },
  brandContainer: {
    marginBottom: spacing.xl,
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
    marginBottom: spacing.xl,
  },
  formCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  updateButton: {
    marginTop: spacing.lg,
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
    marginTop: spacing.lg,
    fontWeight: '500',
  },
});
