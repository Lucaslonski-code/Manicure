-- ============================================================================
-- 0001_initial_schema.sql
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS (DOMAIN)
-- Representação pública do usuário autenticado (auth.users).
-- NÃO armazena senha/hash. Integridade referencial com auth.users.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT users_email_length CHECK (length(trim(email)) > 0),
  CONSTRAINT users_name_length CHECK (length(trim(name)) > 0)
);

ALTER TABLE public.users ADD CONSTRAINT users_auth_user_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- ============================================================================
-- PROFESSIONALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT professionals_user_id_unique UNIQUE (user_id),
  CONSTRAINT professionals_display_name_length CHECK (length(trim(display_name)) > 0)
);

-- ============================================================================
-- SERVICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  default_duration_minutes INTEGER NOT NULL CHECK (default_duration_minutes > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT services_name_length CHECK (length(trim(name)) > 0)
);

-- ============================================================================
-- PROFESSIONAL_SERVICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT professional_services_professional_service_unique UNIQUE (professional_id, service_id)
);

-- ============================================================================
-- APPOINTMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  client_note TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  cancelled_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  CONSTRAINT appointments_end_after_start CHECK (end_at > start_at),
  CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
  professional_id WITH =,
  tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (status = 'confirmed')
);

-- ============================================================================
-- AVAILABILITY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT availability_professional_weekday_unique UNIQUE (professional_id, weekday),
  CONSTRAINT availability_end_after_start CHECK (end_time > start_time)
);

-- ============================================================================
-- BLOCKED_TIMES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT blocked_times_end_after_start CHECK (end_at > start_at)
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('confirmation', 'reschedule', 'cancellation', 'reminder')),
  channel TEXT NOT NULL CHECK (channel IN ('push', 'local')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- ============================================================================
-- AUDIT_LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'denied')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- BUSINESS_SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  min_cancellation_notice_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default business settings only if table is empty
INSERT INTO public.business_settings (id, timezone, min_cancellation_notice_minutes)
SELECT gen_random_uuid(), 'America/Sao_Paulo', 60
WHERE NOT EXISTS (SELECT 1 FROM public.business_settings);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON public.professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_is_active ON public.professionals(is_active);

CREATE INDEX IF NOT EXISTS idx_professional_services_professional_id ON public.professional_services(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_service_id ON public.professional_services(service_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_is_active ON public.professional_services(is_active);

CREATE INDEX IF NOT EXISTS idx_appointments_client_user_id ON public.appointments(client_user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON public.appointments(professional_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_start_at ON public.appointments(start_at);

CREATE INDEX IF NOT EXISTS idx_availability_professional_weekday ON public.availability(professional_id, weekday);
CREATE INDEX IF NOT EXISTS idx_blocked_times_professional_start ON public.blocked_times(professional_id, start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON public.audit_logs(actor_user_id, created_at);
