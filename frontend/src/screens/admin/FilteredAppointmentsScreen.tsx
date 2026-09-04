import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, useProfessionals } from '@hooks';
import { colors, spacing, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import StatusBadge from '@components/base/StatusBadge';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';

type FilterType = 'today' | 'confirmed' | 'cancelled' | 'upcoming';

const FILTER_CONFIG: Record<FilterType, { title: string; subtitle: string }> = {
  today: { title: 'Hoje', subtitle: 'Agendamentos do dia' },
  confirmed: { title: 'Confirmados', subtitle: 'Todos confirmados' },
  cancelled: { title: 'Cancelados', subtitle: 'Todos cancelados' },
  upcoming: { title: 'Proximos', subtitle: 'Agendamentos futuros' },
};

export default function FilteredAppointmentsScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { filter } = route.params as { filter: FilterType };
  const { appointments, loading } = useAppointments();
  const { professionals } = useProfessionals();

  const config = FILTER_CONFIG[filter];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const filtered = appointments.filter((a) => {
    switch (filter) {
      case 'today': {
        const d = new Date(a.start_at);
        return d >= todayStart && d < todayEnd;
      }
      case 'confirmed':
        return a.status === 'confirmed';
      case 'cancelled':
        return a.status === 'cancelled';
      case 'upcoming':
        return new Date(a.start_at) > now && a.status === 'confirmed';
      default:
        return true;
    }
  });

  const getProfessionalName = (pid: string) => professionals.find((p) => p.id === pid)?.display_name || 'Prof.';

  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
    confirmed: { label: 'Confirmado', variant: 'success' },
    cancelled: { label: 'Cancelado', variant: 'error' },
    completed: { label: 'Concluido', variant: 'default' },
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = statusMap[item.status] || { label: item.status, variant: 'default' as const };
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PanelAppointmentDetails', { appointmentId: item.id })}
        activeOpacity={0.7}
      >
        <Text style={styles.cardTime}>{format(parseISO(item.start_at), 'HH:mm')}</Text>
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{getProfessionalName(item.professional_id)}</Text>
          <Text style={styles.cardDate}>{format(parseISO(item.start_at), 'dd/MM/yyyy', { locale: ptBR })}</Text>
        </View>
        <StatusBadge label={status.label} variant={status.variant} />
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingState message="Carregando..." />;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AppIcon name="chevron-left" size={20} color="secondary" />
        </TouchableOpacity>
        <View style={styles.topBarTitleWrap}>
          <Text style={styles.topBarTitle}>{config.title}</Text>
          <Text style={styles.topBarSub}>{filtered.length} {filtered.length === 1 ? 'agendamento' : 'agendamentos'}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum agendamento"
          description="Nenhum agendamento encontrado para este filtro."
          icon="calendar"
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: spacing.sm },
  topBarTitleWrap: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  topBarSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  cardTime: { fontSize: 14, fontWeight: '600', color: colors.gold, width: 44 },
  cardBody: { flex: 1, marginHorizontal: spacing.sm },
  cardName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  cardDate: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
});
