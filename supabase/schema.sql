-- ============================================================================
-- ESTOQUE CASA — SCHEMA RELACIONAL COMPLETO (FASE 2)
-- Execute no SQL Editor do Supabase (idempotente — pode rodar várias vezes)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. ENUMS ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.house_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.item_status AS ENUM ('in_stock', 'running_low', 'out_of_stock');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_action AS ENUM (
    'item_added', 'item_updated', 'item_deleted', 'status_changed',
    'quantity_changed', 'market_completed', 'member_joined', 'member_left'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. FUNÇÕES AUXILIARES ─────────────────────────────────────────────────────

-- 2.1 Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2.2 Verifica se o utilizador autenticado é membro da casa
CREATE OR REPLACE FUNCTION public.is_house_member(p_house_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_members
    WHERE house_id = p_house_id AND user_id = auth.uid()
  );
$$;

-- 2.3 Verifica se o utilizador autenticado é dono da casa
CREATE OR REPLACE FUNCTION public.is_house_owner(p_house_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.houses
    WHERE id = p_house_id AND owner_id = auth.uid()
  );
$$;

-- 2.4 Verifica se o utilizador autenticado é admin ou dono da casa
CREATE OR REPLACE FUNCTION public.is_house_admin(p_house_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_members
    WHERE house_id = p_house_id
      AND user_id  = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- 2.5 Regista automaticamente na activity_log quando items muda
CREATE OR REPLACE FUNCTION public.log_item_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item_name text;
BEGIN
  -- Tenta obter o nome via join com products
  IF TG_OP = 'DELETE' THEN
    SELECT p.name INTO v_item_name
      FROM public.products p WHERE p.id = OLD.product_id;

    INSERT INTO public.activity_log (house_id, user_id, action, item_id, item_name)
    VALUES (OLD.house_id, auth.uid(), 'item_deleted', OLD.id, v_item_name);
    RETURN OLD;
  END IF;

  SELECT p.name INTO v_item_name
    FROM public.products p WHERE p.id = NEW.product_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (house_id, user_id, action, item_id, item_name)
    VALUES (NEW.house_id, auth.uid(), 'item_added', NEW.id, v_item_name);

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.activity_log
        (house_id, user_id, action, item_id, item_name, old_value, new_value)
      VALUES
        (NEW.house_id, auth.uid(), 'status_changed', NEW.id, v_item_name,
         OLD.status::text, NEW.status::text);
    ELSE
      INSERT INTO public.activity_log (house_id, user_id, action, item_id, item_name)
      VALUES (NEW.house_id, auth.uid(), 'item_updated', NEW.id, v_item_name);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2.6 Gera novo código de convite único (6 chars hex maiúsculas)
CREATE OR REPLACE FUNCTION public.regenerate_invite_code(p_house_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_code text;
BEGIN
  IF NOT public.is_house_owner(p_house_id) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  LOOP
    new_code := upper(substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.houses WHERE invite_code = new_code
    );
  END LOOP;

  UPDATE public.houses SET invite_code = new_code WHERE id = p_house_id;
  RETURN new_code;
END;
$$;

-- ── 3. TABELAS ────────────────────────────────────────────────────────────────

-- 3.1 Profiles (espelho de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  full_name  text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.2 Houses
CREATE TABLE IF NOT EXISTS public.houses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  invite_code text NOT NULL UNIQUE
    DEFAULT upper(SUBSTRING(encode(gen_random_bytes(4), 'hex'::text) FROM 1 FOR 6)),
  owner_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 3.3 House Members
CREATE TABLE IF NOT EXISTS public.house_members (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role     public.house_role NOT NULL DEFAULT 'member'::public.house_role,
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_house_member UNIQUE (house_id, user_id)
);

-- 3.4 Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id   uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  name       text NOT NULL,
  emoji      text NOT NULL DEFAULT '📦'::text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.5 Products — catálogo global reutilizável
CREATE TABLE IF NOT EXISTS public.products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  brand        text,
  barcode      text,
  default_unit text DEFAULT 'un',
  image_url    text,
  created_by   uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 3.6 Items — instância do produto no estoque de uma casa
--   NOTA: as colunas `quantity` (text) e `legacy_item_id` (uuid) foram
--   removidas nesta versão; use qty_value (numeric) e qty_unit (text).
CREATE TABLE IF NOT EXISTS public.items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id    uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  status      public.item_status NOT NULL DEFAULT 'in_stock'::public.item_status,
  notes       text,
  image_url   text,                               -- override da imagem do produto
  qty_value   numeric DEFAULT 1 CHECK (qty_value IS NULL OR qty_value >= 0),
  qty_unit    text DEFAULT 'un',
  created_by  uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 3.7 Activity Log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id   uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action     public.activity_action NOT NULL,
  item_id    uuid REFERENCES public.items(id) ON DELETE SET NULL,
  item_name  text,
  old_value  text,
  new_value  text,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.8 Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  house_id   uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  endpoint   text NOT NULL,
  p256dh     text NOT NULL,
  auth_key   text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_push_subscription UNIQUE (user_id, house_id, endpoint)
);

-- ── 4. ÍNDICES ────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_unique
  ON public.products (barcode) WHERE barcode IS NOT NULL AND barcode <> '';
CREATE INDEX IF NOT EXISTS idx_items_house_status
  ON public.items (house_id, status);
CREATE INDEX IF NOT EXISTS idx_items_product_id
  ON public.items (product_id);
CREATE INDEX IF NOT EXISTS idx_categories_house_sort
  ON public.categories (house_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_activity_log_house_created
  ON public.activity_log (house_id, created_at DESC);

-- ── 5. TRIGGERS ───────────────────────────────────────────────────────────────

-- updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at  ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_houses_updated_at    ON public.houses;
CREATE TRIGGER trg_houses_updated_at    BEFORE UPDATE ON public.houses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at  ON public.products;
CREATE TRIGGER trg_products_updated_at  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_items_updated_at     ON public.items;
CREATE TRIGGER trg_items_updated_at     BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- activity_log automático em items
DROP TRIGGER IF EXISTS trg_items_activity_log   ON public.items;
CREATE TRIGGER trg_items_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.log_item_changes();

-- ── 6. ROW LEVEL SECURITY ─────────────────────────────────────────────────────

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 6.1 Profiles
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON public.profiles;

CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT  USING (true);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE  USING (id = auth.uid());

-- 6.2 Houses
DROP POLICY IF EXISTS "houses_select"  ON public.houses;
DROP POLICY IF EXISTS "houses_insert"  ON public.houses;
DROP POLICY IF EXISTS "houses_update"  ON public.houses;
DROP POLICY IF EXISTS "houses_delete"  ON public.houses;

CREATE POLICY "houses_select" ON public.houses FOR SELECT
  USING (public.is_house_member(id));
CREATE POLICY "houses_insert" ON public.houses FOR INSERT
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "houses_update" ON public.houses FOR UPDATE
  USING (public.is_house_admin(id));
CREATE POLICY "houses_delete" ON public.houses FOR DELETE
  USING (public.is_house_owner(id));

-- 6.3 House Members
DROP POLICY IF EXISTS "house_members_select"  ON public.house_members;
DROP POLICY IF EXISTS "house_members_insert"  ON public.house_members;
DROP POLICY IF EXISTS "house_members_delete"  ON public.house_members;

CREATE POLICY "house_members_select" ON public.house_members FOR SELECT
  USING (public.is_house_member(house_id));
CREATE POLICY "house_members_insert" ON public.house_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "house_members_delete" ON public.house_members FOR DELETE
  USING (user_id = auth.uid() OR public.is_house_admin(house_id));

-- 6.4 Categories
DROP POLICY IF EXISTS "categories_select"  ON public.categories;
DROP POLICY IF EXISTS "categories_insert"  ON public.categories;
DROP POLICY IF EXISTS "categories_update"  ON public.categories;
DROP POLICY IF EXISTS "categories_delete"  ON public.categories;

CREATE POLICY "categories_select" ON public.categories FOR SELECT
  USING (public.is_house_member(house_id));
CREATE POLICY "categories_insert" ON public.categories FOR INSERT
  WITH CHECK (public.is_house_member(house_id));
CREATE POLICY "categories_update" ON public.categories FOR UPDATE
  USING (public.is_house_admin(house_id));
CREATE POLICY "categories_delete" ON public.categories FOR DELETE
  USING (public.is_house_admin(house_id));

-- 6.5 Products (catálogo global — leitura para todos autenticados, escrita para criador)
DROP POLICY IF EXISTS "products_select"  ON public.products;
DROP POLICY IF EXISTS "products_insert"  ON public.products;
DROP POLICY IF EXISTS "products_update"  ON public.products;

CREATE POLICY "products_select" ON public.products FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "products_insert" ON public.products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "products_update" ON public.products FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 6.6 Items
DROP POLICY IF EXISTS "items_select"  ON public.items;
DROP POLICY IF EXISTS "items_insert"  ON public.items;
DROP POLICY IF EXISTS "items_update"  ON public.items;
DROP POLICY IF EXISTS "items_delete"  ON public.items;

CREATE POLICY "items_select" ON public.items FOR SELECT
  USING (public.is_house_member(house_id));
CREATE POLICY "items_insert" ON public.items FOR INSERT
  WITH CHECK (public.is_house_member(house_id) AND auth.uid() = created_by);
CREATE POLICY "items_update" ON public.items FOR UPDATE
  USING (public.is_house_member(house_id));
CREATE POLICY "items_delete" ON public.items FOR DELETE
  USING (public.is_house_member(house_id));

-- 6.7 Activity Log (só leitura para membros; escrita apenas via trigger SECURITY DEFINER)
DROP POLICY IF EXISTS "activity_log_select"  ON public.activity_log;

CREATE POLICY "activity_log_select" ON public.activity_log FOR SELECT
  USING (public.is_house_member(house_id));

-- 6.8 Push Subscriptions
DROP POLICY IF EXISTS "push_subscriptions_select"  ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert"  ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete"  ON public.push_subscriptions;

CREATE POLICY "push_subscriptions_select" ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "push_subscriptions_insert" ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_subscriptions_delete" ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- ── 7. STORAGE ────────────────────────────────────────────────────────────────
-- Cria os buckets apenas se não existirem (idempotente)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('avatars',        'avatars',        true,  2097152,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage — product-images
DO $$ BEGIN
  DROP POLICY IF EXISTS "product_images_select" ON storage.objects;
  DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
  DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "product_images_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "product_images_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Políticas de Storage — avatars
DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "avatars_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── 8. REALTIME ───────────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
EXCEPTION WHEN others THEN NULL; END $$;

-- ── FIM DO SCHEMA ─────────────────────────────────────────────────────────────
