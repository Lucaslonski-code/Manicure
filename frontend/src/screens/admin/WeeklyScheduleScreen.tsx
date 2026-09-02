import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Button from '@components/base/Button';
import SecondaryButton from '@components/base/SecondaryButton';
import LoadingState from '@components/base/LoadingState';
import ScreenHeader from '@components/base/ScreenHeader';
import ConfirmationDialog from '@components/base/ConfirmationDialog';
import { useMyProfessionalId, useWorkWindows, useSaveWorkWindows } from '@hooks';
import type { WorkWindow, WorkWindowInput } from '../../supabase/types';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
const WEEKDAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

interface WindowData {
  id?: string;
  start_time: string;
  end_time: string;
  breaks: BreakData[];
}

interface BreakData {
  id?: string;
  start_time: string;
  end_time: string;
  label: string;
}

interface DayConfig {
  active: boolean;
  windows: WindowData[];
}

function emptyWindow(): WindowData {
  return { start_time: '09:00', end_time: '18:00', breaks: [] };
}

function emptyBreak(): BreakData {
  return { start_time: '12:00', end_time: '13:00', label: 'Pausa' };
}

function validateTimeRange(start: string, end: string): boolean {
  if (!start || !end) return false;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return false;
  return sh * 60 + sm < eh * 60 + em;
}

function validateBreak(breakData: BreakData, windowStart: string, windowEnd: string): string | null {
  if (!breakData.start_time || !breakData.end_time) return 'Horario da pausa incompleto';
  if (!validateTimeRange(breakData.start_time, breakData.end_time)) return 'Fim da pausa deve ser apos o inicio';
  const [bsH, bsM] = breakData.start_time.split(':').map(Number);
  const [beH, beM] = breakData.end_time.split(':').map(Number);
  const [wsH, wsM] = windowStart.split(':').map(Number);
  const [weH, weM] = windowEnd.split(':').map(Number);
  const breakStart = bsH * 60 + bsM;
  const breakEnd = beH * 60 + beM;
  const winStart = wsH * 60 + wsM;
  const winEnd = weH * 60 + weM;
  if (breakStart < winStart) return 'Pausa nao pode comecar antes da janela';
  if (breakEnd > winEnd) return 'Pausa nao pode terminar depois da janela';
  return null;
}

