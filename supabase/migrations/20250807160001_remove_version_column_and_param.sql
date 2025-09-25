-- Migration to remove 'version' column from contract_partners table and update accept_partner_contract function

-- Step 1: Remove 'version' column from contract_partners table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_partners' AND column_name='version') THEN
        ALTER TABLE contract_partners DROP COLUMN version;
    END IF;
END
$$;
-- Step 2: Drop the existing function with its old signature (including p_version)
DROP FUNCTION IF EXISTS public.accept_partner_contract(uuid, text, boolean, text);
-- Step 3: Create the function with the corrected parameter list (without p_version)
CREATE OR REPLACE FUNCTION public.accept_partner_contract(
    p_partner_id uuid,
    p_content text,
    p_signed boolean
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.contract_partners (partner_id, content, signed)
    VALUES (p_partner_id, p_content, p_signed)
    ON CONFLICT (partner_id) DO UPDATE
    SET
        content = EXCLUDED.content,
        signed = EXCLUDED.signed,
        created_at = now(); -- Update timestamp on re-acceptance
END;
$$;
