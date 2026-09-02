import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkWindows, useProfessionalServices, useScheduleOverrides } from '@hooks';
import { colors, spacing } from '@theme';
import ScreenHeader from '@components/base/ScreenHeader';
import Calendar from '@components/base/Calendar';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';
import { isDateAvailable } from '@services/availabilityEngine';
import { format } from 'date-fns';
import type { EffectiveWindow } from '../../supabase/types';

export default function DateSelectionScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { professionalId, serviceId, editAppointmentId } = route.params as {
    professionalId: string;
    serviceId: string;
    editAppointmentId?: string;
  };
  const { windows, loading: schedulesLoading } = useWorkWindows(professionalId);
  const { items: professionalServices, loading: servicesLoading } = useProfessionalServices(professionalId);
  const { overrides, loading: overridesLoading } = useScheduleOverrides(professionalId);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const hasService = useMemo(
    () => professionalServices.some((ps) => ps.service_id === serviceId && ps.is_active),
    [professionalServices, serviceId],
  );

  const overrideMap = useMemo(() => {
    const map = new Map<string, typeof overrides[0]>();
    for (const o of overrides) {
      map.set(o.specific_date, o);
    }
    return map;
  }, [overrides]);

  const checkDateAvailable = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const override = overrideMap.get(dateStr);

      if (override) {
        const effectiveWindows: EffectiveWindow[] = override.is_off
          ? []
          : [{
              window_id: null,
              start_time: override.start_time || '09:00',
              end_time: override.end_time || '18:00',
              is_off: false,
              source: 'override' as const,
            }];
        return isDateAvailable(date, windows, hasService, effectiveWindows);
      }

      return isDateAvailable(date, windows, hasService);
    },
    [windows, hasService, overrideMap],
  );

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleContinue = () => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      navigation.navigate('TimeSlots', { professionalId, serviceId, date: dateStr, editAppointmentId });
    }
  };

  if (schedulesLoading || servicesLoading || overridesLoading) {
    return <LoadingState message="Carregando calendário..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Selecione a data"
        subtitle="Escolha o melhor dia para o atendimento"
      />

      <View style={styles.calendarWrap}>
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          isDateAvailable={checkDateAvailable}
        />
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.gold }]} />
          <Text style={styles.legendLabel}>Disponível</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.disabled }]} />
          <Text style={styles.legendLabel}>Indisponível</Text>
        </View>
      </View>

      {selectedDate && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedText}>
            {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy")}
          </Text>
        </View>
      )}

      {selectedDate && (
        <View style={styles.footer}>
          <Button title="Escolher horário" onPress={handleContinue} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },
  calendarWrap: {
    marginBottom: spacing.lg,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  selectedInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  footer: {
    marginTop: spacing.sm,
  },
});
