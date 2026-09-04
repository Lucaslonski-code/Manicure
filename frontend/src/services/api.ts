import { supabase } from '../supabase/client';
import { File as ExpoFile } from 'expo-file-system';
import type { Professional, Service, ProfessionalService, BlockedTime, Appointment, BusinessSettings, Notification, WorkWindow, ScheduleBreak, ScheduleOverride, EffectiveWindow, EffectiveBreak, WorkWindowInput, ProfessionalScheduleData } from '../supabase/types';

async function readFileAsArrayBuffer(imageUri: string): Promise<ArrayBuffer> {
  let file: ExpoFile;
  try {
    file = new ExpoFile(imageUri);
  } catch {
    throw new Error('Nao foi possivel acessar a imagem selecionada.');
  }

  if (!file.exists) {
    throw new Error('O arquivo de imagem selecionado nao existe.');
  }

  const base64 = await file.base64();
  if (!base64 || base64.length === 0) {
    throw new Error('A imagem selecionada esta vazia.');
  }

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function sendPushNotification(appointmentId: string, event: 'confirmation' | 'cancellation' | 'reschedule'): Promise<void> {
  try {
    await supabase.functions.invoke('send-push-notification', {
      body: {
        appointment_id: appointmentId,
        event,
      },
    });
  } catch (err) {
    console.error('Error sending push notification:', err);
  }
}

function mapApiError(error: any): string {
  if (!error || typeof error.message !== 'string') {
    return 'Erro inesperado';
  }
  const message = error.message.toLowerCase();
  if (message.includes('row count') || message.includes('no rows')) {
    return 'Registro nao encontrado';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Erro de conexao. Verifique sua internet.';
  }
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Sessao expirada. Entre novamente.';
  }
  if (message.includes('forbidden') || message.includes('403')) {
    return 'Acesso negado.';
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'Recurso nao encontrado.';
  }
  if (message.includes('conflict') || message.includes('409') || message.includes('overlap')) {
    return 'Horario indisponivel ou conflitante.';
  }
  if (message.includes('time outside availability') || message.includes('422')) {
    return 'Horario fora da disponibilidade.';
  }
  if (message.includes('blocked') || message.includes('block')) {
    return 'Horario bloqueado.';
  }
  if (message.includes('service not available') || message.includes('professional not available')) {
    return 'Servico ou profissional indisponivel.';
  }
  if (message.includes('appointment cannot be cancelled') || message.includes('cannot be rescheduled')) {
    return 'Operacao nao permitida para este agendamento.';
  }
  if (message.includes('time conflict')) {
    return 'Conflito de horario.';
  }
  if (message.includes('permission denied') || message.includes('insufficient privilege')) {
    return 'Sem permissao para esta operacao.';
  }
  if (message.includes('violates row-level security') || message.includes('rls')) {
    return 'Sem permissao para acessar este recurso.';
  }
  return error.message || 'Erro ao processar solicitacao.';
}

