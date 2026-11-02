-- ============================================================
-- Push Subscriptions — guarda as subscrições Web Push
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  house_id   UUID NOT NULL REFERENCES public.houses(id)   ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)   -- um utilizador pode ter vários dispositivos
);

CREATE INDEX IF NOT EXISTS push_subs_house_idx ON public.push_subscriptions (house_id, user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Utilizador gere as suas próprias subscrições
CREATE POLICY "push_subs_select"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "push_subs_insert"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subs_delete"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Edge Function pode ler todas as subs de uma casa (service role)
-- Não é necessário RLS adicional pois a Edge Function usa service_role key
