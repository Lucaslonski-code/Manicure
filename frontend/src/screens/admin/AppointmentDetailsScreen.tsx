import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointment, useProfessionals, useMyProfessional, useBooking } from '@hooks';
import { colors, spacing, typography, radius } from '@theme';
import StatusBadge from '@components/base/StatusBadge';
import Divider from '@components/base/Divider';
import Button from '@components/base/Button';
import DangerButton from '@components/base/DangerButton';
import LoadingState from '@components/base/LoadingState';
import ConfirmationDialog from '@components/base/ConfirmationDialog';
import ScreenHeader from '@components/base/ScreenHeader';

export default function AppointmentDetailsScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { appointmentId } = route.params;
  const { appointment, loading } = useAppointment(appointmentId);
  const { professionals } = useProfessionals();
  const { professional: myProfessional } = useMyProfessional();
  const { cancelByAdmin, loading: cancelLoading } = useBooking();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const professional = appointment ? professionals.find((p) => p.id === appointment.professional_id) : null;
  const isOwner = myProfessional?.id === appointment?.professional_id;

  const handleCancel = async () => {
    try {
      await cancelByAdmin(appointmentId);
      setShowCancelDialog(false);
      navigation.goBack();
    } catch {
      setShowCancelDialog(false);
    }
  };

  if (loading) {
    return <LoadingState message="Carregando detalhes..." />;
  }

  if (!appointment) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24 }] }>
        <Text style={styles.errorText}>Agendamento não encontrado.</Text>
        <Button title="Voltar" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
    confirmed: { label: 'Confirmado', variant: 'success' },
    cancelled: { label: 'Cancelado', variant: 'error' },
    completed: { label: 'Concluído', variant: 'default' },
  };
  const status = statusMap[appointment.status] || { label: appointment.status, variant: 'default' };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) + 16 }} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Detalhes do agendamento" />
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Profissional</Text>
          <Text style={styles.value}>{professional?.display_name || '—'}</Text>
        </View>
        <Divider />
        <View style={styles.row}>
          <Text style={styles.label}>Data e horário</Text>
          <Text style={styles.value}>
            {format(parseISO(appointment.start_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
        </View>
        <Divider />
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <StatusBadge label={status.label} variant={status.variant} />
        </View>
        {appointment.client_note && (
          <>
            <Divider />
            <View style={styles.section}>
              <Text style={styles.label}>Observação da cliente</Text>
              <Text style={styles.value}>{appointment.client_note}</Text>
            </View>
          </>
        )}
        {appointment.admin_note && (
          <>
            <Divider />
            <View style={styles.section}>
              <Text style={styles.label}>Observação admin</Text>
              <Text style={styles.value}>{appointment.admin_note}</Text>
            </View>
          </>
        )}
      </View>

      {isOwner ? (
        appointment.status === 'confirmed' ? (
          <View style={styles.actions}>
            <DangerButton
              title="Cancelar agendamento"
              onPress={() => setShowCancelDialog(true)}
              disabled={cancelLoading}
            />
          </View>
        ) : (
          <View style={styles.readOnlyNotice}>
            <Text style={styles.readOnlyText}>Somente leitura — agendamento {status.label.toLowerCase()}</Text>
          </View>
        )
      ) : (
        <View style={styles.readOnlyNotice}>
          <Text style={styles.readOnlyText}>Somente leitura — responsável: {professional?.display_name || 'outro profissional'}</Text>
        </View>
      )}

      <ConfirmationDialog
        visible={showCancelDialog}
        title="Cancelar agendamento"
        message="Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita."
        confirmLabel="Cancelar agendamento"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxxxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xxxxxxl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xxxxxxl,
  },
  section: {
    padding: spacing.xxxxxxl,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xxxxxxl,
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.xxxxxxl,
  },
  readOnlyNotice: {
    marginTop: spacing.xxxxxxl,
    marginHorizontal: spacing.xxxxxxl,
    padding: spacing.xxxxxxl,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readOnlyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xxxxxxl,
  },
});
