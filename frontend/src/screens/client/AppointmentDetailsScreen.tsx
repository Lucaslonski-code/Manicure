import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointment, useBooking } from '@hooks';
import { colors, spacing, typography } from '@theme';

export default function AppointmentDetailsScreen({ route, navigation }: any) {
  const { appointmentId } = route.params;
  const { appointment, loading } = useAppointment(appointmentId);
  const { cancel, loading: cancelLoading } = useBooking();

  const handleCancel = async () => {
    try {
      await cancel(appointmentId);
      navigation.goBack();
    } catch (err) {
      console.error('Error cancelling:', err);
    }
  };

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes do agendamento</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Data e horário</Text>
        <Text style={styles.value}>
          {format(parseISO(appointment.start_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{appointment.status}</Text>
      </View>

      {appointment.client_note && (
        <View style={styles.section}>
          <Text style={styles.label}>Observação</Text>
          <Text style={styles.value}>{appointment.client_note}</Text>
        </View>
      )}

      {appointment.status === 'confirmed' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={cancelLoading}
        >
          <Text style={styles.cancelButtonText}>
            {cancelLoading ? 'Cancelando...' : 'Cancelar agendamento'}
          </Text>
        </TouchableOpacity>
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
  cancelButton: {
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  cancelButtonText: {
    ...typography.bodyLarge,
    color: colors.background,
    fontWeight: '600',
  },
});
