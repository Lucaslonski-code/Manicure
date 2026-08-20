import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAvailability, useBlockedTimes } from '@hooks';
import { colors, spacing, typography } from '@theme';

export default function DateSelectionScreen({ route, navigation }: any) {
  const { professionalId, serviceId } = route.params;
  const { availability } = useAvailability(professionalId);
  const { blockedTimes } = useBlockedTimes(professionalId);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  const isDateAvailable = (date: Date) => {
    const weekday = date.getDay();
    const hasAvailability = availability.some(a => a.weekday === weekday);
    if (!hasAvailability) return false;

    const hasBlock = blockedTimes.some(b => {
      const blockDate = new Date(b.start_at);
      return isSameDay(blockDate, date);
    });

    return !hasBlock;
  };

  const renderDate = ({ item }: { item: Date }) => {
    const available = isDateAvailable(item);
    const selected = selectedDate === format(item, 'yyyy-MM-dd');

    return (
      <TouchableOpacity
        style={[styles.dateCard, !available && styles.disabled, selected && styles.selected]}
        onPress={() => available && setSelectedDate(format(item, 'yyyy-MM-dd'))}
        disabled={!available}
      >
        <Text style={[styles.day, !available && styles.disabledText, selected && styles.selectedText]}>
          {format(item, 'EEE', { locale: ptBR })}
        </Text>
        <Text style={[styles.number, !available && styles.disabledText, selected && styles.selectedText]}>
          {format(item, 'd')}
        </Text>
        <Text style={[styles.month, !available && styles.disabledText, selected && styles.selectedText]}>
          {format(item, 'MMM', { locale: ptBR })}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleContinue = () => {
    if (selectedDate) {
      navigation.navigate('TimeSlots', { professionalId, serviceId, date: selectedDate });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecione a data</Text>
      <FlatList
        data={dates}
        keyExtractor={(item) => format(item, 'yyyy-MM-dd')}
        renderItem={renderDate}
        numColumns={3}
        contentContainerStyle={styles.list}
      />
      {selectedDate && (
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
  list: {
    padding: spacing.lg,
  },
  dateCard: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
  },
  disabled: {
    opacity: 0.3,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  day: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  number: {
    ...typography.headingMedium,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  month: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  disabledText: {
    color: colors.textSecondary,
  },
  selectedText: {
    color: colors.background,
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
