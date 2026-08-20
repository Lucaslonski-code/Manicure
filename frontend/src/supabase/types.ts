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
}

export interface AuthState {
  session: { user: { id: string; email: string; email_confirmed_at?: string } } | null;
  profile: Profile | null;
  loading: boolean;
  isEmailVerified: boolean;
}
