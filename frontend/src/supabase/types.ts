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
  avatar_url?: string;
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
  image_url?: string;
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

// ============================================================================
// NEW TYPES — Schedule Reformulation
// ============================================================================

/** A single work window (one row per window per weekday) */
export interface WorkWindow {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  sort_order: number;
  is_active: boolean;
  effective_from: string;
  effective_until?: string;
  created_at: string;
  updated_at: string;
}

/** A break within a work window */
export interface ScheduleBreak {
  id: string;
  work_window_id: string;
  start_time: string;
  end_time: string;
  label: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Schedule override for a specific date */
export interface ScheduleOverride {
  id: string;
  professional_id: string;
  specific_date: string;
  is_off: boolean;
  start_time?: string;
  end_time?: string;
  lunch_start?: string;
  lunch_end?: string;
  break_start?: string;
  break_end?: string;
  break_label?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

/** Effective window returned by get_effective_windows RPC */
export interface EffectiveWindow {
  window_id: string | null;
  start_time: string;
  end_time: string;
  is_off: boolean;
  source: 'override' | 'work_window';
}

/** Break returned by get_window_breaks RPC */
export interface EffectiveBreak {
  break_id: string;
  start_time: string;
  end_time: string;
  label: string;
}

/** Window input for upsert_work_windows RPC */
export interface WorkWindowInput {
  weekday: number;
  start_time: string;
  end_time: string;
  sort_order?: number;
  effective_from?: string;
  effective_until?: string;
  breaks?: ScheduleBreakInput[];
}

/** Break input nested in WorkWindowInput */
export interface ScheduleBreakInput {
  start_time: string;
  end_time: string;
  label?: string;
  sort_order?: number;
}

/** Complete schedule data returned by get_professional_schedule_data RPC */
export interface ProfessionalScheduleData {
  window_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  sort_order: number;
  is_active: boolean;
  effective_from: string;
  effective_until?: string;
  break_id?: string;
  break_start?: string;
  break_end?: string;
  break_label?: string;
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
  isProfessional: boolean;
  professionalId: string | null;
}
