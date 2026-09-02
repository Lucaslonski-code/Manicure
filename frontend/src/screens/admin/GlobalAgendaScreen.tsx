import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, useProfessionals } from '@hooks';
import { colors, spacing, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import StatusBadge from '@components/base/StatusBadge';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function GlobalAgendaScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { appointments, loading, error } = useAppointments();
  const { professionals } = useProfessionals();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const confirmed = appointments.filter((a) => a.status === 'confirmed');

  const appointmentDates = useMemo(() => {
    const dates = new Set<string>();
    confirmed.forEach((a) => {
      const d = new Date(a.start_at);
      dates.add(format(d, 'yyyy-MM-dd'));
    });
    return dates;
  }, [confirmed]);

  const selectedDayAppointments = useMemo(() => {
    return confirmed
      .filter((a) => isSameDay(new Date(a.start_at), selectedDay))
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [confirmed, selectedDay]);

  const totalMonthAppointments = useMemo(() => {
    return confirmed.filter((a) => {
      const d = new Date(a.start_at);
      return d >= monthStart && d <= monthEnd;
    }).length;
  }, [confirmed, monthStart, monthEnd]);

  const getProfessionalName = (pid: string) => professionals.find((p) => p.id === pid)?.display_name || 'Prof.';

  const navigateMonth = (dir: 'prev' | 'next') => {
    const newMonth = dir === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
    setCurrentMonth(startOfMonth(newMonth));
  };

  const renderStatus = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
      confirmed: { label: 'Confirmado', variant: 'success' },
      cancelled: { label: 'Cancelado', variant: 'error' },
      completed: { label: 'Concluido', variant: 'default' },
    };
    const s = statusMap[status] || { label: status, variant: 'default' };
    return <StatusBadge label={s.label} variant={s.variant} />;
  };

  if (loading) return <LoadingState message="Carregando agenda..." />;

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
          <Text style={styles.headerTitle}>Agenda Global</Text>
          <Text style={styles.headerSub}>{format(currentMonth, 'MMMM yyyy', { locale: ptBR })} - {totalMonthAppointments} agendamentos</Text>
        </View>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.monthBtn}>
          <AppIcon name="chevron-left" size={16} color="secondary" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</Text>
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.monthBtn}>
          <AppIcon name="chevron-right" size={16} color="secondary" />
        </TouchableOpacity>
      </View>

      {/* Weekday Labels */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>{label}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}
        {daysInMonth.map((day) => {
          const isSelected = isSameDay(day, selectedDay);
          const isCurrentDay = isToday(day);
          const dateKey = format(day, 'yyyy-MM-dd');
          const hasAppointments = appointmentDates.has(dateKey);

          return (
            <TouchableOpacity
              key={dateKey}
              style={[styles.dayCell, isSelected && styles.daySelected, isCurrentDay && !isSelected && styles.dayToday]}
              onPress={() => setSelectedDay(day)}
              activeOpacity={0.6}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected, isCurrentDay && !isSelected && styles.dayTextToday]}>
                {format(day, 'd')}
              </Text>
              {hasAppointments && <View style={[styles.dayDot, isSelected && styles.dayDotSelected]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Appointments */}
      <View style={styles.daySection}>
        <Text style={styles.daySectionTitle}>{format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}</Text>
        {selectedDayAppointments.length === 0 ? (
          <EmptyState title="Nenhum agendamento" description="Nenhum agendamento neste dia." icon="calendar" />
        ) : (
          selectedDayAppointments.map((a) => {
            return (
              <TouchableOpacity
                key={a.id}
                style={styles.card}
                onPress={() => navigation.navigate('PanelAppointmentDetails', { appointmentId: a.id })}
                activeOpacity={0.7}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTime}>{format(parseISO(a.start_at), 'HH:mm')}</Text>
                </View>
                <View style={styles.cardCenter}>
                  <Text style={styles.cardClient} numberOfLines={1}>{getProfessionalName(a.professional_id)}</Text>
                  <Text style={styles.cardService} numberOfLines={1}>{a.client_note || 'Agendamento'}</Text>
                </View>
                <View style={styles.cardRight}>
                  {renderStatus(a.status)}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screenPadding, marginBottom: spacing.xl },
  headerAccent: { width: 3, height: 24, borderRadius: 2, backgroundColor: colors.gold, marginRight: spacing.md },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.screenPadding, marginBottom: spacing.md },
  monthBtn: { padding: spacing.sm },
  monthTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize' as const },
  weekdayRow: { flexDirection: 'row', paddingHorizontal: spacing.screenPadding, marginBottom: 6 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.screenPadding, marginBottom: spacing.xl },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  daySelected: { backgroundColor: colors.gold, borderRadius: radius.md },
  dayToday: { borderWidth: 1.5, borderColor: colors.gold, borderRadius: radius.md },
  dayText: { fontSize: 13, fontWeight: '500', color: colors.textPrimary },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  dayTextToday: { color: colors.gold, fontWeight: '600' },
  dayDot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.success },
  dayDotSelected: { backgroundColor: '#FFFFFF' },
  daySection: { paddingHorizontal: spacing.screenPadding, marginBottom: spacing.xl },
  daySectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, textTransform: 'capitalize' as const },
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
  cardLeft: { width: 44, alignItems: 'flex-start' },
  cardTime: { fontSize: 14, fontWeight: '600', color: colors.gold },
  cardCenter: { flex: 1, marginHorizontal: spacing.sm },
  cardClient: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  cardService: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  cardRight: { marginLeft: spacing.sm },
  errorText: { fontSize: 13, color: colors.error, textAlign: 'center' },
});
