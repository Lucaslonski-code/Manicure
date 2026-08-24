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
      <Text style={styles.title}>Entrar</Text>
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
        placeholder="******"
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
    marginBottom: spacing.xl,
    textAlign: 'center',
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
