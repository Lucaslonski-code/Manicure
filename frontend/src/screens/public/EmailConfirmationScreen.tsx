import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import { colors, spacing, typography } from '@theme';

export default function EmailConfirmationScreen({ route, navigation }: any) {
  const { resend, loading } = useAuth();
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>AppManicure</Text>
        <Text style={styles.title}>Verifique seu e-mail</Text>
        <Text style={styles.text}>
          Enviamos um link de confirmação para{'\n'}
          {email ? <Text style={styles.email}>{email}</Text> : ' seu e-mail.'}
        </Text>
      </View>

      <View style={styles.form}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {sent ? <Text style={styles.success}>E-mail reenviado!</Text> : null}
        <Button title="Reenviar e-mail" onPress={handleResend} disabled={loading} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Voltar para login</Text>
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
    alignItems: 'center',
  },
  brand: {
    ...typography.display,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  text: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  email: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
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
