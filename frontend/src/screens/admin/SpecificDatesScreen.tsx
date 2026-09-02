import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Button from '@components/base/Button';
import SecondaryButton from '@components/base/SecondaryButton';
import LoadingState from '@components/base/LoadingState';
import ScreenHeader from '@components/base/ScreenHeader';
import ConfirmationDialog from '@components/base/ConfirmationDialog';
import Calendar from '@components/base/Calendar';
import { useMyProfessionalId, useScheduleOverrides, useSaveScheduleOverride, useDeleteScheduleOverride } from '@hooks';
import type { ScheduleOverride } from '../../supabase/types';

export default function SpecificDatesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { professionalId, loading: profLoading } = useMyProfessionalId();
  const { overrides, loading: overridesLoading, refetch } = useScheduleOverrides(professionalId);
  const { save: saveOverride, loading: saving } = useSaveScheduleOverride();
  const { remove: deleteOverride } = useDeleteScheduleOverride();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDayOff, setIsDayOff] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakStart, setBreakStart] = useState('12:00');
  const [breakEnd, setBreakEnd] = useState('13:00');
  const [hasBreak, setHasBreak] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<ScheduleOverride | null>(null);

  const overrideDates = useMemo(() => {
    const dates = new Map<string, ScheduleOverride>();
    for (const o of overrides) {
      dates.set(o.specific_date, o);
    }
    return dates;
  }, [overrides]);

  const isDateAvailable = useCallback(() => true, []);

  const selectedOverride = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return overrideDates.get(dateStr) ?? null;
  }, [selectedDate, overrideDates]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = overrideDates.get(dateStr);
    if (existing) {
      setIsDayOff(existing.is_off);
      setStartTime(existing.start_time ?? '09:00');
      setEndTime(existing.end_time ?? '18:00');
      setHasBreak(!!existing.lunch_start);
      setBreakStart(existing.lunch_start ?? '12:00');
      setBreakEnd(existing.lunch_end ?? '13:00');
      setShowForm(true);
    } else {
      setIsDayOff(false);
      setStartTime('09:00');
      setEndTime('18:00');
      setHasBreak(false);
      setBreakStart('12:00');
      setBreakEnd('13:00');
      setShowForm(true);
    }
  }, [overrideDates]);

  const validate = useCallback((): string[] => {
    const errs: string[] = [];
    if (!isDayOff) {
      if (!startTime || !endTime) {
        errs.push('Horários de início e fim são obrigatórios');
      } else {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
          errs.push('Formato de horário inválido');
        } else if (sh * 60 + sm >= eh * 60 + em) {
          errs.push('Horário de fim deve ser após o início');
        }
      }
      if (hasBreak) {
        if (!breakStart || !breakEnd) {
          errs.push('Horários da pausa são obrigatórios');
        } else {
          const [bsH, bsM] = breakStart.split(':').map(Number);
          const [beH, beM] = breakEnd.split(':').map(Number);
          if (isNaN(bsH) || isNaN(bsM) || isNaN(beH) || isNaN(beM)) {
            errs.push('Formato de pausa inválido');
          } else if (bsH * 60 + bsM >= beH * 60 + beM) {
            errs.push('Fim da pausa deve ser após o início');
          }
        }
      }
    }
    return errs;
  }, [isDayOff, startTime, endTime, hasBreak, breakStart, breakEnd]);

  const handleSave = useCallback(async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (!professionalId || !selectedDate) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    setErrors([]);

    try {
      await saveOverride(professionalId, dateStr, {
        is_off: isDayOff,
        start_time: isDayOff ? null : startTime,
        end_time: isDayOff ? null : endTime,
        lunch_start: !isDayOff && hasBreak ? breakStart : null,
        lunch_end: !isDayOff && hasBreak ? breakEnd : null,
      });
      await refetch();
      setShowForm(false);
      setSelectedDate(null);
      Alert.alert('Sucesso', 'Exceção salva com sucesso.');
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Nao foi possivel salvar a excecao.');
    }
  }, [professionalId, selectedDate, isDayOff, startTime, endTime, hasBreak, breakStart, breakEnd, validate, saveOverride, refetch]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete || !professionalId) return;
    try {
      await deleteOverride(professionalId, confirmDelete.specific_date);
      await refetch();
      setConfirmDelete(null);
      setShowForm(false);
      setSelectedDate(null);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Nao foi possivel remover a excecao.');
    }
  }, [confirmDelete, professionalId, deleteOverride, refetch]);

  if (profLoading || overridesLoading) {
    return <LoadingState message="Carregando exceções..." />;
  }

  if (!professionalId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Profissional não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) + 16 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Datas específicas"
        subtitle="Defina exceções para datas pontuais"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          isDateAvailable={isDateAvailable}
        />

        {selectedDate && !showForm && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedDate}>
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </Text>
            <SecondaryButton
              title="Configurar exceção"
              onPress={() => setShowForm(true)}
            />
          </View>
        )}

        {showForm && selectedDate && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {format(selectedDate, "dd/MM/yyyy (EEEE)", { locale: ptBR })}
            </Text>

            {errors.length > 0 && (
              <View style={styles.errorContainer}>
                {errors.map((err, i) => (
                  <Text key={i} style={styles.errorItem}>{err}</Text>
                ))}
              </View>
            )}

            {selectedOverride && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setConfirmDelete(selectedOverride)}
              >
                <AppIcon name="delete" size={iconSizes.sm} color="error" />
                <Text style={styles.deleteBtnText}>Remover exceção</Text>
              </TouchableOpacity>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Folga (dia sem atendimento)</Text>
              <TouchableOpacity
                style={[styles.toggle, isDayOff && styles.toggleActive]}
                onPress={() => setIsDayOff(!isDayOff)}
              >
                <View style={[styles.toggleThumb, isDayOff && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            {!isDayOff && (
              <>
                <Text style={styles.fieldLabel}>Horário de trabalho</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timeInputWrap}>
                    <Text style={styles.timeInputLabel}>Início</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="HH:MM"
                      placeholderTextColor={colors.disabled}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <Text style={styles.timeSeparator}>—</Text>
                  <View style={styles.timeInputWrap}>
                    <Text style={styles.timeInputLabel}>Fim</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="HH:MM"
                      placeholderTextColor={colors.disabled}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Incluir pausa</Text>
                  <TouchableOpacity
                    style={[styles.toggle, hasBreak && styles.toggleActive]}
                    onPress={() => setHasBreak(!hasBreak)}
                  >
                    <View style={[styles.toggleThumb, hasBreak && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>

                {hasBreak && (
                  <View style={styles.timeRow}>
                    <View style={styles.timeInputWrap}>
                      <Text style={styles.timeInputLabel}>Pausa início</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={breakStart}
                        onChangeText={setBreakStart}
                        placeholder="HH:MM"
                        placeholderTextColor={colors.disabled}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <Text style={styles.timeSeparator}>—</Text>
                    <View style={styles.timeInputWrap}>
                      <Text style={styles.timeInputLabel}>Pausa fim</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={breakEnd}
                        onChangeText={setBreakEnd}
                        placeholder="HH:MM"
                        placeholderTextColor={colors.disabled}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </View>
                )}
              </>
            )}

            <View style={styles.formActions}>
              <SecondaryButton
                title="Cancelar"
                onPress={() => { setShowForm(false); setErrors([]); }}
              />
              <Button
                title={saving ? 'Salvando...' : 'Salvar'}
                onPress={handleSave}
                disabled={saving}
                loading={saving}
              />
            </View>
          </View>
        )}

        {!showForm && overrides.length > 0 && (
          <View style={styles.overridesList}>
            <Text style={styles.listTitle}>Exceções cadastradas</Text>
            {overrides.map((override) => (
              <TouchableOpacity
                key={override.id}
                style={styles.overrideCard}
                onPress={() => {
                  const date = parseISO(override.specific_date);
                  handleDateSelect(date);
                }}
              >
                <View style={styles.overrideIcon}>
                  <AppIcon
                    name={override.is_off ? 'calendar' : 'time'}
                    size={iconSizes.sm}
                    color={override.is_off ? 'warning' : 'gold'}
                  />
                </View>
                <View style={styles.overrideContent}>
                  <Text style={styles.overrideDate}>
                    {format(parseISO(override.specific_date), "dd/MM/yyyy", { locale: ptBR })}
                  </Text>
                  <Text style={styles.overrideDetail}>
                    {override.is_off
                      ? 'Folga'
                      : `${override.start_time} - ${override.end_time}${override.lunch_start ? ` (pausa ${override.lunch_start}-${override.lunch_end})` : ''}`
                    }
                  </Text>
                </View>
                <AppIcon name="chevron-right" size={iconSizes.sm} color="secondary" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ConfirmationDialog
        visible={!!confirmDelete}
        title="Remover exceção"
        message="Deseja remover esta exceção de data?"
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        destructive
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  content: { paddingHorizontal: spacing.screenPadding },
  selectedInfo: { marginTop: spacing.md, alignItems: 'center' },
  selectedDate: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.md },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
    ...elevation.sm,
  },
  formTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xxxxxxl },
  errorContainer: { backgroundColor: 'rgba(166,61,64,0.06)', borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.xxxxxxl },
  errorItem: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.xs },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxxxxxl, paddingVertical: spacing.sm },
  deleteBtnText: { ...typography.bodySmall, color: colors.error, fontWeight: '500' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xxxxxxl },
  switchLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  toggle: {
    width: 50, height: 28, borderRadius: 14, backgroundColor: colors.border, padding: 2, justifyContent: 'center',
  },
  toggleActive: { backgroundColor: colors.gold },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface },
  toggleThumbActive: { alignSelf: 'flex-end' },
  fieldLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxxxxxl },
  timeInputWrap: { flex: 1 },
  timeInputLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  timeInput: { height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, backgroundColor: colors.background, paddingHorizontal: spacing.md, ...typography.input, color: colors.textPrimary, textAlign: 'center' },
  timeSeparator: { ...typography.body, color: colors.textSecondary, marginTop: spacing.lg },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
  overridesList: { marginTop: spacing.xxxxxxl },
  listTitle: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.3 },
  overrideCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  overrideIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.goldOverlay, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xxxxxxl,
  },
  overrideContent: { flex: 1 },
  overrideDate: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  overrideDetail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  errorText: { ...typography.bodySmall, color: colors.error },
});
