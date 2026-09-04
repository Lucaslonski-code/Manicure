import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { useMyAppointments, useProfessionals, useDeleteAppointment } from '@hooks';
import type { Appointment } from '../../supabase/types';
import { colors, spacing, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import ScreenHeader from '@components/base/ScreenHeader';
import StatusBadge from '@components/base/StatusBadge';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import Button from '@components/base/Button';
import ConfirmationDialog from '@components/base/ConfirmationDialog';

export default function MyAppointmentsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { appointments, loading, error, refetch } = useMyAppointments();
  const { professionals } = useProfessionals();
  const { remove } = useDeleteAppointment();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const today = appointments.filter((a) => {
    const d = new Date(a.start_at);
    return d >= todayStart && d < todayEnd && a.status !== 'cancelled';
  });
  const upcoming = appointments.filter((a) => {
    const d = new Date(a.start_at);
    return d >= todayEnd && a.status !== 'cancelled';
  });
  const history = appointments.filter((a) => {
    const d = new Date(a.start_at);
    return d < todayStart || a.status === 'cancelled';
  });

  const getProfessionalName = (pid: string) => professionals.find((p) => p.id === pid)?.display_name || 'Profissional';

  const statusMap: Record<string, { label: string; variant: 'gold' | 'error' | 'default' }> = {
    confirmed: { label: 'Confirmado', variant: 'gold' },
    cancelled: { label: 'Cancelado', variant: 'error' },
    completed: { label: 'Concluído', variant: 'default' },
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget);
      setDeleteTarget(null);
      refetch();
    } catch (err: any) {
      setDeleteTarget(null);
      Alert.alert('Erro ao excluir', err?.message || 'Não foi possível excluir este agendamento.');
    }
  };

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const s = statusMap[item.status] || { label: item.status, variant: 'default' as const };
    const isDeletable = item.status !== 'completed';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardIcon}>
          <AppIcon name={isDeletable ? 'close' : 'calendar'} size={20} color={isDeletable ? 'error' : 'gold'} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.professional} numberOfLines={1}>{getProfessionalName(item.professional_id)}</Text>
          <Text style={styles.date}>{format(parseISO(item.start_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</Text>
        </View>
        <View style={styles.cardActions}>
          <StatusBadge label={s.label} variant={s.variant} />
          {isDeletable && (
            <TouchableOpacity
              style={styles.trashButton}
              onPress={() => setDeleteTarget(item.id)}
              activeOpacity={0.6}
              accessibilityLabel="Excluir agendamento"
            >
              <AppIcon name="delete" size={18} color="error" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: Appointment[], accent?: boolean) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {accent ? <View style={styles.accentDot} /> : null}
        </View>
        {items.map((item) => (
          <View key={item.id}>{renderAppointment({ item } as any)}</View>
        ))}
      </View>
    );
  };

  if (loading) return <LoadingState message="Carregando agendamentos..." />;
  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar novamente" onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
              {renderSection('Hoje', today, true)}
              {renderSection('Próximos', upcoming)}
              {renderSection('Histórico', history)}
            </>
          }
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 72 }]}
        />
      )}

      <ConfirmationDialog
        visible={!!deleteTarget}
        title="Excluir agendamento"
        message="Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  list: { paddingHorizontal: spacing.screenPadding },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', letterSpacing: -0.1, color: colors.textPrimary },
  accentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: { flex: 1, marginRight: 8 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trashButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(166, 61, 64, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  professional: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  date: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  errorText: { fontSize: 13, color: colors.error, textAlign: 'center', marginBottom: 16 },
});
