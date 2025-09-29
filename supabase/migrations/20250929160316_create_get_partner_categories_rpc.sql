-- Função RPC para obter as categorias de um parceiro
-- Contorna problemas de RLS e simplifica a query no frontend

CREATE OR REPLACE FUNCTION get_partner_categories(partner_id uuid)
RETURNS json AS $$
BEGIN
    RETURN (
        SELECT COALESCE(json_agg(sc.name), '[]'::json)
        FROM partners_service_categories psc
        JOIN service_categories sc ON psc.category_id = sc.id
        WHERE psc.partner_id = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir acesso à função
GRANT EXECUTE ON FUNCTION get_partner_categories(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_categories(uuid) TO anon;
