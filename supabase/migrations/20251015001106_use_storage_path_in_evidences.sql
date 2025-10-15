-- Migrate mechanics_checklist_evidences to use storage_path as canonical reference
-- Context: application is empty; prefer storage_path over media_url; allow multiple evidences per item

BEGIN;

-- 1) Add storage_path column if missing
ALTER TABLE public.mechanics_checklist_evidences
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 2) Drop unique indexes that reference media_url (if they exist)
DROP INDEX IF EXISTS public.idx_evidences_unique_partner_quote_item_media;
DROP INDEX IF EXISTS public.idx_evidences_unique_partner_inspection_item_media;

-- 3) Backfill storage_path a partir de media_url (se a coluna existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mechanics_checklist_evidences'
      AND column_name = 'media_url'
  ) THEN
    -- Normaliza media_url removendo prefixos do endpoint de storage e querystring
    UPDATE public.mechanics_checklist_evidences
    SET storage_path = COALESCE(storage_path,
      CASE 
        WHEN media_url ILIKE '%/storage/v1/object/%/vehicle-media/%' THEN 
          split_part(REGEXP_REPLACE(media_url, '^.*?/storage/v1/object/(public|sign|download)/vehicle-media/', ''), '?', 1)
        WHEN media_url ILIKE '%/object/public/vehicle-media/%' THEN
          split_part(REGEXP_REPLACE(media_url, '^.*/object/public/vehicle-media/', ''), '?', 1)
        ELSE split_part(media_url, '?', 1)
      END
    )
    WHERE storage_path IS NULL;
  END IF;
END $$;

-- 4) Enforce NOT NULL on storage_path
ALTER TABLE public.mechanics_checklist_evidences
  ALTER COLUMN storage_path SET NOT NULL;

-- 5) Drop media_url column (após backfill e NOT NULL)
ALTER TABLE public.mechanics_checklist_evidences
  DROP COLUMN IF EXISTS media_url;

-- 6) Remover duplicatas exatas por (partner_id, quote_id/inspection_id, item_key, storage_path)
-- Dedup 6a: contexto de QUOTE (ignora inspection_id para a unicidade por quote)
WITH ranked_q AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY partner_id, quote_id, item_key, storage_path
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.mechanics_checklist_evidences
  WHERE quote_id IS NOT NULL
)
DELETE FROM public.mechanics_checklist_evidences e
USING ranked_q r
WHERE e.id = r.id AND r.rn > 1;

-- Dedup 6b: contexto de INSPECTION (ignora quote_id para a unicidade por inspection)
WITH ranked_i AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY partner_id, inspection_id, item_key, storage_path
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.mechanics_checklist_evidences
  WHERE inspection_id IS NOT NULL
)
DELETE FROM public.mechanics_checklist_evidences e
USING ranked_i r
WHERE e.id = r.id AND r.rn > 1;

-- 7) Recreate uniqueness on path per context (múltiplas evidências por item são permitidas; unicidade inclui path)
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidences_unique_partner_quote_item_path
  ON public.mechanics_checklist_evidences(partner_id, quote_id, item_key, storage_path)
  WHERE partner_id IS NOT NULL AND quote_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_evidences_unique_partner_inspection_item_path
  ON public.mechanics_checklist_evidences(partner_id, inspection_id, item_key, storage_path)
  WHERE partner_id IS NOT NULL AND inspection_id IS NOT NULL;

COMMIT;
