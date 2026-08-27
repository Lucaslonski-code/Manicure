import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import Input from '@components/base/Input';
import { passwordRecoverySchema } from '@forms/schemas';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import { Ionicons } from '@expo/vector-icons';

export default function PasswordRecoveryScreen({ navigation }: any) {
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
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="key-outline" size={iconSizes.lg} color={colors.gold} />
        </View>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.text}>
          Enviaremos um link para redefinir sua senha.
        </Text>

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
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...elevation.sm,
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
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  formCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  recoverButton: {
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
