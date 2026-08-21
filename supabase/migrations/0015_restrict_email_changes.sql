-- ============================================================================
-- 0015_restrict_email_changes.sql
-- ============================================================================
--
-- Prevent clients from changing email via Data API.
-- Email changes must go through Supabase Auth's updateUser flow.
--
-- Não altera migrations anteriores.
-- ============================================================================

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
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    RAISE EXCEPTION 'Email cannot be changed via Data API. Use the app settings to change your email.';
  END IF;
  RETURN NEW;
END;
$$;
