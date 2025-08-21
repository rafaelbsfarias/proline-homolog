-- Ensure contract_partners.partner_id FK cascades on partner deletion

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'contract_partners'
      AND constraint_name = 'contract_partners_partner_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE public.contract_partners DROP CONSTRAINT contract_partners_partner_id_fkey';
  END IF;

  EXECUTE 'ALTER TABLE public.contract_partners
    ADD CONSTRAINT contract_partners_partner_id_fkey
    FOREIGN KEY (partner_id) REFERENCES public.partners(profile_id) ON DELETE CASCADE';
END $$;
