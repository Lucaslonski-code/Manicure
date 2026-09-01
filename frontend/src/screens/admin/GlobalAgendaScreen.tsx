import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { useAppointments, useProfessionals } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import StatusBadge from '@components/base/StatusBadge';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import Button from '@components/base/Button';
import ScreenHeader from '@components/base/ScreenHeader';

export default function GlobalAgendaScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { appointments, loading, error, refetch } = useAppointments();
  const { professionals } = useProfessionals();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const getProfessionalName = (professionalId: string) => {
    return professionals.find((p) => p.id === professionalId)?.display_name || 'Profissional';
  };

  const renderAppointment = ({ item }: { item: any }) => {
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

  if (loading) {
    return <LoadingState message="Carregando agenda..." />;
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24 }] }>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar novamente" onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }] }>
      <ScreenHeader
        title="Agenda Global"
        subtitle="Visão geral de todos os agendamentos"
      />
      {appointments.length === 0 ? (
        <EmptyState title="Nenhum agendamento" description="Não há agendamentos cadastrados." />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
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
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xxxxxxl,
  },
});
