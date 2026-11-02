-- Adiciona campo de quantidade à tabela items
-- Execute no SQL Editor do Supabase
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS quantity TEXT;
