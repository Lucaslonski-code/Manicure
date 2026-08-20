import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../supabase/client';
import { colors, spacing, typography } from '@theme';

export default function TimeSlotsScreen({ route, navigation }: any) {
  const { professionalId, serviceId, date } = route.params;
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    loadSlots();
  }, [professionalId, serviceId, date]);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_professional_id: professionalId,
        p_service_id: serviceId,
        p_date: date,
      });

      if (error) throw error;

      const availableTimes = (data || []).map((slot: any) => {
        const start = parseISO(slot.start_at);
        return format(start, 'HH:mm');
      });

      setSlots(availableTimes);
    } catch (err) {
      console.error('Error loading slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedTime) {
      navigation.navigate('BookingSummary', { professionalId, serviceId, date, time: selectedTime });
    }
  };

  const renderSlot = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.slot, selectedTime === item && styles.selected]}
      onPress={() => setSelectedTime(item)}
    >
      <Text style={[styles.slotText, selectedTime === item && styles.selectedText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Horários disponíveis</Text>
      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : slots.length === 0 ? (
        <Text style={styles.empty}>Nenhum horário disponível para esta data.</Text>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item) => item}
          renderItem={renderSlot}
          numColumns={3}
          contentContainerStyle={styles.list}
        />
      )}
      {selectedTime && (
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.headingLarge,
    padding: spacing.lg,
  },
  loading: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  empty: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  list: {
    padding: spacing.lg,
  },
  slot: {
    flex: 1,
    aspectRatio: 1.5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  selectedText: {
    color: colors.background,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.bodyLarge,
    color: colors.background,
    fontWeight: '600',
  },
});
