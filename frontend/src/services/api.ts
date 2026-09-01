import { supabase } from '../supabase/client';
import type { Professional, Service, ProfessionalService, Availability, BlockedTime, Appointment, BusinessSettings, Notification, WorkSchedule, ScheduleOverride, EffectiveSchedule } from '../supabase/types';

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
    return 'Registro não encontrado';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet.';
  }
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Sessão expirada. Entre novamente.';
  }
  if (message.includes('forbidden') || message.includes('403')) {
    return 'Acesso negado';
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'Recurso não encontrado';
  }
  if (message.includes('conflict') || message.includes('409') || message.includes('overlap')) {
    return 'Horário indisponível ou conflitante';
  }
  if (message.includes('time outside availability') || message.includes('422')) {
    return 'Horário fora da disponibilidade';
  }
  if (message.includes('blocked') || message.includes('block')) {
    return 'Horário bloqueado';
  }
  if (message.includes('service not available') || message.includes('professional not available')) {
    return 'Serviço ou profissional indisponível';
  }
  if (message.includes('appointment cannot be cancelled') || message.includes('cannot be rescheduled')) {
    return 'Operação não permitida para este agendamento';
  }
  if (message.includes('time conflict')) {
    return 'Conflito de horário';
  }
  return 'Erro ao processar solicitação';
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

export async function fetchAvailability(professionalId?: string | null): Promise<Availability[]> {
  const query = supabase
    .from('availability')
    .select('*');

  if (professionalId) {
    query.eq('professional_id', professionalId);
  }

  const { data, error } = await query.order('weekday');

  if (error) throw new Error(mapApiError(error));
  return data || [];
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
  const ext = imageUri.split('.').pop() || 'jpg';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const response = await fetch(imageUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: true,
    });

  if (uploadError) throw new Error('Erro ao enviar imagem: ' + (uploadError.message || uploadError.name));

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

export async function deleteCancelledAppointment(appointmentId: string): Promise<void> {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user.id;
  if (!userId) throw new Error('Não autenticado');

  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('status, client_user_id')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appointment) throw new Error('Agendamento não encontrado');
  if (appointment.client_user_id !== userId) throw new Error('Acesso negado');
  if (appointment.status !== 'cancelled') throw new Error('Somente agendamentos cancelados podem ser excluídos');

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw new Error(mapApiError(error));
}

// ============================================================================
// Work Schedules API
// ============================================================================

export async function fetchWorkSchedules(professionalId: string): Promise<WorkSchedule[]> {
  const { data, error } = await supabase
    .from('work_schedules')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('is_active', true)
    .order('weekday');

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function upsertWorkSchedules(professionalId: string, schedules: Array<{
  weekday: number;
  start_time: string;
  end_time: string;
  lunch_start?: string | null;
  lunch_end?: string | null;
}>): Promise<void> {
  const { error } = await supabase.rpc('upsert_work_schedules', {
    p_professional_id: professionalId,
    p_schedules: JSON.stringify(schedules),
  });

  if (error) throw new Error(mapApiError(error));
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

export async function fetchEffectiveSchedule(professionalId: string, date: string): Promise<EffectiveSchedule | null> {
  const { data, error } = await supabase
    .rpc('get_effective_schedule', {
      p_professional_id: professionalId,
      p_date: date,
    })
    .limit(1)
    .single();

  if (error) return null;
  return data as EffectiveSchedule;
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
