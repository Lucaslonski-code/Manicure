-- ============================================================================
-- 0008_delete_account.sql
-- ============================================================================
--
-- RPC para exclusão de conta do próprio usuário.
-- Chamada pelo frontend autenticado.
--
-- Não altera migrations anteriores.
-- Não altera regras de negócio existentes.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS void
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  UPDATE public.users
  SET deleted_at = now(), is_active = false, updated_at = now()
  WHERE id = v_user_id;

  UPDATE public.appointments
  SET status = 'cancelled', cancelled_at = now(), cancellation_reason = 'Conta excluída'
  WHERE client_user_id = v_user_id AND status = 'confirmed' AND start_at > now();

  DELETE FROM public.notifications_tokens
  WHERE user_id = v_user_id;

  INSERT INTO public.audit_logs (actor_user_id, action, resource_type, resource_id, result, metadata)
  VALUES (v_user_id, 'delete_account', 'user', v_user_id, 'success', '{}');
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_account() TO authenticated;
