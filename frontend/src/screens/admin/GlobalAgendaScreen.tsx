import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, useProfessionals } from '@hooks';
import { colors, spacing, typography, radius } from '@theme';
import StatusBadge from '@components/base/StatusBadge';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import Button from '@components/base/Button';

export default function GlobalAgendaScreen({ navigation }: any) {
  const { appointments, loading, error, refetch } = useAppointments();
  const { professionals } = useProfessionals();

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
    return <LoadingState message="Carregando agenda..." />;
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
        <Text style={styles.title}>Agenda Global</Text>
        <Text style={styles.subtitle}>Visão geral de todos os agendamentos</Text>
      </View>

      {appointments.length === 0 ? (
        <EmptyState title="Nenhum agendamento" description="Não há agendamentos cadastrados." />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={styles.list}
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
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
