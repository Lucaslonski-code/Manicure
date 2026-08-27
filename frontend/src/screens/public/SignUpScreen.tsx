import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import Input from '@components/base/Input';
import PasswordInput from '@components/base/PasswordInput';
import { signUpSchema } from '@forms/schemas';
import { colors, spacing, typography, radius, elevation } from '@theme';

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
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.brand}>AppManicure</Text>
        </View>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Preencha os dados para começar</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formCard}>
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
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <Button
            title="Cadastrar"
            onPress={handleSignUp}
            disabled={loading || !!success}
            loading={loading}
            style={styles.signupButton}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Já tenho conta</Text>
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
  signupButton: {
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
});
