-- Adiciona coluna image_url à tabela items
-- Execute no SQL Editor do Supabase se já tiver criado as tabelas antes
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS image_url TEXT;
