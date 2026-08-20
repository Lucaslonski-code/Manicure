export type UserRole = 'client' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Professional {
  id: string;
  user_id: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  default_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalService {
  id: string;
  professional_id: string;
  service_id: string;
  duration_minutes: number;
  price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  client_user_id: string;
  professional_id: string;
  service_id: string;
  start_at: string;
  end_at: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  client_note?: string;
  admin_note?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancelled_by_user_id?: string;
  cancellation_reason?: string;
}

export interface Availability {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface BlockedTime {
  id: string;
  professional_id: string;
  start_at: string;
  end_at: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  appointment_id?: string;
  type: 'confirmation' | 'reschedule' | 'cancellation' | 'reminder';
  channel: 'push' | 'local';
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  sent_at?: string;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  result: 'success' | 'denied';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface BusinessSettings {
  id: string;
  timezone: string;
  min_cancellation_notice_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  session: { user: { id: string; email: string; email_confirmed_at?: string } } | null;
  profile: Profile | null;
  loading: boolean;
  isEmailVerified: boolean;
}
