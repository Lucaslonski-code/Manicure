-- ============================================================================
-- 0013_restrict_rate_limit_grants.sql
-- ============================================================================
--
-- Revoke check_rate_limit from anon and authenticated.
-- Only service_role should be able to call it (from Edge Functions).
--
-- Não altera migrations anteriores.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER, INTEGER) FROM anon, authenticated;
