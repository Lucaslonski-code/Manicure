import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import Input from '@components/base/Input';
import BrandLogo from '@components/base/BrandLogo';
import { passwordRecoverySchema } from '@forms/schemas';
import { colors, spacing, typography, radius, elevation } from '@theme';

export default function PasswordRecoveryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { resetPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    try {
      setError('');
      passwordRecoverySchema.parse({ email });
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar recuperação');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.brandContainer}>
          <BrandLogo size={80} />
        </View>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.text}>Enviaremos um link para redefinir sua senha.</Text>

        <View style={styles.formCard}>
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="seu@email.com"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>Link enviado! Verifique seu e-mail.</Text> : null}
          <Button
            title="Enviar link"
            onPress={handleReset}
            disabled={loading}
            loading={loading}
            style={styles.recoverButton}
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
  formCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  recoverButton: {
    marginTop: spacing.lg,
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
    ...typography.bodySmall,
    color: colors.gold,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontWeight: '500',
  },
});
