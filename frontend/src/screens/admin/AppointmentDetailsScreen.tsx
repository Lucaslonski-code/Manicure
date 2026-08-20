import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointment, useProfessionals, useBooking } from '@hooks';
import { colors, spacing, typography } from '@theme';

export default function AppointmentDetailsScreen({ route }: any) {
  const { appointmentId } = route.params;
  const { appointment, loading } = useAppointment(appointmentId);
  const { professionals } = useProfessionals();
  const { cancelByAdmin, remove, loading: actionLoading } = useBooking();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Carregando...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Agendamento não encontrado.</Text>
      </View>
    );
  }

  const professional = professionals.find(p => p.id === appointment.professional_id);
  const isOwner = true; // In real app, check if current admin owns this professional

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes do agendamento</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Profissional</Text>
        <Text style={styles.value}>{professional?.display_name || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Data e horário</Text>
        <Text style={styles.value}>
          {format(parseISO(appointment.start_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>
          {appointment.status === 'confirmed' ? 'Confirmado' : appointment.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
        </Text>
      </View>

      {appointment.client_note && (
        <View style={styles.section}>
          <Text style={styles.label}>Observação da cliente</Text>
          <Text style={styles.value}>{appointment.client_note}</Text>
        </View>
      )}

      {appointment.admin_note && (
        <View style={styles.section}>
          <Text style={styles.label}>Observação admin</Text>
          <Text style={styles.value}>{appointment.admin_note}</Text>
        </View>
      )}

      {isOwner && appointment.status === 'confirmed' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => cancelByAdmin(appointmentId, 'Cancelado pelo admin')}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>
              {actionLoading ? 'Cancelando...' : 'Cancelar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => remove(appointmentId)}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>
              {actionLoading ? 'Excluindo...' : 'Excluir'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  loading: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  error: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.error,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.bodyLarge,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    ...typography.bodyLarge,
    color: colors.background,
    fontWeight: '600',
  },
});
