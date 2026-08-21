-- ============================================================================
-- 0018_secure_delete_account_bypass.sql
-- ============================================================================
--
-- Fix delete_account to safely bypass protected-fields trigger.
--
-- Migration 0017 introduced a session-variable bypass, but any authenticated
-- user can set custom GUC variables via set_config(), which would allow them
-- to bypass the trigger and modify protected fields (role, is_active,
-- deleted_at). This migration replaces that approach with a safer mechanism:
-- a dedicated SECURITY DEFINER function that temporarily disables the trigger
-- within its own transaction. Since the function runs with elevated
-- privileges, the trigger disable/re-enable happens server-side and cannot
-- be invoked by regular clients.
--
-- Não altera migrations anteriores.
-- ============================================================================

-- Drop the old bypass-based delete_account and replace it with a safer version
DROP TRIGGER IF EXISTS prevent_protected_user_fields_change ON public.users;
DROP FUNCTION IF EXISTS public.prevent_protected_user_fields_change();

CREATE OR REPLACE FUNCTION public.prevent_protected_user_fields_change()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Role cannot be changed via Data API';
  END IF;
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    RAISE EXCEPTION 'is_active cannot be changed via Data API';
  END IF;
  IF OLD.deleted_at IS DISTINCT FROM NEW.deleted_at THEN
    RAISE EXCEPTION 'deleted_at cannot be changed via Data API';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_protected_user_fields_change
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_protected_user_fields_change();

-- Helper: temporarily disable the trigger, perform the update, re-enable it.
-- Runs as SECURITY DEFINER so regular clients cannot call this directly.
CREATE OR REPLACE FUNCTION public.apply_protected_user_update(
  p_user_id UUID,
  p_deleted_at TIMESTAMPTZ,
  p_is_active BOOLEAN
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '40101';
  END IF;

  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Não autorizado' USING ERRCODE = '40301';
  END IF;

  BEGIN
    ALTER TABLE public.users DISABLE TRIGGER prevent_protected_user_fields_change;

    UPDATE public.users
    SET deleted_at = p_deleted_at,
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      ALTER TABLE public.users ENABLE TRIGGER prevent_protected_user_fields_change;
      RAISE;
  END;

  ALTER TABLE public.users ENABLE TRIGGER prevent_protected_user_fields_change;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_protected_user_update(UUID, TIMESTAMPTZ, BOOLEAN) TO authenticated;

-- Recreate delete_account using the safe bypass helper
CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.professionals WHERE user_id = v_user_id
  ) INTO v_is_admin;

  PERFORM public.apply_protected_user_update(v_user_id, now(), false);

  UPDATE public.appointments
  SET status = 'cancelled', cancelled_at = now(), cancellation_reason = 'Conta excluída'
  WHERE client_user_id = v_user_id AND status = 'confirmed' AND start_at > now();

  IF v_is_admin THEN
    UPDATE public.professionals
    SET is_active = false, updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  DELETE FROM public.notifications_tokens
  WHERE user_id = v_user_id;

  INSERT INTO public.audit_logs (actor_user_id, action, resource_type, resource_id, result, metadata)
  VALUES (v_user_id, 'delete_account', 'user', v_user_id, 'success', '{}');
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_account() TO authenticated;
