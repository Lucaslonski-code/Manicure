-- ============================================================================
-- 0010_fix_delete_account.sql
-- ============================================================================
--
-- Fix delete_account RPC to handle admin accounts properly.
-- Migration 0008 created the initial version.
-- This migration replaces it with enhanced logic.
--
-- Não altera migrations anteriores.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS void
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.professionals WHERE user_id = v_user_id
  ) INTO v_is_admin;

  -- Soft delete user
  UPDATE public.users
  SET deleted_at = now(), is_active = false, updated_at = now()
  WHERE id = v_user_id;

  -- Cancel future appointments for this user as client
  UPDATE public.appointments
  SET status = 'cancelled', cancelled_at = now(), cancellation_reason = 'Conta excluída'
  WHERE client_user_id = v_user_id AND status = 'confirmed' AND start_at > now();

  -- If admin, inactivate professional record
  IF v_is_admin THEN
    UPDATE public.professionals
    SET is_active = false, updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  -- Remove notification tokens
  DELETE FROM public.notifications_tokens
  WHERE user_id = v_user_id;

  -- Audit log
  INSERT INTO public.audit_logs (actor_user_id, action, resource_type, resource_id, result, metadata)
  VALUES (v_user_id, 'delete_account', 'user', v_user_id, 'success', '{}');
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_account() TO authenticated;
