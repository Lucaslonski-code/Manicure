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
      'Excluir sua conta de administrador',
      'Esta ação é irreversível. Ao excluir sua conta:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir minha conta',
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
      <Text style={styles.title}>Excluir minha conta</Text>

      <View style={styles.warning}>
        <Text style={styles.warningTitle}>Atenção</Text>
        <Text style={styles.warningText}>
          Você está excluindo sua conta de administrador.
        </Text>
        <Text style={styles.warningText}>
          Esta ação encerrará seu acesso administrativo e removerá seu vínculo com o profissional associado.
        </Text>
        <Text style={styles.warningText}>
          Seus agendamentos futuros serão cancelados e seus dados pessoais serão anonimizados. Esta ação é irreversível.
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
    color: colors.textPrimary,
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
