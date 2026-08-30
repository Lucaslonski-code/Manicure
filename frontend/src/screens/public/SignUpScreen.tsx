import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import Input from '@components/base/Input';
import PasswordInput from '@components/base/PasswordInput';
import { signUpSchema } from '@forms/schemas';
import { colors, spacing, typography, radius, elevation } from '@theme';

const LOGO = require('../../../assets/IconAppWhite.png');

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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
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
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.link}>Já tenho conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  brandContainer: {
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: 96,
    height: 64,
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
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  signupButton: {
    marginTop: spacing.lg,
  },
  loginLink: {
    marginTop: spacing.lg,
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
});
