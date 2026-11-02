-- ============================================================
-- Activity Log — registo imutável de alterações
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Tipo de ação
DO $$ BEGIN
  CREATE TYPE public.activity_action AS ENUM (
    'item_created',
    'item_updated',
    'item_deleted',
    'status_changed',
    'member_joined',
    'member_removed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tabela de log — sem UPDATE, sem DELETE via RLS
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id    UUID        NOT NULL REFERENCES public.houses(id)   ON DELETE CASCADE,
  user_id     UUID        REFERENCES public.profiles(id)          ON DELETE SET NULL,
  action      public.activity_action NOT NULL,
  item_id     UUID,                          -- referência soft (item pode ser apagado)
  item_name   TEXT,                          -- guardamos o nome no momento da ação
  old_value   TEXT,                          -- valor anterior (ex: status antigo)
  new_value   TEXT,                          -- valor novo    (ex: status novo)
  metadata    JSONB DEFAULT '{}',            -- dados extras opcionais
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS activity_log_house_idx ON public.activity_log (house_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_item_idx  ON public.activity_log (item_id);

-- ── RLS — só leitura para membros, escrita só via trigger (SECURITY DEFINER) ──
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Membros da casa podem VER o log
CREATE POLICY "activity_log_select"
  ON public.activity_log FOR SELECT
  USING (public.is_house_member(house_id));

-- NINGUÉM pode inserir diretamente pelo cliente (só o trigger)
CREATE POLICY "activity_log_insert_denied"
  ON public.activity_log FOR INSERT
  WITH CHECK (false);

-- NINGUÉM pode atualizar
CREATE POLICY "activity_log_update_denied"
  ON public.activity_log FOR UPDATE
  USING (false);

-- NINGUÉM pode apagar
CREATE POLICY "activity_log_delete_denied"
  ON public.activity_log FOR DELETE
  USING (false);

-- ── Trigger em items — regista cada alteração automaticamente ──
CREATE OR REPLACE FUNCTION public.log_item_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_action   public.activity_action;
  v_old_val  TEXT := NULL;
  v_new_val  TEXT := NULL;
  v_user_id  UUID;
  v_item_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action    := 'item_created';
    v_user_id   := NEW.created_by;
    v_item_name := NEW.name;

  ELSIF TG_OP = 'DELETE' THEN
    v_action    := 'item_deleted';
    v_user_id   := OLD.updated_by;
    v_item_name := OLD.name;

  ELSIF TG_OP = 'UPDATE' THEN
    v_user_id   := NEW.updated_by;
    v_item_name := NEW.name;

    -- Só regista se o status mudou
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action  := 'status_changed';
      v_old_val := OLD.status::TEXT;
      v_new_val := NEW.status::TEXT;

    -- Outros campos alterados (nome, notas, categoria, quantidade, imagem)
    ELSIF OLD.name IS DISTINCT FROM NEW.name
       OR OLD.notes IS DISTINCT FROM NEW.notes
       OR OLD.category_id IS DISTINCT FROM NEW.category_id
       OR OLD.quantity IS DISTINCT FROM NEW.quantity
       OR OLD.image_url IS DISTINCT FROM NEW.image_url
    THEN
      v_action  := 'item_updated';
      v_old_val := OLD.name;
      v_new_val := NEW.name;

    ELSE
      -- Nenhuma alteração relevante (ex: só updated_at), não regista
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.activity_log
    (house_id, user_id, action, item_id, item_name, old_value, new_value)
  VALUES (
    CASE WHEN TG_OP = 'DELETE' THEN OLD.house_id ELSE NEW.house_id END,
    v_user_id,
    v_action,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    v_item_name,
    v_old_val,
    v_new_val
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS items_activity_log ON public.items;
CREATE TRIGGER items_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.log_item_changes();

-- ── Trigger em house_members — regista entradas/saídas ──
CREATE OR REPLACE FUNCTION public.log_member_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (house_id, user_id, action, metadata)
    VALUES (NEW.house_id, NEW.user_id, 'member_joined', jsonb_build_object('role', NEW.role));

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_log (house_id, user_id, action, metadata)
    VALUES (OLD.house_id, OLD.user_id, 'member_removed', jsonb_build_object('role', OLD.role));
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS house_members_activity_log ON public.house_members;
CREATE TRIGGER house_members_activity_log
  AFTER INSERT OR DELETE ON public.house_members
  FOR EACH ROW EXECUTE FUNCTION public.log_member_changes();

-- Realtime para o log (para atualizar em tempo real na UI)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
EXCEPTION WHEN others THEN NULL;
END $$;
