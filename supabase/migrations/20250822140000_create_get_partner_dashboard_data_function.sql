-- supabase/migrations/YYYYMMDDHHMMSS_create_get_partner_dashboard_data_function.sql

CREATE OR REPLACE FUNCTION public.get_partner_dashboard_data(p_partner_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pending_quotes_data json;
    in_progress_services_data json;
    result json;
BEGIN
    -- 1. Agrega dados de Orçamentos Pendentes (Quotes)
    SELECT json_build_object(
        'count', COUNT(q.id),
        'items', COALESCE(json_agg(
            json_build_object(
                'id', q.id,
                'client_name', client_profile.full_name,
                'service_description', (SELECT s.description FROM public.services s WHERE s.quote_id = q.id LIMIT 1),
                'date', q.created_at
            )
        ) FILTER (WHERE q.id IS NOT NULL), '[]'::json)
    )
    INTO pending_quotes_data
    FROM public.quotes q
    JOIN public.service_orders so ON q.service_order_id = so.id
    JOIN public.profiles client_profile ON so.client_id = client_profile.id
    WHERE q.partner_id = p_partner_id AND q.status = 'pending_client_approval';

    -- 2. Agrega dados de Serviços em Andamento (Service Orders)
    SELECT json_build_object(
        'count', COUNT(so.id),
        'items', COALESCE(json_agg(
            json_build_object(
                'id', so.id,
                'client_name', client_profile.full_name,
                'service_description', (SELECT s.description FROM public.services s JOIN public.quotes q2 ON s.quote_id = q2.id WHERE q2.service_order_id = so.id AND q2.partner_id = p_partner_id LIMIT 1),
                'status', so.status
            )
        ) FILTER (WHERE so.id IS NOT NULL), '[]'::json)
    )
    INTO in_progress_services_data
    FROM public.service_orders so
    JOIN public.profiles client_profile ON so.client_id = client_profile.id
    WHERE so.status = 'in_progress'
      AND EXISTS (
          SELECT 1 FROM public.quotes q_ex
          WHERE q_ex.service_order_id = so.id
            AND q_ex.partner_id = p_partner_id
      );

    -- 3. Combina os resultados em um único JSON
    SELECT json_build_object(
        'pending_quotes', pending_quotes_data,
        'in_progress_services', in_progress_services_data
    )
    INTO result;

    RETURN result;
END;
$$;

-- Garante que a role `authenticated` pode executar a função
GRANT EXECUTE ON FUNCTION public.get_partner_dashboard_data(uuid) TO authenticated;
