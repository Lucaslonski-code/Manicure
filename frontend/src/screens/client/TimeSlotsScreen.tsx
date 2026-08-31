import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../supabase/client';
import { colors, spacing, elevation } from '@theme';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ErrorState from '@components/base/ErrorState';
import ScreenHeader from '@components/base/ScreenHeader';

export default function TimeSlotsScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { professionalId, serviceId, date } = route.params;
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    loadSlots();
  }, [professionalId, serviceId, date]);

  const loadSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_professional_id: professionalId,
        p_service_id: serviceId,
        p_date: date,
      });
      if (error) throw error;
      const availableTimes = (data || []).map((slot: any) => format(parseISO(slot.start_at), 'HH:mm'));
      setSlots(availableTimes);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar horários');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedTime) {
      navigation.navigate('BookingSummary', { professionalId, serviceId, date, time: selectedTime });
    }
  };

  const renderSlot = ({ item }: { item: string }) => {
    const selected = selectedTime === item;
    return (
      <TouchableOpacity
        style={[styles.slot, selected && styles.selected]}
        onPress={() => setSelectedTime(item)}
        activeOpacity={0.7}
        accessibilityLabel={`Horário ${item}`}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <Text style={[styles.slotText, selected && styles.selectedText]}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Horários disponíveis"
        subtitle={format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      />
      {loading ? (
        <LoadingState message="Buscando horários disponíveis..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSlots} />
      ) : slots.length === 0 ? (
        <EmptyState
          title="Sem horários"
          description="Não há horários disponíveis para esta data."
          actionLabel="Escolher outra data"
          onAction={() => navigation.goBack()}
        />
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item) => item}
          renderItem={renderSlot}
          numColumns={3}
          contentContainerStyle={styles.list}
        />
      )}

      {selectedTime && !loading && !error && (
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
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 16,
  },
  slot: {
    flex: 1,
    aspectRatio: 1.8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    backgroundColor: colors.surface,
    ...elevation.sm,
  },
  selected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  selectedText: {
    color: colors.surface,
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
