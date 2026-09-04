-- ============================================================================
-- 0026_fix_real_delete.sql
-- FIX: Allow direct DELETE of appointments (not just cancelled ones)
--   - drop and recreate delete_appointment_by_client WITHOUT status restriction
--   - add delete_appointment_by_admin RPC for professionals
-- ============================================================================

-- 1. Drop existing function (it has status='cancelled' restriction)
DROP FUNCTION IF EXISTS public.delete_appointment_by_client(UUID);

-- 2. Recreate: client can delete any of their own appointments (any status)
CREATE OR REPLACE FUNCTION public.delete_appointment_by_client(
  p_appointment_id UUID
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_client_user_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  SELECT client_user_id
  INTO v_client_user_id
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF v_client_user_id IS NULL THEN
    RAISE EXCEPTION 'Agendamento nao encontrado' USING ERRCODE = '40401';
  END IF;

  IF v_client_user_id != v_caller_id THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '40301';
  END IF;

  DELETE FROM public.appointments
  WHERE id = p_appointment_id;
END;
$$;

-- 3. New RPC: professional/admin can delete appointments they own
CREATE OR REPLACE FUNCTION public.delete_appointment_by_admin(
  p_appointment_id UUID
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_professional_id UUID;
  v_appointment_professional_id UUID;
BEGIN
  v_professional_id := public.get_auth_professional_id();
  IF v_professional_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  SELECT professional_id
  INTO v_appointment_professional_id
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF v_appointment_professional_id IS NULL THEN
    RAISE EXCEPTION 'Agendamento nao encontrado' USING ERRCODE = '40401';
  END IF;

  IF v_appointment_professional_id != v_professional_id THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '40301';
  END IF;

  DELETE FROM public.appointments
  WHERE id = p_appointment_id;
END;
$$;
