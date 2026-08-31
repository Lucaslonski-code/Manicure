import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '@hooks/AuthContext';
import Button from '@components/base/Button';
import BrandLogo from '@components/base/BrandLogo';
import { colors, spacing, typography } from '@theme';

export default function EmailConfirmationScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { resend, loading } = useAuthContext();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const email = route?.params?.email || '';

  const handleResend = async () => {
    try {
      setError('');
      await resend(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.brandContainer}>
          <BrandLogo size={80} />
        </View>
        <Text style={styles.title}>Verifique seu e-mail</Text>
        <Text style={styles.text}>
          Enviamos um link de confirmação para{'\n'}
          {email ? <Text style={styles.email}>{email}</Text> : ' seu e-mail.'}
        </Text>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {sent ? <Text style={styles.success}>E-mail reenviado com sucesso!</Text> : null}
          <Button
            title="Reenviar e-mail"
            onPress={handleResend}
            disabled={loading}
            loading={loading}
            style={styles.resendButton}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Voltar para login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
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
  email: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  form: {
    width: '100%',
    maxWidth: 320,
  },
  resendButton: {
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  success: {
    ...typography.bodySmall,
    color: colors.success,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  link: {
    ...typography.bodySmall,
    color: colors.gold,
    textAlign: 'center',
    fontWeight: '500',
  },
});
