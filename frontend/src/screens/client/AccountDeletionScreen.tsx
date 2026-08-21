import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@hooks';
import { deleteAccount } from '../../services/api';
import { colors, spacing, typography } from '@theme';

export default function AccountDeletionScreen({ navigation }: any) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Excluir conta',
      'Esta ação é irreversível. Seus agendamentos futuros serão cancelados e seus dados pessoais serão anonimizados. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAccount();
              await signOut();
              navigation.replace('Public');
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Não foi possível excluir a conta. Tente novamente.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Excluir conta</Text>

      <View style={styles.warning}>
        <Text style={styles.warningTitle}>Atenção</Text>
        <Text style={styles.warningText}>
          Ao excluir sua conta, você não poderá recuperar seus dados. Esta ação é irreversível.
        </Text>
        <Text style={styles.warningText}>
          Seus agendamentos futuros serão cancelados e seus dados pessoais serão anonimizados.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
        disabled={loading}
      >
        <Text style={styles.deleteButtonText}>
          {loading ? 'Excluindo...' : 'Excluir minha conta'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.headingLarge,
    marginBottom: spacing.xl,
  },
  warning: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  warningTitle: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  warningText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  deleteButton: {
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    ...typography.bodyLarge,
    color: colors.background,
    fontWeight: '600',
  },
});
