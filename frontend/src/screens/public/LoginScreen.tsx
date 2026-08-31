import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import { useAuthContext } from '@hooks/AuthContext';
import Button from '@components/base/Button';
import Input from '@components/base/Input';
import PasswordInput from '@components/base/PasswordInput';
import BrandLogo from '@components/base/BrandLogo';
import { loginSchema } from '@forms/schemas';
import { colors, spacing, typography, radius, elevation } from '@theme';

export default function LoginScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { signIn, loading, profileError } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(
    route?.params?.signupSuccess
      ? 'Conta criada com sucesso. Confirme seu e-mail para poder entrar.'
      : ''
  );

  const isBusy = loading || submitting;

  const handleLogin = async () => {
    if (isBusy) return;
    try {
      setError('');
      setSuccess('');
      setSubmitting(true);
      console.log('[LOGIN] SUBMIT START');
      loginSchema.parse({ email, password });
      console.log('[LOGIN] VALIDATION PASSED');
      await signIn(email, password);
      console.log('[LOGIN] SIGNIN RESOLVED — success');
      setSuccess('Login realizado com sucesso.');
    } catch (err: any) {
      console.error('[LOGIN] ERROR:', err?.name, err?.message);
      setError(err.message || 'Erro ao entrar');
    } finally {
      setSubmitting(false);
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BrandLogo size={104} />
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
              {profileError ? <Text style={styles.error}>{profileError}</Text> : null}
              {success ? <Text style={styles.success}>{success}</Text> : null}
              <Button
                title="Entrar"
                onPress={handleLogin}
                disabled={isBusy}
                loading={isBusy}
                style={styles.loginButton}
              />
              <TouchableOpacity
                onPress={() => navigation.navigate('PasswordRecovery')}
                style={styles.recoveryLink}
              >
                <Text style={styles.link}>Esqueci minha senha</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <Text style={styles.footerText}>Ainda não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.linkBold}>Criar conta</Text>
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
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
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
  loginButton: {
    marginTop: spacing.lg,
  },
  recoveryLink: {
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
  linkBold: {
    ...typography.body,
    color: colors.gold,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: spacing.lg,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
