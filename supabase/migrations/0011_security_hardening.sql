-- ============================================================================
-- 0011_security_hardening.sql
-- ============================================================================
--
-- Additional security hardening:
-- 1. Fix notifications_tokens trigger function (SECURITY DEFINER + search_path)
-- 2. Add length constraints to appointment text fields
-- 3. Create rate_limits table for account deletion endpoint
--
-- Não altera migrations anteriores.
-- ============================================================================

-- ============================================================================
-- 1. Fix notifications_tokens trigger function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_notifications_tokens_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. Add length constraints to appointment text fields
-- ============================================================================
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_client_note_length CHECK (client_note IS NULL OR length(client_note) <= 500),
  ADD CONSTRAINT appointments_admin_note_length CHECK (admin_note IS NULL OR length(admin_note) <= 1000),
  ADD CONSTRAINT appointments_cancellation_reason_length CHECK (cancellation_reason IS NULL OR length(cancellation_reason) <= 500);

-- ============================================================================
-- 3. Rate limits table for delete-account-external
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  CONSTRAINT rate_limits_key_action_unique UNIQUE (key_hash, action)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_action ON public.rate_limits(key_hash, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked_until ON public.rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only internal processes can manage rate limits
CREATE POLICY rate_limits_select_internal ON public.rate_limits
  FOR SELECT USING (false);

CREATE POLICY rate_limits_insert_internal ON public.rate_limits
  FOR INSERT WITH CHECK (false);

CREATE POLICY rate_limits_update_internal ON public.rate_limits
  FOR UPDATE USING (false);

CREATE POLICY rate_limits_delete_internal ON public.rate_limits
  FOR DELETE USING (false);

-- Function to check and record rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key_hash TEXT,
  p_action TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15,
  p_block_minutes INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_record RECORD;
  v_window_start TIMESTAMPTZ;
  v_recent_attempts INTEGER;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Clean up old records
  DELETE FROM public.rate_limits
  WHERE last_attempt_at < v_window_start - INTERVAL '1 hour';

  -- Get or create record
  SELECT * INTO v_record
  FROM public.rate_limits
  WHERE key_hash = p_key_hash AND action = p_action;

  IF v_record IS NULL THEN
    INSERT INTO public.rate_limits (key_hash, action, attempts, first_attempt_at, last_attempt_at)
    VALUES (p_key_hash, p_action, 1, now(), now());
    RETURN TRUE;
  END IF;

  -- Check if blocked
  IF v_record.blocked_until IS NOT NULL AND now() < v_record.blocked_until THEN
    RETURN FALSE;
  END IF;

  -- Count recent attempts
  SELECT COUNT(*) INTO v_recent_attempts
  FROM public.rate_limits
  WHERE key_hash = p_key_hash 
    AND action = p_action 
    AND last_attempt_at >= v_window_start;

  -- If too many attempts, block
  IF v_recent_attempts >= p_max_attempts THEN
    UPDATE public.rate_limits
    SET blocked_until = now() + (p_block_minutes || ' minutes')::INTERVAL,
        last_attempt_at = now()
    WHERE key_hash = p_key_hash AND action = p_action;
    RETURN FALSE;
  END IF;

  -- Record attempt
  UPDATE public.rate_limits
  SET attempts = attempts + 1, last_attempt_at = now()
  WHERE key_hash = p_key_hash AND action = p_action;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER, INTEGER) TO authenticated, anon;
