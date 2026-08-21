-- ============================================================================
-- 0016_fix_record_notification_caller.sql
-- ============================================================================
--
-- Fix record_notification to accept caller_id explicitly.
-- When called from Edge Functions using service_role, auth.uid() is NULL.
-- The caller_id must be passed by the trusted Edge Function.
--
-- Não altera migrations anteriores.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_notification(
  p_user_id UUID,
  p_appointment_id UUID,
  p_type TEXT,
  p_channel TEXT,
  p_status TEXT,
  p_caller_id UUID
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_appointment_exists BOOLEAN;
BEGIN
  -- Validate that the caller is involved in the appointment
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE id = p_appointment_id
      AND (client_user_id = p_caller_id OR professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = p_caller_id
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

GRANT EXECUTE ON FUNCTION public.record_notification(UUID, UUID, TEXT, TEXT, TEXT, UUID) TO service_role;
