import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths,
  eachDayOfInterval, getDay, isSameDay, isToday, startOfWeek,
  addWeeks, subWeeks, addDays, subDays, startOfYear, endOfYear, isWithinInterval,
  getYear, addYears, subYears, eachMonthOfInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, useProfessionals } from '@hooks';
import { colors, spacing, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import StatusBadge from '@components/base/StatusBadge';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import type { Appointment } from '../../supabase/types';

type ViewMode = 'month' | 'week' | 'day' | 'year';
const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function CompactAppointmentCard({ appointment, professionalName, onPress }: { appointment: Appointment; professionalName: string; onPress: () => void }) {
  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
    confirmed: { label: 'Confirmado', variant: 'success' },
    cancelled: { label: 'Cancelado', variant: 'error' },
    completed: { label: 'Concluido', variant: 'default' },
  };
  const status = statusMap[appointment.status] || { label: appointment.status, variant: 'default' };

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={cardStyles.timeCol}>
        <Text style={cardStyles.time}>{format(parseISO(appointment.start_at), 'HH:mm')}</Text>
        <Text style={cardStyles.timeEnd}>{format(parseISO(appointment.end_at), 'HH:mm')}</Text>
      </View>
      <View style={cardStyles.divider} />
      <View style={cardStyles.infoCol}>
        <Text style={cardStyles.name} numberOfLines={1}>{professionalName}</Text>
        <StatusBadge label={status.label} variant={status.variant} />
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
    overflow: 'hidden',
    ...elevation.sm,
  },
  timeCol: { width: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, backgroundColor: colors.goldOverlay },
  time: { fontSize: 14, fontWeight: '600', color: colors.gold },
  timeEnd: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  divider: { width: 1, backgroundColor: colors.border },
  infoCol: { flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center', gap: 4 },
  name: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});

