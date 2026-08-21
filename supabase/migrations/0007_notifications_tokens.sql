-- ============================================================================
-- 0007_notifications_tokens.sql
-- ============================================================================
--
-- Tabela para armazenar tokens de push notification dos dispositivos.
-- Necessária para o envio de push notifications via Expo Push API.
--
-- Não altera migrations anteriores.
-- Não altera regras de negócio existentes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notifications_tokens_user_token_unique UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_notifications_tokens_user_id ON public.notifications_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tokens_is_active ON public.notifications_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_tokens_token ON public.notifications_tokens(token);

-- RLS
ALTER TABLE public.notifications_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read own tokens
CREATE POLICY notifications_tokens_select_self ON public.notifications_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own tokens
CREATE POLICY notifications_tokens_insert_self ON public.notifications_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own tokens
CREATE POLICY notifications_tokens_update_self ON public.notifications_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Only internal processes can delete tokens (via SECURITY DEFINER functions)
CREATE POLICY notifications_tokens_delete_internal ON public.notifications_tokens
  FOR DELETE USING (false);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_notifications_tokens_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_notifications_tokens_updated_at ON public.notifications_tokens;
CREATE TRIGGER update_notifications_tokens_updated_at
  BEFORE UPDATE ON public.notifications_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notifications_tokens_updated_at();
