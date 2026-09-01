import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWorkWindows, useBlockedTimes, useProfessionalServices, useScheduleBreaks } from '@hooks';
import { supabase } from '../../supabase/client';
import { colors, spacing, radius, elevation } from '@theme';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ScreenHeader from '@components/base/ScreenHeader';
import { getAvailableSlots, formatSlotTime } from '@services/availabilityEngine';
import type { Appointment } from '../../supabase/types';

export default function TimeSlotsScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { professionalId, serviceId, date, editAppointmentId } = route.params as {
    professionalId: string;
    serviceId: string;
    date: string;
    editAppointmentId?: string;
  };

  const { windows } = useWorkWindows(professionalId);
  const { blockedTimes } = useBlockedTimes(professionalId);
  const { items: professionalServices } = useProfessionalServices(professionalId);
  const { breaks } = useScheduleBreaks(professionalId);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const abortRef = useRef(0);

  const serviceItem = useMemo(
    () => professionalServices.find((ps) => ps.service_id === serviceId && ps.is_active),
    [professionalServices, serviceId],
  );

  const durationMinutes = serviceItem?.duration_minutes ?? 60;

  useEffect(() => {
    let cancelled = false;
    const seq = ++abortRef.current;

    const load = async () => {
      setLoading(true);
      setSelectedTime(null);
      try {
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;
        const { data } = await supabase
          .from('appointments')
          .select('*')
          .eq('professional_id', professionalId)
          .eq('status', 'confirmed')
          .gte('start_at', startOfDay)
          .lte('start_at', endOfDay);
        if (seq === abortRef.current && !cancelled) {
          setAppointments(data || []);
        }
      } catch {
        if (seq === abortRef.current && !cancelled) {
          setAppointments([]);
        }
      } finally {
        if (seq === abortRef.current && !cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [professionalId, date]);

  const slots = useMemo(() => {
    const targetDate = parseISO(date);
    const now = new Date();
    const windowIds = windows.map(w => w.id);
    return getAvailableSlots(targetDate, durationMinutes, windows, blockedTimes, appointments, now, undefined, breaks, windowIds);
  }, [date, durationMinutes, windows, blockedTimes, appointments, breaks]);

  const slotTimeStrings = useMemo(
    () => slots.map((s) => formatSlotTime(s.startMinutes)),
    [slots],
  );

  const handleContinue = () => {
    if (selectedTime) {
      navigation.navigate('BookingSummary', {
        professionalId,
        serviceId,
        date,
        time: selectedTime,
        editAppointmentId,
      });
    }
  };

  const renderSlot = ({ item }: { item: string }) => {
    const selected = selectedTime === item;
    return (
      <TouchableOpacity
        style={[styles.slot, selected && styles.slotSelected]}
        onPress={() => setSelectedTime(item)}
        activeOpacity={0.7}
        accessibilityLabel={`Horário ${item}`}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <Text style={[styles.slotText, selected && styles.slotTextSelected]}>{item}</Text>
      </TouchableOpacity>
    );
  };

  const dateDisplay = format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Horários disponíveis"
        subtitle={dateDisplay}
      />

      {serviceItem && (
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{serviceItem.service.name}</Text>
          <Text style={styles.serviceDuration}>{durationMinutes} min</Text>
        </View>
      )}

      {loading ? (
        <LoadingState message="Calculando horários..." />
      ) : slotTimeStrings.length === 0 ? (
        <EmptyState
          title="Sem horários"
          description="Não há horários disponíveis para esta data. Escolha outra data."
          actionLabel="Voltar ao calendário"
          onAction={() => navigation.goBack()}
        />
      ) : (
        <FlatList
          data={slotTimeStrings}
          keyExtractor={(item) => item}
          renderItem={renderSlot}
          numColumns={3}
          contentContainerStyle={styles.list}
        />
      )}

      {selectedTime && !loading && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button title="Continuar" onPress={handleContinue} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  serviceDuration: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 16,
  },
  slot: {
    flex: 1,
    aspectRatio: 1.8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    backgroundColor: colors.surface,
    ...elevation.sm,
  },
  slotSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  slotTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
