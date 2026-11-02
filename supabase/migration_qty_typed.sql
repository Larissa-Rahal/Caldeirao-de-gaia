-- ============================================================
-- Migração: separar quantity em qty_value (NUMERIC) + qty_unit (TEXT)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Adicionar novos campos
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS qty_value NUMERIC,
  ADD COLUMN IF NOT EXISTS qty_unit  TEXT;

-- Migrar dados antigos do campo quantity (ex: "3 unid", "500 g", "1.5 kg")
UPDATE public.items
SET
  qty_value = CASE
    WHEN quantity ~ '^[0-9]+([.,][0-9]+)?\s'
    THEN (regexp_match(quantity, '^([0-9]+([.,][0-9]+)?)'))[1]::NUMERIC
    WHEN quantity ~ '^[0-9]+([.,][0-9]+)?$'
    THEN quantity::NUMERIC
    ELSE NULL
  END,
  qty_unit = CASE
    WHEN quantity ~ '\s'
    THEN trim(regexp_replace(quantity, '^[0-9]+([.,][0-9]+)?\s*', ''))
    WHEN quantity IS NOT NULL AND quantity !~ '^[0-9]'
    THEN quantity
    ELSE NULL
  END
WHERE quantity IS NOT NULL;

-- Manter quantity como fallback por agora (não apagar para compatibilidade)
-- Pode ser removido depois: ALTER TABLE public.items DROP COLUMN quantity;
