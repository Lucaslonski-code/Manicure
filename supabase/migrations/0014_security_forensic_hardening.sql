-- ============================================================================
-- 0014_security_forensic_hardening.sql
-- ============================================================================
--
-- Forensic security hardening based on comprehensive audit.
-- Addresses critical and high severity findings.
--
-- Changes:
-- 1. Fix delete account cascade (appointments.client_user_id ON DELETE SET NULL)
-- 2. Grant EXECUTE on missing helper functions and RPCs
-- 3. Add notifications INSERT policy and record_notification RPC
-- 4. Remove client direct INSERT on appointments (enforce RPC-only)
-- 5. Add admin INSERT policy on appointments
--
-- Não altera migrations anteriores.
-- ============================================================================

-- ============================================================================
-- 1. FIX DELETE ACCOUNT CASCADE
-- ============================================================================
-- appointments.client_user_id currently has ON DELETE RESTRICT, which blocks
-- deletion of users who have appointments. Change to ON DELETE SET NULL to
-- preserve appointment history while anonymizing the client reference.

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_client_user_id_fkey;

ALTER TABLE public.appointments
  ALTER COLUMN client_user_id DROP NOT NULL,
  ADD CONSTRAINT appointments_client_user_id_fkey 
    FOREIGN KEY (client_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. GRANT EXECUTE ON MISSING FUNCTIONS
-- ============================================================================
-- Helper functions used by RLS policies
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_professional_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated;

-- Business-logic RPCs (ensure grants exist even if missing from earlier migrations)
GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID, UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment(UUID, UUID, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment_by_client(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_appointment_by_admin(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment_by_admin(UUID, TEXT) TO authenticated;

-- ============================================================================
-- 3. NOTIFICATIONS INSERT POLICY AND RPC
-- ============================================================================
-- Defense-in-depth: explicit INSERT policy for internal/Edge Function use.
-- service_role bypasses RLS, but this policy makes intent explicit and
-- protects against accidental exposure if auth configuration changes.

CREATE POLICY notifications_insert_internal ON public.notifications
  FOR INSERT WITH CHECK (false);

-- SECURITY DEFINER RPC for server-side notification recording.
-- Edge Functions use this instead of direct Data API INSERT.
-- Validates caller identity against appointment ownership.

CREATE OR REPLACE FUNCTION public.record_notification(
  p_user_id UUID,
  p_appointment_id UUID,
  p_type TEXT,
  p_channel TEXT,
  p_status TEXT
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_appointment_exists BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '40101';
  END IF;

  -- Validate that the caller is involved in the appointment
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE id = p_appointment_id
      AND (client_user_id = v_caller_id OR professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = v_caller_id
      ))
  ) INTO v_appointment_exists;

  IF NOT v_appointment_exists THEN
    RAISE EXCEPTION 'Agendamento não encontrado ou acesso negado' USING ERRCODE = '40401';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    appointment_id,
    type,
    channel,
    status
  ) VALUES (
    p_user_id,
    p_appointment_id,
    p_type,
    p_channel,
    p_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_notification(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;

-- ============================================================================
-- 4. REMOVE CLIENT DIRECT INSERT ON APPOINTMENTS
-- ============================================================================
-- Clients must use book_appointment RPC which enforces all business rules.
-- Direct Data API INSERT bypasses availability, blocked times, service validation.

DROP POLICY IF EXISTS appointments_insert_client ON public.appointments;

-- ============================================================================
-- 5. ADD ADMIN INSERT POLICY ON APPOINTMENTS
-- ============================================================================
-- Admins can insert appointments for their own professional.
-- This aligns with documentation (docs/08-modelo-banco-dados.md §8.6).

CREATE POLICY appointments_insert_admin ON public.appointments
  FOR INSERT WITH CHECK (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );
