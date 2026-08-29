import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMyAppointments, useProfessionals } from '@hooks';
import type { Appointment } from '../../supabase/types';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import ScreenHeader from '@components/base/ScreenHeader';
import StatusBadge from '@components/base/StatusBadge';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import Button from '@components/base/Button';

export default function MyAppointmentsScreen({ navigation }: any) {
  const { appointments, loading, error, refetch } = useMyAppointments();
  const { professionals } = useProfessionals();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const today = appointments.filter((a) => {
    const d = new Date(a.start_at);
    return d >= todayStart && d < todayEnd;
  });

  const upcoming = appointments.filter((a) => {
    const d = new Date(a.start_at);
    return d >= todayEnd && a.status !== 'cancelled';
  });

  const history = appointments.filter((a) => {
    const d = new Date(a.start_at);
    return d < todayStart || a.status === 'cancelled';
  });

  const getProfessionalName = (professionalId: string) => {
    return professionals.find((p) => p.id === professionalId)?.display_name || 'Profissional';
  };

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' | 'gold' }> = {
      confirmed: { label: 'Confirmado', variant: 'gold' as const },
      cancelled: { label: 'Cancelado', variant: 'error' as const },
      completed: { label: 'Concluído', variant: 'default' as const },
    };
    const status = statusMap[item.status] || { label: item.status, variant: 'default' as const };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item.id })}
      >
        <View style={styles.cardIconContainer}>
          <AppIcon name="calendar" size={iconSizes.md} color="gold" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.professional}>{getProfessionalName(item.professional_id)}</Text>
          <Text style={styles.date}>
            {format(parseISO(item.start_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
        </View>
        <StatusBadge label={status.label} variant={status.variant} />
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: Appointment[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.section}>
        <ScreenHeader title={title} accent={title === 'Hoje'} />
        {items.map((item) => renderAppointment({ item }))}
      </View>
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
      <ScreenHeader title="Meus agendamentos" />

      {appointments.length === 0 ? (
        <EmptyState
          title="Nenhum agendamento"
          description="Você ainda não tem agendamentos."
          actionLabel="Agendar horário"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {renderSection('Hoje', today)}
              {renderSection('Próximos', upcoming)}
              {renderSection('Histórico', history)}
            </>
          }
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
    padding: spacing.xxxxxxl,
  },
  section: {
    marginBottom: spacing.xxxxxxl,
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    marginBottom: spacing.xxxxxxl,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xxxxxxl,
  },
  cardContent: {
    flex: 1,
  },
  professional: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  date: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xxxxxxl,
  },
});
