-- Migration to drop and recreate accept_partner_contract function with corrected parameter name

-- Step 1: Ensure 'accepted' column is renamed to 'signed' if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contract_partners' AND column_name='accepted') THEN
        ALTER TABLE contract_partners RENAME COLUMN accepted TO signed;
    END IF;
END
$$;
-- Step 2: Drop the existing function with its old signature
-- This is necessary because CREATE OR REPLACE FUNCTION does not allow renaming parameters.
DROP FUNCTION IF EXISTS public.accept_partner_contract(uuid, text, boolean, text);
-- Step 3: Create the function with the corrected parameter name (p_signed)
CREATE OR REPLACE FUNCTION public.accept_partner_contract(
    p_partner_id uuid,
    p_content text,
    p_signed boolean, -- Corrected parameter name
    p_version text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.contract_partners (partner_id, content, signed, version)
    VALUES (p_partner_id, p_content, p_signed, p_version)
    ON CONFLICT (partner_id) DO UPDATE
    SET
        content = EXCLUDED.content,
        signed = EXCLUDED.signed,
        version = EXCLUDED.version,
        created_at = now(); -- Update timestamp on re-acceptance
END;
$$;
