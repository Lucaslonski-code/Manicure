import { supabase } from '../supabase/client';
import type { Professional, Service, ProfessionalService, Availability, BlockedTime, Appointment, BusinessSettings } from '../supabase/types';

export async function fetchProfessionals(): Promise<Professional[]> {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('is_active', true)
    .order('display_name');

  if (error) throw error;
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

  if (error) throw error;
  return data || [];
}

export async function fetchProfessionalServices(professionalId: string): Promise<(ProfessionalService & { service: Service })[]> {
  const { data, error } = await supabase
    .from('professional_services')
    .select('*, service:services(*)')
    .eq('professional_id', professionalId)
    .eq('is_active', true)
    .order('service:services(name)');

  if (error) throw error;
  return data || [];
}

export async function fetchAvailability(professionalId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('professional_id', professionalId)
    .order('weekday');

  if (error) throw error;
  return data || [];
}

export async function fetchBlockedTimes(professionalId: string): Promise<BlockedTime[]> {
  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('professional_id', professionalId)
    .gte('start_at', new Date().toISOString())
    .order('start_at');

  if (error) throw error;
  return data || [];
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('start_at', { ascending: true });

  if (error) throw error;
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

  if (error) throw error;
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

  if (error) throw error;

  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', data)
    .single();

  if (fetchError) throw fetchError;
  return appointment;
}

export async function cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_appointment_by_client', {
    p_appointment_id: appointmentId,
    p_reason: reason,
  });

  if (error) throw error;
}

export async function rescheduleAppointment(appointmentId: string, newStartAt: string): Promise<void> {
  const { error } = await supabase.rpc('reschedule_appointment_by_admin', {
    p_appointment_id: appointmentId,
    p_new_start_at: newStartAt,
  });

  if (error) throw error;
}

export async function cancelAppointmentByAdmin(appointmentId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_appointment_by_admin', {
    p_appointment_id: appointmentId,
    p_reason: reason,
  });

  if (error) throw error;
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw error;
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
