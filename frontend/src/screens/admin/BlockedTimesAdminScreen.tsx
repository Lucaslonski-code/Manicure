import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { colors, spacing, typography, radius, elevation, iconSizes, componentSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Button from '@components/base/Button';
import SecondaryButton from '@components/base/SecondaryButton';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ScreenHeader from '@components/base/ScreenHeader';
import ConfirmationDialog from '@components/base/ConfirmationDialog';
import { useMyProfessionalId, useAllBlockedTimes, useCreateBlockedTime, useUpdateBlockedTime, useDeleteBlockedTime } from '@hooks';
import type { BlockedTime } from '../../supabase/types';

function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export default function BlockedTimesAdminScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { professionalId, loading: profLoading } = useMyProfessionalId();
  const { blockedTimes, loading: blockedLoading, refetch } = useAllBlockedTimes(professionalId);
  const { create, loading: creating } = useCreateBlockedTime();
  const { update, loading: updating } = useUpdateBlockedTime();
  const { remove: removeBlocked } = useDeleteBlockedTime();

  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockedTime | null>(null);
  const [dateStr, setDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<BlockedTime | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  const filteredBlocked = blockedTimes.filter((bt) => {
    const btDate = parseISO(bt.start_at);
    const now = new Date();
    if (filter === 'upcoming') return btDate >= now;
    if (filter === 'past') return btDate < now;
    return true;
  });

  const validate = useCallback((): string[] => {
    const errs: string[] = [];
    if (!dateStr) errs.push('Data é obrigatória');
    if (!startTime) errs.push('Horário de início é obrigatório');
    if (!endTime) errs.push('Horário de fim é obrigatório');
    if (dateStr && startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
        errs.push('Formato de horário inválido');
      } else if (sh * 60 + sm >= eh * 60 + em) {
        errs.push('Horário de fim deve ser após o início');
      }
    }
    return errs;
  }, [dateStr, startTime, endTime]);

  const handleSave = useCallback(async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (!professionalId) return;

    setErrors([]);
    const startAt = `${dateStr}T${startTime}:00-03:00`;
    const endAt = `${dateStr}T${endTime}:00-03:00`;

    try {
      if (editingBlock) {
        await update(editingBlock.id, { start_at: startAt, end_at: endAt, reason: reason || undefined });
      } else {
        await create(professionalId, startAt, endAt, reason || undefined);
      }
      await refetch();
      setShowForm(false);
      setEditingBlock(null);
      setReason('');
      Alert.alert('Sucesso', editingBlock ? 'Bloqueio atualizado com sucesso.' : 'Bloqueio criado com sucesso.');
    } catch (err: any) {
      setErrors([err?.message || (editingBlock ? 'Nao foi possivel atualizar o bloqueio.' : 'Nao foi possivel criar o bloqueio.')]);
    }
  }, [professionalId, dateStr, startTime, endTime, reason, validate, create, update, editingBlock, refetch]);

  const handleEdit = useCallback((block: BlockedTime) => {
    setEditingBlock(block);
    const blockDate = parseISO(block.start_at);
    setDateStr(format(blockDate, 'yyyy-MM-dd'));
    setStartTime(format(blockDate, 'HH:mm'));
    const blockEndDate = parseISO(block.end_at);
    setEndTime(format(blockEndDate, 'HH:mm'));
    setReason(block.reason || '');
    setShowForm(true);
    setErrors([]);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      await removeBlocked(confirmDelete.id);
      await refetch();
      setConfirmDelete(null);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Nao foi possivel remover o bloqueio.');
    }
  }, [confirmDelete, removeBlocked, refetch]);

  if (profLoading || blockedLoading) {
    return <LoadingState message="Carregando bloqueios..." />;
  }

  if (!professionalId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Profissional não encontrado.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title="Bloqueios"
          subtitle="Indisponibilidades extraordinárias"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.filterRow}>
          {(['upcoming', 'all', 'past'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'upcoming' ? 'Próximos' : f === 'all' ? 'Todos' : 'Passados'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showForm ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{editingBlock ? 'Editar bloqueio' : 'Novo bloqueio'}</Text>
              {errors.length > 0 && (
                <View style={styles.errorContainer}>
                  {errors.map((err, i) => (
                    <Text key={i} style={styles.errorItem}>{err}</Text>
                  ))}
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Data</Text>
                <TextInput
                  style={styles.input}
                  value={dateStr}
                  onChangeText={setDateStr}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.disabled}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeInputWrap}>
                  <Text style={styles.fieldLabel}>Início</Text>
                  <TextInput
                    style={styles.input}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.disabled}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <Text style={styles.timeSeparator}>—</Text>
                <View style={styles.timeInputWrap}>
                  <Text style={styles.fieldLabel}>Fim</Text>
                  <TextInput
                    style={styles.input}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.disabled}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Motivo (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Ex: Emergência, compromisso pessoal"
                  placeholderTextColor={colors.disabled}
                />
              </View>

              <View style={styles.formActions}>
                <SecondaryButton title="Cancelar" onPress={() => { setShowForm(false); setEditingBlock(null); setErrors([]); }} style={{ flex: 1 }} />
                <Button
                  title={creating || updating ? (editingBlock ? 'Salvando...' : 'Criando...') : (editingBlock ? 'Salvar alterações' : 'Criar bloqueio')}
                  onPress={handleSave}
                  disabled={creating || updating}
                  loading={creating || updating}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </ScrollView>
        ) : (
          <>
            {filteredBlocked.length === 0 ? (
              <EmptyState
                title="Sem bloqueios"
                description={filter === 'upcoming' ? 'Nenhum bloqueio futuro registrado.' : 'Nenhum bloqueio encontrado.'}
              />
            ) : (
              <FlatList
                data={filteredBlocked}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <View style={styles.cardIconContainer}>
                      <AppIcon name="lock" size={iconSizes.md} color="error" />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.reason}>{item.reason || 'Bloqueio'}</Text>
                      <Text style={styles.time}>{formatDateTime(item.start_at)}</Text>
                      <Text style={styles.timeEnd}>até {formatDateTime(item.end_at)}</Text>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <AppIcon name="edit" size={iconSizes.sm} color="gold" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setConfirmDelete(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <AppIcon name="delete" size={iconSizes.sm} color="error" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </>
        )}

        {!showForm && (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button title="+ Novo bloqueio" onPress={() => { setEditingBlock(null); setDateStr(format(new Date(), 'yyyy-MM-dd')); setStartTime('09:00'); setEndTime('10:00'); setReason(''); setShowForm(true); }} />
          </View>
        )}

        <ConfirmationDialog
          visible={!!confirmDelete}
          title="Remover bloqueio"
          message="Deseja remover este bloqueio?"
          confirmLabel="Remover"
          cancelLabel="Cancelar"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          destructive
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  scroll: { flex: 1 },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.screenPadding, marginBottom: spacing.xxxxxxl, gap: spacing.sm },
  filterBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  filterBtnActive: { backgroundColor: colors.goldOverlay, borderColor: colors.gold },
  filterText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: colors.gold },
  list: { paddingHorizontal: spacing.screenPadding, paddingBottom: 100 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xxxxxxl, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', ...elevation.sm,
  },
  cardIconContainer: {
    width: 40, height: 40, borderRadius: radius.input, backgroundColor: 'rgba(166,61,64,0.06)',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.xxxxxxl,
  },
  cardContent: { flex: 1 },
  cardActions: { flexDirection: 'row', gap: spacing.xxxxxxl },
  reason: { ...typography.body, color: colors.textPrimary, fontWeight: '600', marginBottom: spacing.xs },
  time: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  timeEnd: { ...typography.bodySmall, color: colors.textSecondary },
  formCard: {
    marginHorizontal: spacing.screenPadding, marginBottom: spacing.xxxxxxl, backgroundColor: colors.surface,
    borderRadius: radius.card, padding: spacing.xxxxxxl, borderWidth: 1, borderColor: colors.border, ...elevation.sm,
  },
  formTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xxxxxxl },
  errorContainer: { backgroundColor: 'rgba(166,61,64,0.06)', borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.xxxxxxl },
  errorItem: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.xs },
  field: { marginBottom: spacing.xxxxxxl },
  fieldLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  input: {
    height: componentSizes.inputHeight, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input,
    backgroundColor: colors.background, paddingHorizontal: spacing.md, ...typography.input, color: colors.textPrimary,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxxxxxl },
  timeInputWrap: { flex: 1 },
  timeSeparator: { ...typography.body, color: colors.textSecondary, marginTop: spacing.lg },
  formActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, paddingHorizontal: spacing.screenPadding, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  errorText: { ...typography.bodySmall, color: colors.error },
});
