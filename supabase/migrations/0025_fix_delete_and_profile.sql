-- ============================================================================
-- 0025_fix_delete_and_profile.sql
-- FIX 1: delete_appointment_by_client RPC (SECURITY DEFINER)
--   Clients need a proper RPC to delete their own cancelled appointments.
--   The direct Data API DELETE is blocked by RLS (no client DELETE policy).
-- FIX 2: No schema changes needed for profile update (RLS already allows it)
-- ============================================================================

-- ============================================================================
-- 1. RPC: delete_appointment_by_client
--    Allows a client to permanently delete their own cancelled appointment.
--    SECURITY DEFINER bypasses RLS, authorization is checked inside the function.
-- ============================================================================
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
  v_status TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  SELECT client_user_id, status
  INTO v_client_user_id, v_status
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF v_client_user_id IS NULL THEN
    RAISE EXCEPTION 'Agendamento nao encontrado' USING ERRCODE = '40401';
  END IF;

  IF v_client_user_id != v_caller_id THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '40301';
  END IF;

  IF v_status != 'cancelled' THEN
    RAISE EXCEPTION 'Somente agendamentos cancelados podem ser excluidos' USING ERRCODE = '42201';
  END IF;

  DELETE FROM public.appointments
  WHERE id = p_appointment_id;
END;
$$;
