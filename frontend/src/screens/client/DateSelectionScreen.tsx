import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAvailability, useBlockedTimes } from '@hooks';
import { colors, spacing, typography, radius, elevation } from '@theme';
import Button from '@components/base/Button';
import ScreenHeader from '@components/base/ScreenHeader';

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
        style={[
          styles.dateCard,
          !available && styles.disabled,
          selected && styles.selected,
        ]}
        onPress={() => available && setSelectedDate(format(item, 'yyyy-MM-dd'))}
        disabled={!available}
        accessibilityLabel={`${format(item, 'EEEE', { locale: ptBR })} ${format(item, 'd')} de ${format(item, 'MMMM', { locale: ptBR })}`}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled: !available }}
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
      <ScreenHeader
        title="Selecione a data"
        subtitle="Escolha o melhor dia para o atendimento"
      />
      <FlatList
        data={dates}
        keyExtractor={(item) => format(item, 'yyyy-MM-dd')}
        renderItem={renderDate}
        numColumns={3}
        contentContainerStyle={styles.list}
      />
      {selectedDate && (
        <View style={styles.footer}>
          <Button title="Continuar" onPress={handleContinue} style={styles.continueButton} />
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
    paddingBottom: spacing.xl,
  },
  dateCard: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
    backgroundColor: colors.surface,
    ...elevation.sm,
  },
  disabled: {
    backgroundColor: colors.disabledBackground,
    ...elevation.none,
  },
  selected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    ...elevation.sm,
  },
  day: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  number: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginVertical: spacing.xs,
  },
  month: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  disabledText: {
    color: colors.disabled,
  },
  selectedText: {
    color: colors.surface,
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    ...elevation.sm,
  },
});
