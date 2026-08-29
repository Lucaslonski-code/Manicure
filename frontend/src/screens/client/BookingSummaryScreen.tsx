import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfessionalServices, useProfessional } from '@hooks';
import { useBooking } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';
import ScreenHeader from '@components/base/ScreenHeader';

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
      <ScreenHeader title="Resumo do agendamento" />
      <View style={styles.summaryCard}>
        <View style={styles.section}>
          <View style={styles.labelRow}>
          <AppIcon name="user" size={iconSizes.sm} color="gold" />
            <Text style={styles.label}>Profissional</Text>
          </View>
          <Text style={styles.value}>{professional?.display_name || '—'}</Text>
        </View>

        <Divider gold />

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <AppIcon name="sparkles" size={iconSizes.sm} color="gold" />
            <Text style={styles.label}>Serviço</Text>
          </View>
          <Text style={styles.value}>{service?.service.name || '—'}</Text>
          <Text style={styles.duration}>{service?.duration_minutes || 60} minutos</Text>
          {service?.price ? (
            <Text style={styles.price}>R$ {Number(service.price).toFixed(2)}</Text>
          ) : null}
        </View>

        <Divider gold />

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <AppIcon name="calendar" size={iconSizes.sm} color="gold" />
            <Text style={styles.label}>Data</Text>
          </View>
          <Text style={styles.value}>
            {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
        </View>

        <Divider gold />

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <AppIcon name="time" size={iconSizes.sm} color="gold" />
            <Text style={styles.label}>Horário</Text>
          </View>
          <Text style={styles.value}>{time}</Text>
        </View>
      </View>

      <View style={styles.noteSection}>
        <View style={styles.labelRow}>
          <AppIcon name="document-text" size={iconSizes.sm} color="gold" />
          <Text style={styles.noteLabel}>Observação (opcional)</Text>
        </View>
        <TextInput
          style={styles.noteInput}
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
          loading={bookingLoading}
          style={styles.confirmButton}
        />
      </View>
    </View>
  );
}

const Divider = ({ gold = false }: { gold?: boolean }) => (
  <View style={[styles.divider, gold && styles.dividerGold]} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.screenPadding,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xxxxxxl,
    ...elevation.sm,
  },
  section: {
    paddingVertical: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  duration: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  price: {
    ...typography.bodySmall,
    color: colors.gold,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xxxxxxl,
  },
  dividerGold: {
    backgroundColor: colors.goldLight,
    opacity: 0.4,
  },
  noteSection: {
    marginBottom: spacing.xxxxxxl,
  },
  noteLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.xxxxxxl,
    ...typography.input,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.xxxxxxl,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
  },
  confirmButton: {
    ...elevation.sm,
  },
});
