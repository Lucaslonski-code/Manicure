import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointment, useBooking, useProfessionals } from '@hooks';
import { colors, spacing, typography, radius } from '@theme';
import Button from '@components/base/Button';
import DangerButton from '@components/base/DangerButton';
import StatusBadge from '@components/base/StatusBadge';
import Divider from '@components/base/Divider';
import ConfirmationDialog from '@components/base/ConfirmationDialog';

export default function AppointmentDetailsScreen({ route, navigation }: any) {
  const { appointmentId } = route.params;
  const { appointment, loading } = useAppointment(appointmentId);
  const { cancel, loading: cancelLoading } = useBooking();
  const { professionals } = useProfessionals();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const professional = appointment ? professionals.find((p) => p.id === appointment.professional_id) : null;

  const handleCancel = async () => {
    try {
      await cancel(appointmentId);
      setShowCancelDialog(false);
      navigation.goBack();
    } catch {
      setShowCancelDialog(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.center}>
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Detalhes do agendamento</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Profissional</Text>
          <Text style={styles.value}>{professional?.display_name || '—'}</Text>
        </View>
        <Divider />
        <View style={styles.row}>
          <Text style={styles.label}>Data</Text>
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
              <Text style={styles.label}>Observação</Text>
              <Text style={styles.value}>{appointment.client_note}</Text>
            </View>
          </>
        )}
      </View>

      {appointment.status === 'confirmed' && (
        <View style={styles.actions}>
          <DangerButton
            title="Cancelar agendamento"
            onPress={() => setShowCancelDialog(true)}
            disabled={cancelLoading}
          />
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
    padding: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.headingLarge,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  section: {
    padding: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