export async function fetchProfessionals(): Promise<Professional[]> {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('is_active', true)
    .order('display_name');

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function fetchProfessionalById(id: string): Promise<Professional | null> {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function fetchProfessionalServices(professionalId: string): Promise<(ProfessionalService & { service: Service })[]> {
  const { data, error } = await supabase
    .from('professional_services')
    .select('*, service:services(*)')
    .eq('professional_id', professionalId)
    .eq('is_active', true)
    ;

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function createServiceForProfessional(
  professionalId: string,
  name: string,
  description: string | null,
  durationMinutes: number,
  price: number | null
): Promise<string> {
  const { data: newService, error: serviceError } = await supabase
    .from('services')
    .insert({
      name,
      description: description || null,
      default_duration_minutes: durationMinutes,
      is_active: true,
    })
    .select('id')
    .single();

  if (serviceError) throw new Error(mapApiError(serviceError));
  if (!newService) throw new Error('Erro ao criar servico');

  const { error: linkError } = await supabase
    .from('professional_services')
    .insert({
      professional_id: professionalId,
      service_id: newService.id,
      duration_minutes: durationMinutes,
      price: price || null,
      is_active: true,
    });

  if (linkError) throw new Error(mapApiError(linkError));

  return newService.id;
}

export async function updateProfessionalService(
  professionalServiceId: string,
  updates: { duration_minutes?: number; price?: number | null; is_active?: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('professional_services')
    .update(updates)
    .eq('id', professionalServiceId);

  if (error) throw new Error(mapApiError(error));
}

export async function updateServiceCatalog(
  serviceId: string,
  updates: { name?: string; description?: string | null; default_duration_minutes?: number }
): Promise<void> {
  const { error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', serviceId);

  if (error) throw new Error(mapApiError(error));
}

export async function deleteProfessionalService(professionalServiceId: string): Promise<void> {
  const { error } = await supabase
    .from('professional_services')
    .delete()
    .eq('id', professionalServiceId);

  if (error) throw new Error(mapApiError(error));
}

export async function fetchBlockedTimes(professionalId?: string | null): Promise<BlockedTime[]> {
  const query = supabase
    .from('blocked_times')
    .select('*');

  if (professionalId) {
    query.eq('professional_id', professionalId);
  }

  const { data, error } = await query
    .gte('start_at', new Date().toISOString())
    .order('start_at');

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function fetchAllBlockedTimes(professionalId: string): Promise<BlockedTime[]> {
  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('professional_id', professionalId)
    .order('start_at', { ascending: false });

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function createBlockedTime(
  professionalId: string,
  startAt: string,
  endAt: string,
  reason?: string,
): Promise<BlockedTime> {
  const { data, error } = await supabase
    .from('blocked_times')
    .insert({
      professional_id: professionalId,
      start_at: startAt,
      end_at: endAt,
      reason: reason || null,
    })
    .select()
    .single();

  if (error) throw new Error(mapApiError(error));
  return data;
}

export async function updateBlockedTime(
  id: string,
  updates: { start_at?: string; end_at?: string; reason?: string },
): Promise<void> {
  const { error } = await supabase
    .from('blocked_times')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(mapApiError(error));
}

export async function deleteBlockedTime(id: string): Promise<void> {
  const { error } = await supabase
    .from('blocked_times')
    .delete()
    .eq('id', id);

  if (error) throw new Error(mapApiError(error));
}

export async function checkBlockedTimeConflicts(
  professionalId: string,
  startAt: string,
  endAt: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from('blocked_times')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .lt('start_at', endAt)
    .gt('end_at', startAt);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { count, error } = await query;

  if (error) return false;
  return (count ?? 0) > 0;
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('start_at', { ascending: true });

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function fetchMyAppointments(): Promise<Appointment[]> {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_user_id', userId)
    .order('start_at', { ascending: true });

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function fetchAppointmentById(id: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createAppointment(
  professionalId: string,
  serviceId: string,
  startAt: string,
  clientNote?: string
): Promise<Appointment> {
  const { data, error } = await supabase.rpc('book_appointment', {
    p_professional_id: professionalId,
    p_service_id: serviceId,
    p_start_at: startAt,
    p_client_note: clientNote,
  });

  if (error) throw new Error(mapApiError(error));

  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', data)
    .single();

  if (fetchError) throw new Error(mapApiError(fetchError));
  
  if (appointment) {
    sendPushNotification(appointment.id, 'confirmation');
  }
  
  return appointment;
}

export async function cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_appointment_by_client', {
    p_appointment_id: appointmentId,
    p_reason: reason,
  });

  if (error) throw new Error(mapApiError(error));

  sendPushNotification(appointmentId, 'cancellation');
}

export async function rescheduleAppointment(appointmentId: string, newStartAt: string): Promise<void> {
  const { error } = await supabase.rpc('reschedule_appointment_by_admin', {
    p_appointment_id: appointmentId,
    p_new_start_at: newStartAt,
  });

  if (error) throw new Error(mapApiError(error));

  sendPushNotification(appointmentId, 'reschedule');
}

export async function cancelAppointmentByAdmin(appointmentId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_appointment_by_admin', {
    p_appointment_id: appointmentId,
    p_reason: reason,
  });

  if (error) throw new Error(mapApiError(error));

  sendPushNotification(appointmentId, 'cancellation');
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw new Error(mapApiError(error));
}

export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_account');

  if (error) throw new Error(mapApiError(error));
}

export async function fetchBusinessSettings(): Promise<BusinessSettings | null> {
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function editAppointmentByClient(
  appointmentId: string,
  newProfessionalId: string,
  newServiceId: string,
  newStartAt: string,
  clientNote?: string
): Promise<void> {
  const { error } = await supabase.rpc('edit_appointment_by_client', {
    p_appointment_id: appointmentId,
    p_new_professional_id: newProfessionalId,
    p_new_service_id: newServiceId,
    p_new_start_at: newStartAt,
    p_client_note: clientNote || null,
  });

  if (error) throw new Error(mapApiError(error));

  sendPushNotification(appointmentId, 'reschedule');
}

export async function updateProfileAvatar(userId: string, imageUri: string): Promise<string> {
  const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const buffer = await readFileAsArrayBuffer(imageUri);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    const msg = uploadError.message || uploadError.name || 'Erro desconhecido';
    console.error('[updateProfileAvatar] upload error:', msg);
    throw new Error('Erro ao enviar imagem: ' + msg);
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  const publicUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (updateError) throw new Error(mapApiError(updateError));

  return publicUrl;
}

export async function updateProfile(userId: string, updates: { name?: string; phone?: string }): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) throw new Error(mapApiError(error));
}

export async function updateServiceImage(serviceId: string, imageUri: string): Promise<string> {
  const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const fileName = `${serviceId}/${Date.now()}.${ext}`;

  const buffer = await readFileAsArrayBuffer(imageUri);

  const { error: uploadError } = await supabase.storage
    .from('service-images')
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    const msg = uploadError.message || uploadError.name || 'Erro desconhecido';
    console.error('[updateServiceImage] upload error:', msg);
    throw new Error('Erro ao enviar imagem: ' + msg);
  }

  const { data: urlData } = supabase.storage
    .from('service-images')
    .getPublicUrl(fileName);

  const publicUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from('services')
    .update({ image_url: publicUrl })
    .eq('id', serviceId);

  if (updateError) throw new Error(mapApiError(updateError));

  return publicUrl;
}

export async function deleteServiceImage(serviceId: string): Promise<void> {
  const { data: service, error: fetchError } = await supabase
    .from('services')
    .select('image_url')
    .eq('id', serviceId)
    .single();

  if (fetchError || !service?.image_url) return;

  const urlParts = service.image_url.split('/');
  const pathParts = urlParts.slice(urlParts.indexOf('service-images') + 1);
  const filePath = pathParts.join('/');

  if (filePath) {
    await supabase.storage.from('service-images').remove([filePath]);
  }

  const { error: updateError } = await supabase
    .from('services')
    .update({ image_url: null })
    .eq('id', serviceId);

  if (updateError) throw new Error(mapApiError(updateError));
}

export async function deleteCancelledAppointment(appointmentId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_appointment_by_client', {
    p_appointment_id: appointmentId,
  });
  if (error) throw new Error(mapApiError(error));
}

