-- Create RPC function to record client contract acceptance
CREATE OR REPLACE FUNCTION public.accept_client_contract(
    p_client_id uuid,
    p_content text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.client_contract_acceptance (client_id, content, accepted_at)
    VALUES (p_client_id, p_content, now())
    ON CONFLICT (client_id) DO UPDATE
    SET
        content = EXCLUDED.content,
        accepted_at = now();
END;
$$;
