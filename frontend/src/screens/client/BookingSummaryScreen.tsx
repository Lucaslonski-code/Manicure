import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfessionalServices, useProfessional, useBooking } from '@hooks';
import { colors, spacing, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';
import ScreenHeader from '@components/base/ScreenHeader';

function SummaryDivider() {
  return <View style={styles.divider} />;
}

export default function BookingSummaryScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { professionalId, serviceId, date, time } = route.params;
  const { items, loading: servicesLoading } = useProfessionalServices(professionalId);
  const { professional, loading: professionalLoading } = useProfessional(professionalId);
  const { book, loading: bookingLoading } = useBooking();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const service = items.find((i) => i.service_id === serviceId);
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 12}
    >
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Resumo do agendamento" />

        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.labelRow}>
                <AppIcon name="user" size={16} color="gold" />
                <Text style={styles.label}>Profissional</Text>
              </View>
              <Text style={styles.value} numberOfLines={1}>{professional?.display_name || '—'}</Text>
            </View>
            <SummaryDivider />
            <View style={styles.row}>
              <View style={styles.labelRow}>
                <AppIcon name="sparkles" size={16} color="gold" />
                <Text style={styles.label}>Serviço</Text>
              </View>
              <Text style={styles.value} numberOfLines={2}>{service?.service.name || '—'}</Text>
              <Text style={styles.meta}>{service?.duration_minutes || 60} minutos</Text>
              {service?.price ? <Text style={styles.price}>R$ {Number(service.price).toFixed(2)}</Text> : null}
            </View>
            <SummaryDivider />
            <View style={styles.row}>
              <View style={styles.labelRow}>
                <AppIcon name="calendar" size={16} color="gold" />
                <Text style={styles.label}>Data</Text>
              </View>
              <Text style={styles.value}>{format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</Text>
            </View>
            <SummaryDivider />
            <View style={styles.row}>
              <View style={styles.labelRow}>
                <AppIcon name="time" size={16} color="gold" />
                <Text style={styles.label}>Horário</Text>
              </View>
              <Text style={styles.value}>{time}</Text>
            </View>
          </View>
        </View>

        <View style={styles.noteWrap}>
          <View style={styles.labelRow}>
            <AppIcon name="document-text" size={16} color="gold" />
            <Text style={styles.noteLabel}>Observação (opcional)</Text>
          </View>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Adicione uma observação..."
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
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
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  cardWrap: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  row: {
    paddingVertical: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  noteWrap: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 16,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: 14,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    minHeight: 80,
    backgroundColor: colors.surface,
    marginTop: 8,
  },
  error: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: 8,
  },
});
