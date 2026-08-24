import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import Input from '@components/base/Input';
import PasswordInput from '@components/base/PasswordInput';
import { signUpSchema } from '@forms/schemas';
import { colors, spacing, typography } from '@theme';

export default function SignUpScreen({ navigation }: any) {
  const { signUp, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignUp = async () => {
    try {
      setError('');
      setSuccess('');
      signUpSchema.parse({ name, email, phone, password, confirmPassword });
      await signUp(name, email, phone, password);
      setSuccess('Conta criada com sucesso. Enviamos um e-mail de confirmação para seu endereço.');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
      <Input
        label="Nome completo"
        value={name}
        onChangeText={setName}
        placeholder="Seu nome"
      />
      <Input
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="seu@email.com"
      />
      <Input
        label="Telefone"
        value={phone}
        onChangeText={setPhone}
        placeholder="(00) 00000-0000"
        keyboardType="phone-pad"
      />
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
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <Button title="Cadastrar" onPress={handleSignUp} disabled={loading || !!success} />
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Já tenho conta</Text>
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
