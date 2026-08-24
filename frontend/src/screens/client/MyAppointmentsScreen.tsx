import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMyAppointments, useProfessionals } from '@hooks';
import { colors, spacing, typography, radius } from '@theme';
import SectionHeader from '@components/base/SectionHeader';
import StatusBadge from '@components/base/StatusBadge';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import Button from '@components/base/Button';

export default function MyAppointmentsScreen({ navigation }: any) {
  const { appointments, loading, error, refetch } = useMyAppointments();
  const { professionals } = useProfessionals();

  const now = new Date();

  const upcoming = appointments.filter((a) => {
    const d = new Date(a.start_at);
    return d > now && a.status !== 'cancelled';
  });

  const getProfessionalName = (professionalId: string) => {
    return professionals.find((p) => p.id === professionalId)?.display_name || 'Profissional';
  };

  const renderAppointment = ({ item }: { item: any }) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
      confirmed: { label: 'Confirmado', variant: 'success' },
      cancelled: { label: 'Cancelado', variant: 'error' },
      completed: { label: 'Concluído', variant: 'default' },
    };
    const status = statusMap[item.status] || { label: item.status, variant: 'default' };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.professional}>{getProfessionalName(item.professional_id)}</Text>
          <StatusBadge label={status.label} variant={status.variant} />
        </View>
        <Text style={styles.date}>
          {format(parseISO(item.start_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingState message="Carregando agendamentos..." />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar novamente" onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus agendamentos</Text>
      </View>

      {appointments.length === 0 ? (
        <EmptyState
          title="Nenhum agendamento"
          description="Você ainda não tem agendamentos."
          actionLabel="Agendar horário"
          onAction={() => navigation.navigate('ServiceSelection', { professionalId: '' })}
        />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            upcoming.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Próximos" />
                {upcoming.map((item) => renderAppointment({ item }))}
              </View>
            ) : null
          }
        />
      )}
    </View>
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
  section: {
    marginBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  professional: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  date: {
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
