-- ============================================================================
-- 0005_audit_triggers.sql
-- ============================================================================

-- ============================================================================
-- HELPER: log_audit_event
-- Insere audit_logs de forma segura, ignorando RLS via SECURITY DEFINER.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_actor_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    created_at
  ) VALUES (
    p_actor_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata,
    now()
  );
END;
$$;

-- ============================================================================
-- TRIGGER: audit_appointment_changes
-- Registra criação, alteração, cancelamento, reagendamento e exclusão
-- de agendamentos em audit_logs.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.audit_appointment_changes()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_user_id UUID;
  v_action TEXT;
  v_metadata JSONB;
BEGIN
  v_actor_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_metadata := jsonb_build_object(
      'professional_id', NEW.professional_id,
      'service_id', NEW.service_id,
      'start_at', NEW.start_at,
      'end_at', NEW.end_at,
      'status', NEW.status
    );
    PERFORM public.log_audit_event(
      v_actor_user_id,
      v_action,
      'appointment',
      NEW.id,
      v_metadata
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
      v_action := 'cancel';
      v_metadata := jsonb_build_object(
        'professional_id', NEW.professional_id,
        'service_id', NEW.service_id,
        'start_at', NEW.start_at,
        'end_at', NEW.end_at,
        'cancelled_at', NEW.cancelled_at,
        'cancelled_by_user_id', NEW.cancelled_by_user_id,
        'cancellation_reason', NEW.cancellation_reason
      );
    ELSIF OLD.start_at IS DISTINCT FROM NEW.start_at
       OR OLD.end_at IS DISTINCT FROM NEW.end_at THEN
      v_action := 'reschedule';
      v_metadata := jsonb_build_object(
        'professional_id', NEW.professional_id,
        'service_id', NEW.service_id,
        'old_start_at', OLD.start_at,
        'old_end_at', OLD.end_at,
        'new_start_at', NEW.start_at,
        'new_end_at', NEW.end_at
      );
    ELSE
      v_action := 'update';
      v_metadata := jsonb_build_object(
        'professional_id', NEW.professional_id,
        'service_id', NEW.service_id,
        'start_at', NEW.start_at,
        'end_at', NEW.end_at,
        'status', NEW.status
      );
    END IF;

    PERFORM public.log_audit_event(
      v_actor_user_id,
      v_action,
      'appointment',
      NEW.id,
      v_metadata
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_metadata := jsonb_build_object(
      'professional_id', OLD.professional_id,
      'service_id', OLD.service_id,
      'start_at', OLD.start_at,
      'end_at', OLD.end_at,
      'status', OLD.status
    );
    PERFORM public.log_audit_event(
      v_actor_user_id,
      v_action,
      'appointment',
      OLD.id,
      v_metadata
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_appointment_changes ON public.appointments;
CREATE TRIGGER audit_appointment_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_appointment_changes();
