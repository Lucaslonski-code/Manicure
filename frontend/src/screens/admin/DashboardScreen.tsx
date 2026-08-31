import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, useProfessionals } from '@hooks';
import { colors, spacing, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import StatusBadge from '@components/base/StatusBadge';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ScreenHeader from '@components/base/ScreenHeader';

export default function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) + 16 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Painel" subtitle="Visão do dia" />
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconWrap}><AppIcon name="calendar" size={20} color="gold" /></View>
          <Text style={styles.statValue}>{todayAppointments.length}</Text>
          <Text style={styles.statLabel}>Hoje</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconWrap}><AppIcon name="check" size={20} color="gold" /></View>
          <Text style={styles.statValue}>{confirmed}</Text>
          <Text style={styles.statLabel}>Confirmados</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: 'rgba(166,61,64,0.08)' }]}><AppIcon name="error" size={20} color="error" /></View>
          <Text style={styles.statValue}>{cancelled}</Text>
          <Text style={styles.statLabel}>Cancelados</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconWrap}><AppIcon name="time" size={20} color="gold" /></View>
          <Text style={styles.statValue}>{upcoming}</Text>
          <Text style={styles.statLabel}>Próximos</Text>
        </View>
      </View>

      {nextAppointment && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Próximo atendimento</Text>
            <View style={styles.accentBar} />
          </View>
          {renderAppointment({ item: nextAppointment })}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agendamentos de hoje</Text>
        <View style={styles.sectionGap} />
        {todayAppointments.length === 0 ? (
          <EmptyState title="Nenhum agendamento hoje" description="A agenda de hoje está livre." />
        ) : (
          <FlatList data={todayAppointments} keyExtractor={(item) => item.id} renderItem={({ item }: { item: any }) => renderAppointment({ item })} scrollEnabled={false} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gerenciar</Text>
        <View style={styles.sectionGap} />
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AdminProfessionals')} activeOpacity={0.7}>
            <View style={styles.actionIconWrap}><AppIcon name="people" size={20} color="gold" /></View>
            <Text style={styles.actionLabel}>Profissionais</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AdminServices')} activeOpacity={0.7}>
            <View style={styles.actionIconWrap}><AppIcon name="sparkles" size={20} color="gold" /></View>
            <Text style={styles.actionLabel}>Serviços</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.screenPadding, gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, minWidth: '44%', backgroundColor: colors.surface, borderRadius: radius.card, paddingVertical: 16, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', ...elevation.sm,
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.goldOverlay, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '600', lineHeight: 30, color: colors.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textSecondary, marginTop: 2 },
  section: { marginBottom: 24, paddingHorizontal: spacing.screenPadding },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.1, color: colors.textPrimary },
  accentBar: { width: 3, height: 14, borderRadius: 9999, backgroundColor: colors.gold },
  sectionGap: { height: 12 },
  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...elevation.sm },
  actionIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.goldOverlay, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '500', color: colors.textPrimary, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...elevation.sm },
  cardContent: { flex: 1 },
  professional: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  date: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  errorText: { fontSize: 13, color: colors.error, textAlign: 'center', marginBottom: 16 },
});
