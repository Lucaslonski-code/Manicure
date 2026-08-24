import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfessionalServices, useProfessional } from '@hooks';
import { useBooking } from '@hooks';
import { colors, spacing, typography, radius } from '@theme';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';

export default function BookingSummaryScreen({ route, navigation }: any) {
  const { professionalId, serviceId, date, time } = route.params;
  const { items, loading: servicesLoading } = useProfessionalServices(professionalId);
  const { professional, loading: professionalLoading } = useProfessional(professionalId);
  const { book, loading: bookingLoading } = useBooking();
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

  if (servicesLoading || professionalLoading) {
    return <LoadingState message="Carregando resumo..." />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumo do agendamento</Text>

      <View style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.label}>Profissional</Text>
          <Text style={styles.value}>{professional?.display_name || '—'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>Serviço</Text>
          <Text style={styles.value}>{service?.service.name || '—'}</Text>
          <Text style={styles.duration}>{service?.duration_minutes || 60} minutos</Text>
          {service?.price ? (
            <Text style={styles.price}>R$ {Number(service.price).toFixed(2)}</Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>Data</Text>
          <Text style={styles.value}>
            {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>Horário</Text>
          <Text style={styles.value}>{time}</Text>
        </View>
      </View>

      <View style={styles.noteSection}>
        <Text style={styles.noteLabel}>Observação (opcional)</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Adicione uma observação..."
          placeholderTextColor={colors.textSecondary}
          multiline
          accessibilityLabel="Observação do agendamento"
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.footer}>
        <Button
          title={bookingLoading ? 'Agendando...' : 'Confirmar agendamento'}
          onPress={handleConfirm}
          disabled={bookingLoading}
        />
      </View>
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
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  section: {
    paddingVertical: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  duration: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  price: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  noteSection: {
    marginBottom: spacing.lg,
  },
  noteLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.input,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
  },
});
