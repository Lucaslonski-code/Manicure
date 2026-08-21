-- ============================================================================
-- 0012_fix_rate_limit_grants.sql
-- ============================================================================
--
-- Grant check_rate_limit to service_role so Edge Functions using the
-- service role key can call it.
--
-- Não altera migrations anteriores.
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER, INTEGER) TO service_role;
