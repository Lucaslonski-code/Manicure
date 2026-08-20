import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/base/Button';
import Input from '@components/base/Input';
import { passwordRecoverySchema } from '@forms/schemas';
import { colors, spacing, typography } from '@theme';

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
      <Text style={styles.title}>Recuperar senha</Text>
      <Text style={styles.text}>
        Enviaremos um link para redefinir sua senha.
      </Text>
      <Input
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="seu@email.com"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>Link enviado!</Text> : null}
      <Button title="Enviar link" onPress={handleReset} disabled={loading} />
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Voltar para login</Text>
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
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  text: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginBottom: spacing.xl,
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
