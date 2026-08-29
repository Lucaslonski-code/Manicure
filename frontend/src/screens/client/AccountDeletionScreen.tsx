import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '@hooks';
import { deleteAccount } from '../../services/api';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import DangerButton from '@components/base/DangerButton';
import ConfirmationDialog from '@components/base/ConfirmationDialog';
import ScreenHeader from '@components/base/ScreenHeader';

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
      <ScreenHeader title="Excluir conta" subtitle="Esta ação é irreversível" accent />
      <View style={styles.warning}>
        <View style={styles.warningIconContainer}>
          <AppIcon name="warning" size={iconSizes.md} color="error" />
        </View>
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
          loading={loading}
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
  warning: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    ...elevation.sm,
  },
  warningIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(166, 61, 64, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: spacing.screenPadding,
  },
});
