import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import { colors, spacing, typography } from '@theme';

const LOGO = require('../../../assets/IconAppWhite.png');

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
      <View style={styles.content}>
        <View style={styles.brandContainer}>
          <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
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
    </View>
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
    marginBottom: spacing.xxl,
  },
  logoImage: {
    width: 80,
    height: 80,
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
