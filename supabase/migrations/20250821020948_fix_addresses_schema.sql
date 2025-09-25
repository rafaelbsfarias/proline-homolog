-- Alinha o schema da public.addresses com o do ambiente local
BEGIN;

-- Colunas que faltam no remoto (idempotente)
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS street          text,
  ADD COLUMN IF NOT EXISTS is_collect_point boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_main_address  boolean NOT NULL DEFAULT false;

-- Índice para FK (idempotente)
CREATE INDEX IF NOT EXISTS idx_addresses_profile_id
  ON public.addresses(profile_id);

-- Garante a FK para profiles(id) com ON DELETE CASCADE, caso ainda não exista
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conrelid = 'public.addresses'::regclass
    AND    conname  = 'addresses_profile_id_fkey'
  ) THEN
    ALTER TABLE public.addresses
      ADD CONSTRAINT addresses_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- (Opcional) Habilita RLS e políticas básicas (ajuste aos seus padrões de segurança)
-- ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='addresses' AND policyname='owner_can_crud'
--   ) THEN
--     CREATE POLICY "owner_can_crud" ON public.addresses
--       USING (profile_id = auth.uid())
--       WITH CHECK (profile_id = auth.uid());
--   END IF;
-- END $$;

COMMIT;
