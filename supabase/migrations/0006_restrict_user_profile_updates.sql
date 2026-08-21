-- ============================================================================
-- 0006_restrict_user_profile_updates.sql
-- ============================================================================
--
-- Restringe a atualização de perfil em public.users:
-- - Cliente pode alterar apenas name e phone
-- - role, is_active, deleted_at não podem ser alterados via Data API
-- - Admin comum não pode promover/rebaixar usuários via UPDATE comum
--
-- Defesa em profundidade:
-- - Policy RLS permite UPDATE apenas do próprio perfil
-- - Trigger impede alteração de campos protegidos
--
-- Não altera migrations anteriores.
-- Não altera regras de negócio existentes.
-- ============================================================================

-- Drop existing self-update policy
DROP POLICY IF EXISTS users_update_self ON public.users;

-- Create restricted self-update policy
-- Only the owner can update their own profile
CREATE POLICY users_update_self ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Defense in depth: prevent changes to protected fields via Data API
CREATE OR REPLACE FUNCTION public.prevent_protected_user_fields_change()
RETURNS TRIGGER
LANGUAGE PLPGSQL
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

-- Clean up any previous temporary triggers from manual testing
DROP TRIGGER IF EXISTS prevent_role_change ON public.users;
DROP TRIGGER IF EXISTS prevent_protected_user_fields_change ON public.users;

CREATE TRIGGER prevent_protected_user_fields_change
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_protected_user_fields_change();
