import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import { useAuthContext } from '@hooks/AuthContext';
import Button from '@components/base/Button';
import Input from '@components/base/Input';
import PasswordInput from '@components/base/PasswordInput';
import BrandLogo from '@components/base/BrandLogo';
import { signUpSchema } from '@forms/schemas';
import { colors, spacing, typography, radius, elevation } from '@theme';

export default function SignUpScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { signUp, loading } = useAuthContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    try {
      setError('');
      signUpSchema.parse({ name, email, phone, password, confirmPassword });
      await signUp(name, email, phone, password);
      navigation.navigate('Login', { signupSuccess: true });
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior="padding"
        keyboardVerticalOffset={insets.top}
        enabled
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View style={styles.header}>
            <BrandLogo size={104} />
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
              <Button
                title="Cadastrar"
                onPress={handleSignUp}
                disabled={loading}
                loading={loading}
                style={styles.signupButton}
              />
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
                <Text style={styles.link}>Já tenho conta</Text>
              </TouchableOpacity>
            </View>
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
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
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
  link: {
    ...typography.body,
    color: colors.gold,
    fontWeight: '500',
  },
});
