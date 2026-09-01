import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointment, useBooking, useProfessionals, useServices } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Button from '@components/base/Button';
import DangerButton from '@components/base/DangerButton';
import StatusBadge from '@components/base/StatusBadge';
import ConfirmationDialog from '@components/base/ConfirmationDialog';
import ScreenHeader from '@components/base/ScreenHeader';

export default function AppointmentDetailsScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { appointmentId } = route.params;
  const { appointment, loading, refetch } = useAppointment(appointmentId);
  const { cancel, loading: cancelLoading } = useBooking();
  const { professionals } = useProfessionals();
  const { services } = useServices();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const professional = appointment ? professionals.find((p) => p.id === appointment.professional_id) : null;
  const service = appointment ? services.find((s) => s.id === appointment.service_id) : null;

  const handleCancel = async () => {
    try {
      await cancel(appointmentId);
      setShowCancelDialog(false);
      refetch();
    } catch {
      setShowCancelDialog(false);
    }
  };

  const handleEditProfessional = () => {
    if (!appointment) return;
    navigation.navigate('ServiceSelection', { professionalId: appointment.professional_id, editAppointmentId: appointmentId });
  };

  const handleEditService = () => {
    if (!appointment) return;
    navigation.navigate('ServiceSelection', { professionalId: appointment.professional_id, editAppointmentId: appointmentId });
  };

  const handleEditDateTime = () => {
    if (!appointment) return;
    navigation.navigate('DateSelection', {
      professionalId: appointment.professional_id,
      serviceId: appointment.service_id,
      editAppointmentId: appointmentId,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Agendamento não encontrado.</Text>
        <Button title="Voltar" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const statusMap: Record<string, { label: string; variant: 'gold' | 'error' | 'default' }> = {
    confirmed: { label: 'Confirmado', variant: 'gold' },
    cancelled: { label: 'Cancelado', variant: 'error' },
    completed: { label: 'Concluído', variant: 'default' },
  };
  const status = statusMap[appointment.status] || { label: appointment.status, variant: 'default' };
  const isConfirmed = appointment.status === 'confirmed';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) + 16 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Detalhes do agendamento" />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconLabelRow}>
            <AppIcon name="user" size={iconSizes.sm} color="gold" />
            <Text style={styles.label}>Profissional</Text>
          </View>
          <Text style={styles.value} numberOfLines={1}>{professional?.display_name || '—'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.iconLabelRow}>
            <AppIcon name="sparkles" size={iconSizes.sm} color="gold" />
            <Text style={styles.label}>Serviço</Text>
          </View>
          <Text style={styles.value} numberOfLines={1}>{service?.name || '—'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.iconLabelRow}>
            <AppIcon name="calendar" size={iconSizes.sm} color="gold" />
            <Text style={styles.label}>Data e horário</Text>
          </View>
          <Text style={styles.value} numberOfLines={1}>
            {format(parseISO(appointment.start_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.iconLabelRow}>
            <AppIcon name="check" size={iconSizes.sm} color="gold" />
            <Text style={styles.label}>Status</Text>
          </View>
          <StatusBadge label={status.label} variant={status.variant} />
        </View>
        {appointment.client_note && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <View style={styles.iconLabelRow}>
                <AppIcon name="document-text" size={iconSizes.sm} color="gold" />
                <Text style={styles.label}>Observação</Text>
              </View>
              <Text style={styles.noteText}>{appointment.client_note}</Text>
            </View>
          </>
        )}
      </View>

      {/* Edit section — only for confirmed appointments */}
      {isConfirmed && (
        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>Editar agendamento</Text>

          <TouchableOpacity
            style={styles.editOption}
            onPress={handleEditProfessional}
            activeOpacity={0.7}
          >
            <View style={styles.editOptionLeft}>
              <View style={styles.editIconWrap}>
                <AppIcon name="user" size={18} color="gold" />
              </View>
              <View>
                <Text style={styles.editOptionTitle}>Profissional</Text>
                <Text style={styles.editOptionDesc} numberOfLines={1}>{professional?.display_name}</Text>
              </View>
            </View>
            <AppIcon name="chevron-right" size={18} color="secondary" />
          </TouchableOpacity>

          <View style={styles.editDivider} />

          <TouchableOpacity
            style={styles.editOption}
            onPress={handleEditService}
            activeOpacity={0.7}
          >
            <View style={styles.editOptionLeft}>
              <View style={styles.editIconWrap}>
                <AppIcon name="sparkles" size={18} color="gold" />
              </View>
              <View>
                <Text style={styles.editOptionTitle}>Serviço</Text>
                <Text style={styles.editOptionDesc} numberOfLines={1}>{service?.name}</Text>
              </View>
            </View>
            <AppIcon name="chevron-right" size={18} color="secondary" />
          </TouchableOpacity>

          <View style={styles.editDivider} />

          <TouchableOpacity
            style={styles.editOption}
            onPress={handleEditDateTime}
            activeOpacity={0.7}
          >
            <View style={styles.editOptionLeft}>
              <View style={styles.editIconWrap}>
                <AppIcon name="calendar" size={18} color="gold" />
              </View>
              <View>
                <Text style={styles.editOptionTitle}>Data e horário</Text>
                <Text style={styles.editOptionDesc} numberOfLines={1}>
                  {format(parseISO(appointment.start_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </Text>
              </View>
            </View>
            <AppIcon name="chevron-right" size={18} color="secondary" />
          </TouchableOpacity>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {isConfirmed && (
          <DangerButton title="Cancelar agendamento" onPress={() => setShowCancelDialog(true)} disabled={cancelLoading} />
        )}
      </View>

      <ConfirmationDialog
        visible={showCancelDialog}
        title="Cancelar agendamento"
        message="Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita."
        confirmLabel="Cancelar agendamento"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
        destructive
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.screenPadding,
    overflow: 'hidden',
    ...elevation.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, minHeight: 52 },
  divider: { height: 1, backgroundColor: colors.border, opacity: 0.6, marginHorizontal: 16 },
  iconLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  section: { padding: 16 },
  label: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: '500', color: colors.textPrimary, flexShrink: 1, textAlign: 'right', maxWidth: 180 },
  noteText: { fontSize: 13, color: colors.textPrimary, marginTop: 8, lineHeight: 20 },
  editSection: {
    marginHorizontal: spacing.screenPadding,
    marginTop: 20,
  },
  editSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  editOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    ...elevation.sm,
  },
  editOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  editIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  editOptionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editDivider: { height: 8 },
  actions: { paddingHorizontal: spacing.screenPadding, marginTop: 20 },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  errorText: { ...typography.bodySmall, color: colors.error, textAlign: 'center', marginBottom: 16 },
});
