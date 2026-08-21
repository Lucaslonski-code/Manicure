import { supabase } from '../supabase/client';
import type { Professional, Service, ProfessionalService, Availability, BlockedTime, Appointment, BusinessSettings } from '../supabase/types';

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
    .order('service:services(name)');

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function fetchAvailability(professionalId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('professional_id', professionalId)
    .order('weekday');

  if (error) throw new Error(mapApiError(error));
  return data || [];
}

export async function fetchBlockedTimes(professionalId: string): Promise<BlockedTime[]> {
  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('professional_id', professionalId)
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