function buildWindowsFromDB(windows: WorkWindow[], breaks: any[]): DayConfig[] {
  const result: DayConfig[] = WEEKDAY_INDICES.map(() => ({ active: false, windows: [] }));

  for (const ww of windows) {
    const dayIdx = WEEKDAY_INDICES.indexOf(ww.weekday);
    if (dayIdx === -1) continue;
    result[dayIdx].active = true;
    const windowBreaks = breaks
      .filter((b) => b.work_window_id === ww.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((b) => ({
        id: b.id,
        start_time: b.start_time,
        end_time: b.end_time,
        label: b.label || 'Pausa',
      }));
    result[dayIdx].windows.push({
      id: ww.id,
      start_time: ww.start_time,
      end_time: ww.end_time,
      breaks: windowBreaks,
    });
  }

  for (const day of result) {
    if (day.active && day.windows.length === 0) {
      day.windows.push(emptyWindow());
    }
  }

  return result;
}

function buildInput(dayConfigs: DayConfig[]): WorkWindowInput[] {
  const inputs: WorkWindowInput[] = [];
  dayConfigs.forEach((day, dayIdx) => {
    if (!day.active) return;
    const weekday = WEEKDAY_INDICES[dayIdx];
    day.windows.forEach((win, winIdx) => {
      inputs.push({
        weekday,
        start_time: win.start_time,
        end_time: win.end_time,
        sort_order: winIdx,
        breaks: win.breaks.map((brk, brkIdx) => ({
          start_time: brk.start_time,
          end_time: brk.end_time,
          label: brk.label,
          sort_order: brkIdx,
        })),
      });
    });
  });
  return inputs;
}

function StableTimeInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [local, setLocal] = useState(value);
  const lastExternalRef = useRef(value);

  useEffect(() => {
    if (value !== lastExternalRef.current) {
      lastExternalRef.current = value;
      setLocal(value);
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    if (local !== lastExternalRef.current) {
      lastExternalRef.current = local;
      onChange(local);
    }
  }, [local, onChange]);

  return (
    <TextInput
      style={styles.timeInput}
      value={local}
      onChangeText={setLocal}
      onBlur={handleBlur}
      placeholder={placeholder || 'HH:MM'}
      placeholderTextColor={colors.disabled}
      keyboardType="numbers-and-punctuation"
    />
  );
}

export default function WeeklyScheduleScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { professionalId, loading: profLoading } = useMyProfessionalId();
  const { windows: dbWindows, loading: windowsLoading, refetch } = useWorkWindows(professionalId);
  const { save, loading: saving } = useSaveWorkWindows();

  const [dayConfigs, setDayConfigs] = useState<DayConfig[]>(WEEKDAY_INDICES.map(() => ({ active: false, windows: [] })));
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    if (!windowsLoading && dbWindows.length >= 0) {
      import('../../services/api').then(({ fetchAllBreaksForProfessional }) => {
        if (professionalId) {
          fetchAllBreaksForProfessional(professionalId).then((brks) => {
            setDayConfigs(buildWindowsFromDB(dbWindows, brks));
          }).catch(() => {
            setDayConfigs(buildWindowsFromDB(dbWindows, []));
          });
        }
      });
    }
  }, [windowsLoading, dbWindows, professionalId]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  const toggleDay = useCallback((dayIdx: number) => {
    setDayConfigs((prev) => {
      const next = [...prev];
      const day = { ...next[dayIdx] };
      day.active = !day.active;
      if (day.active && day.windows.length === 0) {
        day.windows = [emptyWindow()];
      }
      next[dayIdx] = day;
      return next;
    });
    markChanged();
  }, [markChanged]);

  const updateWindow = useCallback((dayIdx: number, winIdx: number, field: keyof WindowData, value: string) => {
    setDayConfigs((prev) => {
      const next = [...prev];
      const day = { ...next[dayIdx], windows: [...next[dayIdx].windows] };
      day.windows[winIdx] = { ...day.windows[winIdx], [field]: value };
      next[dayIdx] = day;
      return next;
    });
    markChanged();
  }, [markChanged]);

  const addWindow = useCallback((dayIdx: number) => {
    setDayConfigs((prev) => {
      const next = [...prev];
      const day = { ...next[dayIdx], windows: [...next[dayIdx].windows, emptyWindow()] };
      next[dayIdx] = day;
      return next;
    });
    markChanged();
  }, [markChanged]);

  const removeWindow = useCallback((dayIdx: number, winIdx: number) => {
    setDayConfigs((prev) => {
      const next = [...prev];
      const day = { ...next[dayIdx], windows: [...next[dayIdx].windows] };
      day.windows.splice(winIdx, 1);
      if (day.windows.length === 0) {
        day.active = false;
      }
      next[dayIdx] = day;
      return next;
    });
    markChanged();
  }, [markChanged]);

  const addBreak = useCallback((dayIdx: number, winIdx: number) => {
    setDayConfigs((prev) => {
      const next = [...prev];
      const day = { ...next[dayIdx], windows: [...next[dayIdx].windows] };
      const win = { ...day.windows[winIdx], breaks: [...day.windows[winIdx].breaks, emptyBreak()] };
      day.windows[winIdx] = win;
      next[dayIdx] = day;
      return next;
    });
    markChanged();
  }, [markChanged]);

  const updateBreak = useCallback((dayIdx: number, winIdx: number, brkIdx: number, field: keyof BreakData, value: string) => {
    setDayConfigs((prev) => {
      const next = [...prev];
      const day = { ...next[dayIdx], windows: [...next[dayIdx].windows] };
      const win = { ...day.windows[winIdx], breaks: [...day.windows[winIdx].breaks] };
      win.breaks[brkIdx] = { ...win.breaks[brkIdx], [field]: value };
      day.windows[winIdx] = win;
      next[dayIdx] = day;
      return next;
    });
    markChanged();
  }, [markChanged]);

  const removeBreak = useCallback((dayIdx: number, winIdx: number, brkIdx: number) => {
    setDayConfigs((prev) => {
      const next = [...prev];
      const day = { ...next[dayIdx], windows: [...next[dayIdx].windows] };
      const win = { ...day.windows[winIdx], breaks: [...day.windows[winIdx].breaks] };
      win.breaks.splice(brkIdx, 1);
      day.windows[winIdx] = win;
      next[dayIdx] = day;
      return next;
    });
    markChanged();
  }, [markChanged]);

  const validate = useCallback((): string[] => {
    const errs: string[] = [];
    dayConfigs.forEach((day, dayIdx) => {
      if (!day.active) return;
      const dayName = WEEKDAYS[WEEKDAY_INDICES[dayIdx]];
      day.windows.forEach((win, winIdx) => {
        if (!validateTimeRange(win.start_time, win.end_time)) {
          errs.push(`${dayName}: janela ${winIdx + 1} - horario invalido`);
        }
        win.breaks.forEach((brk) => {
          const brkErr = validateBreak(brk, win.start_time, win.end_time);
          if (brkErr) errs.push(`${dayName}: ${brkErr}`);
        });
        for (let i = 0; i < win.breaks.length; i++) {
          for (let j = i + 1; j < win.breaks.length; j++) {
            const a = win.breaks[i];
            const b = win.breaks[j];
            const [aSH, aSM] = a.start_time.split(':').map(Number);
            const [aEH, aEM] = a.end_time.split(':').map(Number);
            const [bSH, bSM] = b.start_time.split(':').map(Number);
            const [bEH, bEM] = b.end_time.split(':').map(Number);
            if (aSH * 60 + aSM < bEH * 60 + bEM && bSH * 60 + bSM < aEH * 60 + aEM) {
              errs.push(`${dayName}: pausas sobrepostas`);
            }
          }
        }
      });
    });
    return errs;
  }, [dayConfigs]);

  const handleSave = useCallback(async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (!professionalId) return;

    setErrors([]);
    const windowsInput = buildInput(dayConfigs);
    try {
      await save(professionalId, windowsInput);
      setHasChanges(false);
      await refetch();
      Alert.alert('Sucesso', 'Jornada atualizada com sucesso.');
    } catch {
      setErrors(['Nao foi possivel salvar a jornada. Verifique os horarios e tente novamente.']);
    }
  }, [dayConfigs, professionalId, validate, save, refetch]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      setConfirmVisible(true);
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  if (profLoading || windowsLoading) {
    return <LoadingState message="Carregando jornada..." />;
  }

  if (!professionalId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Profissional nao encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Jornada semanal" subtitle="Configure seus dias de trabalho" onBack={handleBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((err, i) => (
              <Text key={i} style={styles.errorItem}>{err}</Text>
            ))}
          </View>
        )}

        <View style={styles.infoBanner}>
          <AppIcon name="warning" size={iconSizes.sm} color="gold" />
          <Text style={styles.infoBannerText}>A jornada salva passa a valer imediatamente.</Text>
        </View>

        {WEEKDAY_INDICES.map((weekday, dayIdx) => {
          const day = dayConfigs[dayIdx];
          const isExpanded = expandedDay === dayIdx;
          return (
            <View key={weekday} style={styles.dayCard}>
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={() => setExpandedDay(isExpanded ? null : dayIdx)}
                activeOpacity={0.7}
              >
                <View style={styles.dayHeaderLeft}>
                  <Switch
                    value={day.active}
                    onValueChange={() => toggleDay(dayIdx)}
                    trackColor={{ false: colors.border, true: colors.goldOverlay }}
                    thumbColor={day.active ? colors.gold : colors.disabled}
                  />
                  <Text style={[styles.dayName, !day.active && styles.dayNameInactive]}>
                    {WEEKDAYS[weekday]}
                  </Text>
                </View>
                <View style={styles.dayHeaderRight}>
                  {day.active && (
                    <Text style={styles.windowCount}>
                      {day.windows.length} {day.windows.length === 1 ? 'janela' : 'janelas'}
                    </Text>
                  )}
                  <AppIcon name="chevron-right" size={iconSizes.sm} color="secondary" />
                </View>
              </TouchableOpacity>

              {isExpanded && day.active && (
                <View style={styles.dayContent}>
                  {day.windows.map((win, winIdx) => (
                    <View key={winIdx} style={styles.windowCard}>
                      <View style={styles.windowHeader}>
                        <Text style={styles.windowLabel}>Janela {winIdx + 1}</Text>
                        {day.windows.length > 1 && (
                          <TouchableOpacity onPress={() => removeWindow(dayIdx, winIdx)}>
                            <AppIcon name="delete" size={iconSizes.sm} color="error" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.timeRow}>
                        <View style={styles.timeInputWrap}>
                          <Text style={styles.timeInputLabel}>Inicio</Text>
                          <StableTimeInput
                            value={win.start_time}
                            onChange={(v) => updateWindow(dayIdx, winIdx, 'start_time', v)}
                          />
                        </View>
                        <Text style={styles.timeSeparator}>-</Text>
                        <View style={styles.timeInputWrap}>
                          <Text style={styles.timeInputLabel}>Fim</Text>
                          <StableTimeInput
                            value={win.end_time}
                            onChange={(v) => updateWindow(dayIdx, winIdx, 'end_time', v)}
                          />
                        </View>
                      </View>

                      {win.breaks.map((brk, brkIdx) => (
                        <View key={brkIdx} style={styles.breakCard}>
                          <View style={styles.breakHeader}>
                            <TextInput
                              style={styles.breakLabelInput}
                              value={brk.label}
                              onChangeText={(v) => updateBreak(dayIdx, winIdx, brkIdx, 'label', v)}
                              placeholder="Pausa"
                              placeholderTextColor={colors.disabled}
                            />
                            <TouchableOpacity onPress={() => removeBreak(dayIdx, winIdx, brkIdx)}>
                              <AppIcon name="delete" size={iconSizes.sm} color="error" />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.timeRow}>
                            <View style={styles.timeInputWrap}>
                              <StableTimeInput
                                value={brk.start_time}
                                onChange={(v) => updateBreak(dayIdx, winIdx, brkIdx, 'start_time', v)}
                              />
                            </View>
                            <Text style={styles.timeSeparator}>-</Text>
                            <View style={styles.timeInputWrap}>
                              <StableTimeInput
                                value={brk.end_time}
                                onChange={(v) => updateBreak(dayIdx, winIdx, brkIdx, 'end_time', v)}
                              />
                            </View>
                          </View>
                        </View>
                      ))}

                      <TouchableOpacity style={styles.addBreakBtn} onPress={() => addBreak(dayIdx, winIdx)}>
                        <AppIcon name="add" size={iconSizes.sm} color="gold" />
                        <Text style={styles.addBreakText}>Adicionar pausa</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <SecondaryButton
                    title="+ Adicionar janela"
                    onPress={() => addWindow(dayIdx)}
                    style={styles.addWindowBtn}
                  />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title={saving ? 'Salvando...' : 'Salvar jornada'}
          onPress={handleSave}
          disabled={saving || !hasChanges}
          loading={saving}
        />
      </View>

      <ConfirmationDialog
        visible={confirmVisible}
        title="Alteracoes nao salvas"
        message="Voce tem alteracoes nao salvas. Deseja sair sem salvar?"
        confirmLabel="Sair"
        cancelLabel="Ficar"
        onConfirm={() => { setConfirmVisible(false); navigation.goBack(); }}
        onCancel={() => setConfirmVisible(false)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  scroll: { flex: 1 },
  errorContainer: { marginHorizontal: spacing.screenPadding, marginBottom: spacing.md, backgroundColor: 'rgba(166,61,64,0.06)', borderRadius: radius.card, padding: spacing.xxxxxxl },
  errorItem: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.xs },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.screenPadding, marginBottom: spacing.xxxxxxl, backgroundColor: colors.goldOverlay, borderRadius: radius.card, padding: spacing.xxxxxxl },
  infoBannerText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  dayCard: { marginHorizontal: spacing.screenPadding, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, ...elevation.sm },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.xxxxxxl },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  dayNameInactive: { color: colors.disabled },
  windowCount: { ...typography.bodySmall, color: colors.textSecondary },
  dayContent: { paddingHorizontal: spacing.xxxxxxl, paddingBottom: spacing.xxxxxxl },
  windowCard: { backgroundColor: colors.background, borderRadius: radius.card, padding: spacing.xxxxxxl, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  windowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  windowLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeInputWrap: { flex: 1 },
  timeInputLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  timeInput: { height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, backgroundColor: colors.surface, paddingHorizontal: spacing.md, ...typography.input, color: colors.textPrimary, textAlign: 'center' },
  timeSeparator: { ...typography.body, color: colors.textSecondary, marginTop: spacing.lg },
  breakCard: { marginTop: spacing.md, backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.xxxxxxl, borderWidth: 1, borderColor: colors.border },
  breakHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  breakLabelInput: { flex: 1, height: 36, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background, paddingHorizontal: spacing.md, ...typography.bodySmall, color: colors.textPrimary, marginRight: spacing.md },
  addBreakBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, paddingVertical: spacing.sm },
  addBreakText: { ...typography.bodySmall, color: colors.gold, fontWeight: '500' },
  addWindowBtn: { marginTop: spacing.sm },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, paddingHorizontal: spacing.screenPadding, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  errorText: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },
});
