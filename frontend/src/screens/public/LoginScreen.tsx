import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import Input from '@components/base/Input';
import PasswordInput from '@components/base/PasswordInput';
import { loginSchema } from '@forms/schemas';
import { colors, spacing, typography } from '@theme';

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
        <Text style={styles.brand}>AppManicure</Text>
        <Text style={styles.title}>Olá, seja bem-vindo</Text>
        <Text style={styles.subtitle}>Entre na sua conta para continuar</Text>
      </View>

      <View style={styles.form}>
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
        <Button title="Entrar" onPress={handleLogin} disabled={loading} />
        <TouchableOpacity onPress={() => navigation.navigate('PasswordRecovery')}>
          <Text style={styles.link}>Esqueci minha senha</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.link}>Criar conta</Text>
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
  },
  brand: {
    ...typography.display,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
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