export async function deleteCancelledAppointmentAdmin(appointmentId: string): Promise<void> {
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('status')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appointment) throw new Error('Agendamento não encontrado');
  if (appointment.status !== 'cancelled') throw new Error('Somente agendamentos cancelados podem ser excluídos');

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw new Error(mapApiError(error));
}

// ============================================================================
// Work Windows API (multi-window, multi-break, vigência)
// ============================================================================

export async function fetchWorkWindows(professionalId: string): Promise<WorkWindow[]> {
  const { data, error } = await supabase
    .from('work_windows')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('is_active', true)
    .order('weekday')
    .order('sort_order')
    .order('start_time');

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function fetchWindowBreaks(windowId: string): Promise<ScheduleBreak[]> {
  const { data, error } = await supabase
    .from('schedule_breaks')
    .select('*')
    .eq('work_window_id', windowId)
    .order('sort_order')
    .order('start_time');

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function fetchAllBreaksForProfessional(professionalId: string): Promise<ScheduleBreak[]> {
  const windows = await fetchWorkWindows(professionalId);
  if (windows.length === 0) return [];

  const allBreaks: ScheduleBreak[] = [];
  for (const win of windows) {
    const breaks = await fetchWindowBreaks(win.id);
    allBreaks.push(...breaks);
  }
  return allBreaks;
}

export async function fetchAllWorkWindows(): Promise<(WorkWindow & { professional_name?: string })[]> {
  const { data, error } = await supabase
    .from('work_windows')
    .select('*, professionals(display_name)')
    .eq('is_active', true)
    .order('weekday')
    .order('sort_order')
    .order('start_time');

  if (error) throw new Error(mapApiError(error));
  return (data || []).map((row: any) => ({
    ...row,
    professional_name: row.professionals?.display_name,
  }));
}

export async function upsertWorkWindows(professionalId: string, windows: WorkWindowInput[]): Promise<void> {
  const { error } = await supabase.rpc('upsert_work_windows', {
    p_professional_id: professionalId,
    p_windows: windows as any,
  });

  if (error) {
    const msg = error.message || error.details || error.hint || JSON.stringify(error);
    console.error('[upsertWorkWindows] RPC error:', msg);
    throw new Error(mapApiError(error));
  }
}

export async function fetchEffectiveWindows(professionalId: string, date: string): Promise<EffectiveWindow[]> {
  const { data, error } = await supabase
    .rpc('get_effective_windows', {
      p_professional_id: professionalId,
      p_date: date,
    });

  if (error) return [];
  return (data as EffectiveWindow[]) || [];
}

export async function fetchEffectiveBreaks(windowId: string): Promise<EffectiveBreak[]> {
  const { data, error } = await supabase
    .rpc('get_window_breaks', {
      p_window_id: windowId,
    });

  if (error) return [];
  return (data as EffectiveBreak[]) || [];
}

export async function fetchProfessionalScheduleData(professionalId: string): Promise<ProfessionalScheduleData[]> {
  const { data, error } = await supabase
    .rpc('get_professional_schedule_data', {
      p_professional_id: professionalId,
    });

  if (error) throw new Error(mapApiError(error));
  return (data as ProfessionalScheduleData[]) || [];
}

export async function fetchScheduleOverrides(professionalId: string, startDate?: string, endDate?: string): Promise<ScheduleOverride[]> {
  let query = supabase
    .from('schedule_overrides')
    .select('*')
    .eq('professional_id', professionalId)
    .order('specific_date');

  if (startDate) query = query.gte('specific_date', startDate);
  if (endDate) query = query.lte('specific_date', endDate);

  const { data, error } = await query;
  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function upsertScheduleOverride(
  professionalId: string,
  specificDate: string,
  options: {
    is_off?: boolean;
    start_time?: string | null;
    end_time?: string | null;
    lunch_start?: string | null;
    lunch_end?: string | null;
    break_start?: string | null;
    break_end?: string | null;
    break_label?: string | null;
    reason?: string | null;
  } = {}
): Promise<void> {
  const { error } = await supabase.rpc('upsert_schedule_override', {
    p_professional_id: professionalId,
    p_specific_date: specificDate,
    p_is_off: options.is_off ?? false,
    p_start_time: options.start_time || null,
    p_end_time: options.end_time || null,
    p_lunch_start: options.lunch_start || null,
    p_lunch_end: options.lunch_end || null,
    p_break_start: options.break_start || null,
    p_break_end: options.break_end || null,
    p_break_label: options.break_label || 'Pausa',
    p_reason: options.reason || null,
  });

  if (error) throw new Error(mapApiError(error));
}

export async function deleteScheduleOverride(professionalId: string, specificDate: string): Promise<void> {
  const { error } = await supabase.rpc('delete_schedule_override', {
    p_professional_id: professionalId,
    p_specific_date: specificDate,
  });

  if (error) throw new Error(mapApiError(error));
}

// ============================================================================
// Past Appointments Cleanup
// ============================================================================

export async function cleanupOldAppointments(): Promise<number> {
  const { data, error } = await supabase.rpc('cleanup_old_appointments');
  if (error) throw new Error(mapApiError(error));
  return data || 0;
}

// ============================================================================
// Fetch client info for appointment details
// ============================================================================

export async function fetchUserById(userId: string): Promise<{ name?: string; phone?: string; email?: string } | null> {
  const { data, error } = await supabase
    .from('users')
    .select('name, phone, email')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as Notification[];
}
