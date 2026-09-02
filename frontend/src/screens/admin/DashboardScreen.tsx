import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, useProfessionals } from '@hooks';
import { colors, spacing, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import StatusBadge from '@components/base/StatusBadge';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';

export default function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { appointments, loading, error } = useAppointments();
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

  const getProfessionalName = (pid: string) => professionals.find((p) => p.id === pid)?.display_name || 'Prof.';

  const renderAppointment = ({ item }: { item: any }) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
      confirmed: { label: 'Confirmado', variant: 'success' },
      cancelled: { label: 'Cancelado', variant: 'error' },
      completed: { label: 'Concluido', variant: 'default' },
    };
    const status = statusMap[item.status] || { label: item.status, variant: 'default' };
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

  if (loading) return <LoadingState message="Carregando painel..." />;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: Math.max(insets.bottom, 16) + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerAccent} />
        <View>
          <Text style={styles.headerTitle}>Painel Profissional</Text>
          <Text style={styles.headerSub}>Visao geral</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todayAppointments.length}</Text>
          <Text style={styles.statLabel}>Hoje</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{confirmed}</Text>
          <Text style={styles.statLabel}>Confirmados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.error }]}>{cancelled}</Text>
          <Text style={styles.statLabel}>Cancelados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{upcoming}</Text>
          <Text style={styles.statLabel}>Proximos</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agenda global</Text>
        <View style={styles.sectionGap} />
        {todayAppointments.length === 0 ? (
          <EmptyState title="Nenhum agendamento hoje" description="A agenda de hoje esta livre." icon="calendar" />
        ) : (
          <FlatList
            data={todayAppointments.slice(0, 5)}
            keyExtractor={(item) => item.id}
            renderItem={renderAppointment}
            scrollEnabled={false}
          />
        )}
        {todayAppointments.length > 5 && (
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('PanelGlobalAgenda')}>
            <Text style={styles.viewAllText}>Ver todos ({todayAppointments.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gerenciar</Text>
        <View style={styles.sectionGap} />
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PanelGlobalAgenda')} activeOpacity={0.7}>
            <View style={styles.actionIconWrap}><AppIcon name="calendar" size={18} color="gold" /></View>
            <Text style={styles.actionLabel}>Agenda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PanelScheduleCustomization')} activeOpacity={0.7}>
            <View style={styles.actionIconWrap}><AppIcon name="settings" size={18} color="gold" /></View>
            <Text style={styles.actionLabel}>Personalizar{'\n'}agenda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PanelServices')} activeOpacity={0.7}>
            <View style={styles.actionIconWrap}><AppIcon name="sparkles" size={18} color="gold" /></View>
            <Text style={styles.actionLabel}>Servicos</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  headerAccent: {
    width: 3,
    height: 24,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginRight: spacing.md,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...elevation.sm,
  },
  statValue: { fontSize: 22, fontWeight: '600', lineHeight: 28, color: colors.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3, textTransform: 'uppercase' as const, color: colors.textSecondary, marginTop: 2 },
  section: { marginBottom: 20, paddingHorizontal: spacing.screenPadding },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  sectionGap: { height: 10 },
  actionsGrid: { flexDirection: 'row', gap: 10 },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: { fontSize: 12, fontWeight: '500', color: colors.textPrimary, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
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
  viewAllBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  viewAllText: { fontSize: 13, fontWeight: '500', color: colors.gold },
  errorText: { fontSize: 13, color: colors.error, textAlign: 'center' },
});
