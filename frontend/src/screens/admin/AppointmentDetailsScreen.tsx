import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointment, useProfessionals, useMyProfessional, useBooking, useServices } from '@hooks';
import { fetchUserById } from '../../services/api';
import { colors, spacing, typography, radius, elevation } from '@theme';
import StatusBadge from '@components/base/StatusBadge';
import Button from '@components/base/Button';
import DangerButton from '@components/base/DangerButton';
import LoadingState from '@components/base/LoadingState';
import ConfirmationDialog from '@components/base/ConfirmationDialog';
import AppIcon from '@components/icons/AppIcon';

export default function AppointmentDetailsScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { appointmentId } = route.params;
  const { appointment, loading, refetch } = useAppointment(appointmentId);
  const { professionals } = useProfessionals();
  const { services } = useServices();
  const { professional: myProfessional } = useMyProfessional();
  const { cancelByAdmin, removeCancelledByAdmin } = useBooking();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ full_name?: string; phone?: string; email?: string } | null>(null);

  const professional = appointment ? professionals.find((p) => p.id === appointment.professional_id) : null;
  const service = appointment ? services.find((s) => s.id === appointment.service_id) : null;
  const isOwner = myProfessional?.id === appointment?.professional_id;

  useEffect(() => {
    if (appointment?.client_user_id) {
      fetchUserById(appointment.client_user_id).then(setClientInfo).catch(() => {});
    }
  }, [appointment?.client_user_id]);

  const handleCancel = async () => {
    try {
      await cancelByAdmin(appointmentId);
      setShowCancelDialog(false);
      await refetch();
    } catch (err: any) {
      setShowCancelDialog(false);
      Alert.alert('Erro ao cancelar', err?.message || 'Nao foi possivel cancelar este agendamento.');
    }
  };

  const handleDelete = async () => {
    try {
      await removeCancelledByAdmin(appointmentId);
      setShowDeleteDialog(false);
      navigation.goBack();
    } catch (err: any) {
      setShowDeleteDialog(false);
      Alert.alert('Erro ao excluir', err?.message || 'Nao foi possivel excluir este agendamento.');
    }
  };

  if (loading) return <LoadingState message="Carregando detalhes..." />;

  if (!appointment) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.errorText}>Agendamento nao encontrado.</Text>
        <Button title="Voltar" onPress={() => navigation.goBack()} style={styles.backToListBtn} />
      </View>
    );
  }

  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
    confirmed: { label: 'Confirmado', variant: 'success' },
    cancelled: { label: 'Cancelado', variant: 'error' },
    completed: { label: 'Concluido', variant: 'default' },
  };
  const status = statusMap[appointment.status] || { label: appointment.status, variant: 'default' };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AppIcon name="chevron-left" size={20} color="secondary" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Detalhes do agendamento</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Profissional</Text>
            <Text style={styles.value}>{professional?.display_name || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Servico</Text>
            <Text style={styles.value}>{service?.name || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Data e horario</Text>
            <Text style={styles.value}>{format(parseISO(appointment.start_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <StatusBadge label={status.label} variant={status.variant} />
          </View>
          {clientInfo && (
            <>
              <View style={styles.divider} />
              <View style={styles.noteSection}>
                <Text style={styles.label}>Cliente</Text>
                <Text style={styles.value}>{clientInfo.full_name || 'Nao informado'}</Text>
              </View>
              {clientInfo.phone && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.noteSection}>
                    <Text style={styles.label}>Telefone</Text>
                    <Text style={styles.value}>{clientInfo.phone}</Text>
                  </View>
                </>
              )}
              {clientInfo.email && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.noteSection}>
                    <Text style={styles.label}>E-mail</Text>
                    <Text style={styles.value}>{clientInfo.email}</Text>
                  </View>
                </>
              )}
            </>
          )}
          {appointment.client_note && (
            <>
              <View style={styles.divider} />
              <View style={styles.noteSection}>
                <Text style={styles.label}>Observacao da cliente</Text>
                <Text style={styles.value}>{appointment.client_note}</Text>
              </View>
            </>
          )}
          {appointment.admin_note && (
            <>
              <View style={styles.divider} />
              <View style={styles.noteSection}>
                <Text style={styles.label}>Observacao admin</Text>
                <Text style={styles.value}>{appointment.admin_note}</Text>
              </View>
            </>
          )}
        </View>

        {isOwner && appointment.status === 'confirmed' && (
          <View style={styles.actions}>
            <DangerButton title="Cancelar agendamento" onPress={() => setShowCancelDialog(true)} />
          </View>
        )}

        {isOwner && appointment.status === 'cancelled' && (
          <View style={styles.actions}>
            <DangerButton title="Excluir agendamento" onPress={() => setShowDeleteDialog(true)} />
          </View>
        )}

        {!isOwner && (
          <View style={styles.readOnlyNotice}>
            <Text style={styles.readOnlyText}>Somente leitura - responsavel: {professional?.display_name || 'outro profissional'}</Text>
          </View>
        )}

        {isOwner && appointment.status === 'completed' && (
          <View style={styles.readOnlyNotice}>
            <Text style={styles.readOnlyText}>Somente leitura - agendamento concluido</Text>
          </View>
        )}
      </ScrollView>

      <ConfirmationDialog
        visible={showCancelDialog}
        title="Cancelar agendamento"
        message="Tem certeza que deseja cancelar este agendamento?"
        confirmLabel="Cancelar agendamento"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
        destructive
      />

      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Excluir agendamento"
        message="Tem certeza que deseja excluir permanentemente este agendamento cancelado?"
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  topBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: spacing.sm },
  topBarTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
    overflow: 'hidden',
    ...elevation.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  divider: { height: 1, backgroundColor: colors.border },
  noteSection: { padding: spacing.lg },
  label: { ...typography.bodySmall, fontWeight: '500', color: colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.3 },
  value: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
  actions: { paddingHorizontal: spacing.screenPadding, marginTop: spacing.lg },
  readOnlyNotice: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.screenPadding,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readOnlyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  backToListBtn: { marginTop: spacing.lg },
  errorText: { ...typography.bodySmall, color: colors.error, textAlign: 'center', marginBottom: spacing.lg },
});
