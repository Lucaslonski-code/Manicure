import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '@hooks';
import { deleteAccount } from '../../services/api';
import { colors, spacing, typography, radius } from '@theme';
import DangerButton from '@components/base/DangerButton';
import ConfirmationDialog from '@components/base/ConfirmationDialog';

export default function AccountDeletionScreen({ navigation }: any) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await deleteAccount();
      await signOut();
      navigation.replace('Public');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível excluir a conta. Tente novamente.');
    } finally {
      setLoading(false);
      setShowDialog(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Excluir conta</Text>
        <Text style={styles.subtitle}>Esta ação é irreversível</Text>
      </View>

      <View style={styles.warning}>
        <Text style={styles.warningTitle}>Atenção</Text>
        <Text style={styles.warningText}>
          Ao excluir sua conta, você não poderá recuperar seus dados. Esta ação é irreversível.
        </Text>
        <Text style={styles.warningText}>
          Seus agendamentos futuros serão cancelados e seus dados pessoais serão anonimizados.
        </Text>
      </View>

      <View style={styles.actions}>
        <DangerButton
          title="Excluir minha conta"
          onPress={() => setShowDialog(true)}
          disabled={loading}
        />
      </View>

      <ConfirmationDialog
        visible={showDialog}
        title="Excluir conta"
        message="Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDialog(false)}
        destructive
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.headingLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  warning: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  warningTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  warningText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  actions: {
    paddingHorizontal: spacing.lg,
  },
});
