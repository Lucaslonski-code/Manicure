import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, useProfessionals } from '@hooks';
import { colors, spacing, typography, radius } from '@theme';
import SectionHeader from '@components/base/SectionHeader';
import StatusBadge from '@components/base/StatusBadge';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';

export default function DashboardScreen({ navigation }: any) {
  const { appointments, loading, error, refetch } = useAppointments();
  const { professionals } = useProfessionals();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.start_at);
    return d >= todayStart && d < todayEnd;
  });

  const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
  const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
  const upcoming = appointments.filter((a) => new Date(a.start_at) > now && a.status === 'confirmed').length;

  const nextAppointment = appointments
    .filter((a) => new Date(a.start_at) > now && a.status === 'confirmed')
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())[0];

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
    return <LoadingState message="Carregando painel..." />;
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Painel</Text>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statValue}>{todayAppointments.length}</Text>
          <Text style={styles.statLabel}>Hoje</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statValue}>{confirmed}</Text>
          <Text style={styles.statLabel}>Confirmados</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statValue}>{cancelled}</Text>
          <Text style={styles.statLabel}>Cancelados</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statValue}>{upcoming}</Text>
          <Text style={styles.statLabel}>Próximos</Text>
        </View>
      </View>

      {nextAppointment && (
        <View style={styles.section}>
          <SectionHeader title="Próximo atendimento" subtitle="Não perca" />
          {renderAppointment({ item: nextAppointment })}
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader title="Agendamentos de hoje" />
        {todayAppointments.length === 0 ? (
          <EmptyState title="Nenhum agendamento hoje" />
        ) : (
          <FlatList
            data={todayAppointments}
            keyExtractor={(item) => item.id}
            renderItem={renderAppointment}
            scrollEnabled={false}
          />
        )}
      </View>
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
  title: {
    ...typography.display,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: {
    ...typography.headingLarge,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
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
