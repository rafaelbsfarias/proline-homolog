-- Função para buscar todos os especialistas ativos
CREATE OR REPLACE FUNCTION public.get_specialists()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Apenas admins podem executar esta função
    IF (get_my_claim('user_role'))::text != 'admin' THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem listar especialistas.';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.email,
        p.created_at
    FROM public.profiles p
    WHERE p.user_role = 'specialist'
      AND p.status = 'active'
    ORDER BY p.full_name ASC;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION public.get_specialists() IS 'Retorna lista de todos os especialistas ativos. Apenas para administradores.';