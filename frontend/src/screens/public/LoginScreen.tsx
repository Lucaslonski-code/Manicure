import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import Input from '@components/base/Input';
import PasswordInput from '@components/base/PasswordInput';
import { loginSchema } from '@forms/schemas';
import { colors, spacing, typography, radius, elevation } from '@theme';

export default function LoginScreen({ navigation }: any) {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      setSuccess('');
      loginSchema.parse({ email, password });
      await signIn(email, password);
      setSuccess('Login realizado com sucesso.');
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.brand}>AppManicure</Text>
        </View>
        <Text style={styles.title}>Bom dia</Text>
        <Text style={styles.subtitle}>Seu momento de cuidado começa aqui</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formCard}>
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="seu@email.com"
          />
          <PasswordInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="Sua senha"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <Button
            title="Entrar"
            onPress={handleLogin}
            disabled={loading}
            loading={loading}
            style={styles.loginButton}
          />
          <TouchableOpacity onPress={() => navigation.navigate('PasswordRecovery')}>
            <Text style={styles.link}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ainda não tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.linkBold}>Criar conta</Text>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    ...elevation.sm,
  },
  logoText: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brand: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  loginButton: {
    marginTop: spacing.md,
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
    ...typography.bodyMedium,
    color: colors.gold,
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '500',
  },
  linkBold: {
    ...typography.bodyMedium,
    color: colors.gold,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  footerText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});