export default function GlobalAgendaScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { appointments, loading, error } = useAppointments();
  const { professionals } = useProfessionals();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const confirmed = useMemo(() => appointments.filter((a) => a.status === 'confirmed'), [appointments]);

  const getProfessionalName = useCallback((pid: string) => professionals.find((p) => p.id === pid)?.display_name || 'Prof.', [professionals]);

  const appointmentDates = useMemo(() => {
    const dates = new Set<string>();
    confirmed.forEach((a) => {
      dates.add(format(new Date(a.start_at), 'yyyy-MM-dd'));
    });
    return dates;
  }, [confirmed]);

  const selectedDayAppointments = useMemo(() => {
    return confirmed
      .filter((a) => isSameDay(new Date(a.start_at), selectedDay))
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [confirmed, selectedDay]);

  const navigatePrev = useCallback(() => {
    if (viewMode === 'month') setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate((d) => subWeeks(d, 1));
    else if (viewMode === 'day') setCurrentDate((d) => subDays(d, 1));
    else if (viewMode === 'year') setCurrentDate((d) => subYears(d, 1));
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    if (viewMode === 'month') setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate((d) => addWeeks(d, 1));
    else if (viewMode === 'day') setCurrentDate((d) => addDays(d, 1));
    else if (viewMode === 'year') setCurrentDate((d) => addYears(d, 1));
  }, [viewMode]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  }, []);

  const renderMonthView = () => {
    const monthStart_ = startOfMonth(currentDate);
    const monthEnd_ = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart_, end: monthEnd_ });
    const startDayOfWeek_ = getDay(monthStart_);

    return (
      <>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={navigatePrev} style={styles.navBtn}>
            <AppIcon name="chevron-left" size={20} color="secondary" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{format(currentDate, "MMMM yyyy", { locale: ptBR })}</Text>
          <TouchableOpacity onPress={navigateNext} style={styles.navBtn}>
            <AppIcon name="chevron-right" size={20} color="secondary" />
          </TouchableOpacity>
        </View>
        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, i) => (
            <Text key={i} style={styles.weekdayLabel}>{label}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {Array.from({ length: startDayOfWeek_ }).map((_, i) => (
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
                onPress={() => { setSelectedDay(day); setCurrentDate(day); setViewMode('day'); }}
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
        <View style={styles.daySection}>
          <Text style={styles.daySectionTitle}>{format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}</Text>
          {renderAppointmentsList(selectedDayAppointments)}
        </View>
      </>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={navigatePrev} style={styles.navBtn}>
            <AppIcon name="chevron-left" size={20} color="secondary" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{format(weekStart, "dd/MM")} - {format(addDays(weekStart, 6), "dd/MM/yyyy")}</Text>
          <TouchableOpacity onPress={navigateNext} style={styles.navBtn}>
            <AppIcon name="chevron-right" size={20} color="secondary" />
          </TouchableOpacity>
        </View>
        <View style={styles.weekTabs}>
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDay);
            const dateKey = format(day, 'yyyy-MM-dd');
            const hasAppointments = appointmentDates.has(dateKey);
            return (
              <TouchableOpacity
                key={dateKey}
                style={[styles.weekTab, isSelected && styles.weekTabActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.weekTabDay, isSelected && styles.weekTabDayActive]}>{format(day, 'EEE', { locale: ptBR })}</Text>
                <Text style={[styles.weekTabDate, isSelected && styles.weekTabDateActive]}>{format(day, 'd')}</Text>
                {hasAppointments && <View style={[styles.weekTabDot, isSelected && styles.weekTabDotActive]} />}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.daySection}>
          <Text style={styles.daySectionTitle}>{format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}</Text>
          {renderAppointmentsList(confirmed.filter((a) => isSameDay(new Date(a.start_at), selectedDay)).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()))}
        </View>
      </>
    );
  };

  const renderDayView = () => {
    const dayAppointments = confirmed
      .filter((a) => isSameDay(new Date(a.start_at), currentDate))
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

    return (
      <>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={navigatePrev} style={styles.navBtn}>
            <AppIcon name="chevron-left" size={20} color="secondary" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}</Text>
          <TouchableOpacity onPress={navigateNext} style={styles.navBtn}>
            <AppIcon name="chevron-right" size={20} color="secondary" />
          </TouchableOpacity>
        </View>
        <View style={styles.daySection}>
          {renderAppointmentsList(dayAppointments)}
        </View>
      </>
    );
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return (
      <>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={navigatePrev} style={styles.navBtn}>
            <AppIcon name="chevron-left" size={20} color="secondary" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{format(currentDate, 'yyyy')}</Text>
          <TouchableOpacity onPress={navigateNext} style={styles.navBtn}>
            <AppIcon name="chevron-right" size={20} color="secondary" />
          </TouchableOpacity>
        </View>
        <View style={styles.yearGrid}>
          {months.map((month) => {
            const mStart = startOfMonth(month);
            const mEnd = endOfMonth(month);
            const count = confirmed.filter((a) => {
              const d = new Date(a.start_at);
              return isWithinInterval(d, { start: mStart, end: mEnd });
            }).length;
            const isSelected = getYear(month) === getYear(currentDate) && format(month, 'MM') === format(currentDate, 'MM');

            return (
              <TouchableOpacity
                key={format(month, 'yyyy-MM')}
                style={[styles.yearMonthCard, isSelected && styles.yearMonthActive]}
                onPress={() => { setCurrentDate(month); setViewMode('month'); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.yearMonthName, isSelected && styles.yearMonthNameActive]}>
                  {format(month, 'MMM', { locale: ptBR })}
                </Text>
                <Text style={[styles.yearMonthCount, isSelected && styles.yearMonthCountActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </>
    );
  };

  const renderAppointmentsList = (items: Appointment[]) => {
    if (items.length === 0) {
      return <EmptyState title="Nenhum agendamento" description="Nenhum agendamento neste periodo." icon="calendar" />;
    }
    return items.map((a) => (
      <CompactAppointmentCard
        key={a.id}
        appointment={a}
        professionalName={getProfessionalName(a.professional_id)}
        onPress={() => navigation.navigate('PanelAppointmentDetails', { appointmentId: a.id })}
      />
    ));
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
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.topBarHeader}>
          <Text style={styles.topBarTitle}>Agenda Global</Text>
          <TouchableOpacity onPress={goToToday} style={styles.todayBtn}>
            <Text style={styles.todayBtnText}>Hoje</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.viewModeRow}>
          {(['month', 'week', 'day', 'year'] as ViewMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.viewModeBtn, viewMode === mode && styles.viewModeBtnActive]}
              onPress={() => setViewMode(mode)}
            >
              <Text style={[styles.viewModeText, viewMode === mode && styles.viewModeTextActive]}>
                {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : mode === 'day' ? 'Dia' : 'Ano'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'year' && renderYearView()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  topBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.sm },
  topBarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  topBarTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, letterSpacing: -0.3 },
  todayBtn: { backgroundColor: colors.goldOverlay, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.gold },
  todayBtnText: { fontSize: 13, fontWeight: '600', color: colors.gold },
  viewModeRow: { flexDirection: 'row', gap: spacing.xs },
  viewModeBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center', backgroundColor: colors.background },
  viewModeBtnActive: { backgroundColor: colors.gold, },
  viewModeText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  viewModeTextActive: { color: '#FFFFFF' },
  scroll: { flex: 1 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.screenPadding, paddingVertical: spacing.md },
  navBtn: { padding: spacing.sm },
  monthTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize' as const },
  weekdayRow: { flexDirection: 'row', paddingHorizontal: spacing.screenPadding, marginBottom: 6 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.screenPadding, marginBottom: spacing.lg },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  daySelected: { backgroundColor: colors.gold, borderRadius: radius.md },
  dayToday: { borderWidth: 1.5, borderColor: colors.gold, borderRadius: radius.md },
  dayText: { fontSize: 13, fontWeight: '500', color: colors.textPrimary },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  dayTextToday: { color: colors.gold, fontWeight: '600' },
  dayDot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.success },
  dayDotSelected: { backgroundColor: '#FFFFFF' },
  weekTabs: { flexDirection: 'row', paddingHorizontal: spacing.screenPadding, marginBottom: spacing.md, gap: 4 },
  weekTab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  weekTabActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  weekTabDay: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  weekTabDayActive: { color: '#FFFFFF' },
  weekTabDate: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 2 },
  weekTabDateActive: { color: '#FFFFFF' },
  weekTabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.success, marginTop: 4 },
  weekTabDotActive: { backgroundColor: '#FFFFFF' },
  daySection: { paddingHorizontal: spacing.screenPadding, marginBottom: spacing.lg },
  daySectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, textTransform: 'capitalize' as const },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.screenPadding, gap: spacing.sm },
  yearMonthCard: { width: '30%', backgroundColor: colors.surface, borderRadius: radius.card, paddingVertical: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...elevation.sm },
  yearMonthActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  yearMonthName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize' as const },
  yearMonthNameActive: { color: '#FFFFFF' },
  yearMonthCount: { fontSize: 20, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  yearMonthCountActive: { color: '#FFFFFF' },
  errorText: { fontSize: 13, color: colors.error, textAlign: 'center' },
});
