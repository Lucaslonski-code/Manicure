import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfessionalServices, useProfessional } from '@hooks';
import { useBooking } from '@hooks';
import { colors, spacing, typography } from '@theme';

export default function BookingSummaryScreen({ route, navigation }: any) {
  const { professionalId, serviceId, date, time } = route.params;
  const { items } = useProfessionalServices(professionalId);
  const { professional } = useProfessional(professionalId);
  const { book, loading } = useBooking();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const service = items.find(i => i.service_id === serviceId);
  const startAt = `${date}T${time}:00`;

  const handleConfirm = async () => {
    try {
      setError(null);
      await book(professionalId, serviceId, startAt, note || undefined);
      navigation.replace('BookingConfirmation');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar agendamento');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumo do agendamento</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Profissional</Text>
        <Text style={styles.value}>{professional?.display_name || 'Carregando...'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Serviço</Text>
        <Text style={styles.value}>{service?.service.name || 'Carregando...'}</Text>
        <Text style={styles.duration}>{service?.duration_minutes || 60} minutos</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Data</Text>
        <Text style={styles.value}>
          {format(parseISO(date), "dd/MM/yyyy", { locale: ptBR })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Horário</Text>
        <Text style={styles.value}>{time}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Observação (opcional)</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Adicione uma observação..."
          placeholderTextColor={colors.textSecondary}
          multiline
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleConfirm} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Agendando...' : 'Confirmar agendamento'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.headingLarge,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.bodyLarge,
    color: colors.text,
  },
  duration: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.bodyMedium,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: {
    ...typography.bodyLarge,
    color: colors.background,
    fontWeight: '600',
  },
});
