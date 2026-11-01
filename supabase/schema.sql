-- ============================================================
-- EstoqueCasa — Schema Supabase
-- Cole este script num editor NOVO no SQL Editor do Supabase
-- ============================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. FUNÇÃO updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. TABELA profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. ENUMS
DO $$ BEGIN
  CREATE TYPE public.house_role AS ENUM ('owner', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.item_status AS ENUM ('in_stock', 'running_low', 'out_of_stock');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. TABELA houses
CREATE TABLE IF NOT EXISTS public.houses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  invite_code TEXT NOT NULL UNIQUE DEFAULT upper(substring(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 6)),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS houses_updated_at ON public.houses;
CREATE TRIGGER houses_updated_at
  BEFORE UPDATE ON public.houses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS houses_invite_code_idx ON public.houses (invite_code);

-- 6. TABELA house_members
CREATE TABLE IF NOT EXISTS public.house_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id  UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role      public.house_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (house_id, user_id)
);

CREATE INDEX IF NOT EXISTS house_members_user_idx  ON public.house_members (user_id);
CREATE INDEX IF NOT EXISTS house_members_house_idx ON public.house_members (house_id);

CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.house_members (house_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (house_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_house_created ON public.houses;
CREATE TRIGGER on_house_created
  AFTER INSERT ON public.houses
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- 7. TABELA categories
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id   UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  emoji      TEXT NOT NULL DEFAULT '📦',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (house_id, name)
);

CREATE INDEX IF NOT EXISTS categories_house_idx ON public.categories (house_id, sort_order);

-- 8. TABELA items
CREATE TABLE IF NOT EXISTS public.items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id    UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  status      public.item_status NOT NULL DEFAULT 'in_stock',
  notes       TEXT CHECK (char_length(notes) <= 200),
  updated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS items_updated_at ON public.items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS items_house_idx    ON public.items (house_id, status);
CREATE INDEX IF NOT EXISTS items_category_idx ON public.items (category_id);

-- 9. RLS
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items         ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_house_member(p_house_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_members
    WHERE house_id = p_house_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_house_owner(p_house_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_members
    WHERE house_id = p_house_id AND user_id = auth.uid() AND role = 'owner'
  );
$$;

-- Apagar políticas existentes (seguro para re-execução)
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','houses','house_members','categories','items')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Políticas: profiles
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_housemates"
  ON public.profiles FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.house_members a
      JOIN public.house_members b ON a.house_id = b.house_id
      WHERE a.user_id = auth.uid() AND b.user_id = profiles.id
    )
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Políticas: houses
CREATE POLICY "houses_select_member"
  ON public.houses FOR SELECT USING (public.is_house_member(id));

CREATE POLICY "houses_select_by_invite"
  ON public.houses FOR SELECT USING (true);

CREATE POLICY "houses_insert"
  ON public.houses FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "houses_update"
  ON public.houses FOR UPDATE USING (public.is_house_owner(id));

CREATE POLICY "houses_delete"
  ON public.houses FOR DELETE USING (public.is_house_owner(id));

-- Políticas: house_members
CREATE POLICY "house_members_select"
  ON public.house_members FOR SELECT USING (public.is_house_member(house_id));

CREATE POLICY "house_members_insert"
  ON public.house_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "house_members_delete"
  ON public.house_members FOR DELETE USING (
    public.is_house_owner(house_id) OR user_id = auth.uid()
  );

-- Políticas: categories
CREATE POLICY "categories_select"
  ON public.categories FOR SELECT USING (public.is_house_member(house_id));

CREATE POLICY "categories_insert"
  ON public.categories FOR INSERT WITH CHECK (public.is_house_member(house_id));

CREATE POLICY "categories_update"
  ON public.categories FOR UPDATE USING (public.is_house_member(house_id));

CREATE POLICY "categories_delete"
  ON public.categories FOR DELETE USING (public.is_house_owner(house_id));

-- Políticas: items
CREATE POLICY "items_select"
  ON public.items FOR SELECT USING (public.is_house_member(house_id));

CREATE POLICY "items_insert"
  ON public.items FOR INSERT WITH CHECK (
    public.is_house_member(house_id) AND auth.uid() = created_by
  );

CREATE POLICY "items_update"
  ON public.items FOR UPDATE USING (public.is_house_member(house_id));

CREATE POLICY "items_delete"
  ON public.items FOR DELETE USING (public.is_house_member(house_id));

-- 10. FUNÇÃO join_house
CREATE OR REPLACE FUNCTION public.join_house(p_invite_code TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  found_house_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN json_build_object('error', 'Não autenticado');
  END IF;

  SELECT id INTO found_house_id
  FROM public.houses
  WHERE invite_code = upper(trim(p_invite_code))
  LIMIT 1;

  IF found_house_id IS NULL THEN
    RETURN json_build_object('error', 'Código de convite inválido');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.house_members
    WHERE house_id = found_house_id AND user_id = current_user_id
  ) THEN
    RETURN json_build_object('house_id', found_house_id::text, 'already_member', true);
  END IF;

  INSERT INTO public.house_members (house_id, user_id, role)
  VALUES (found_house_id, current_user_id, 'member');

  RETURN json_build_object('house_id', found_house_id::text, 'already_member', false);
END;
$$;

-- 11. FUNÇÃO regenerate_invite_code
CREATE OR REPLACE FUNCTION public.regenerate_invite_code(p_house_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_code TEXT;
BEGIN
  IF NOT public.is_house_owner(p_house_id) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  LOOP
    new_code := upper(substring(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.houses WHERE invite_code = new_code
    );
  END LOOP;

  UPDATE public.houses SET invite_code = new_code WHERE id = p_house_id;
  RETURN new_code;
END;
$$;

-- 12. REALTIME (ignora se a tabela já estiver na publicação)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.house_members;
EXCEPTION WHEN others THEN NULL;
END $$;

-- FIM
