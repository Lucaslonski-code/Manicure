import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import Input from '@components/base/Input';
import PasswordInput from '@components/base/PasswordInput';
import { loginSchema } from '@forms/schemas';
import { colors, spacing, typography, radius, elevation } from '@theme';

const LOGO = require('../../../assets/IconAppWhite.png');

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
          <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
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
          <TouchableOpacity onPress={() => navigation.navigate('PasswordRecovery')} style={styles.recoveryLink}>
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
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xxxxxl,
    paddingBottom: spacing.xxxxxxl,
    alignItems: 'center',
  },
  brandContainer: {
    marginBottom: spacing.xxxxxxl,
  },
  logoImage: {
    width: 104,
    height: 70,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  loginButton: {
    marginTop: spacing.xxxxl,
  },
  recoveryLink: {
    marginTop: spacing.xxxxxxl,
    alignItems: 'center',
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
    ...typography.body,
    color: colors.gold,
    fontWeight: '500',
  },
  linkBold: {
    ...typography.body,
    color: colors.gold,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxxxxxxl,
    paddingBottom: spacing.xxxxxxl,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
