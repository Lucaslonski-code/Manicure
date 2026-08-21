-- ============================================================================
-- 0017_fix_delete_account_trigger.sql
-- ============================================================================
--
-- Fix prevent_protected_user_fields_change trigger to allow legitimate
-- updates from SECURITY DEFINER functions (e.g., delete_account).
--
-- The trigger blocks updates to role, is_active, and deleted_at to prevent
-- clients from changing these fields via Data API. However, it also blocks
-- legitimate updates from SECURITY DEFINER functions like delete_account.
--
-- Solution: use a session variable to bypass the trigger for trusted functions.
--
-- Não altera migrations anteriores.
-- ============================================================================

-- Drop existing trigger (function will be replaced)
DROP TRIGGER IF EXISTS prevent_protected_user_fields_change ON public.users;

-- Recreate function with session variable check
CREATE OR REPLACE FUNCTION public.prevent_protected_user_fields_change()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_allow_protected TEXT;
BEGIN
  -- Allow updates from trusted SECURITY DEFINER functions
  v_allow_protected := current_setting('app.allow_protected_fields', true);
  IF v_allow_protected::text = 'true' THEN
    RETURN NEW;
  END IF;

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

-- Recreate trigger
CREATE TRIGGER prevent_protected_user_fields_change
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_protected_user_fields_change();

-- Update delete_account to set session variable before updating protected fields
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

  -- Allow trigger to bypass protected fields check
  PERFORM set_config('app.allow_protected_fields', 'true', true);

  UPDATE public.users
  SET deleted_at = now(), is_active = false, updated_at = now()
  WHERE id = v_user_id;

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
