-- Corrigir função get_partner_dashboard_data - v2
-- Força atualização para debug

DROP FUNCTION IF EXISTS public.get_partner_dashboard_data(uuid);

CREATE OR REPLACE FUNCTION public.get_partner_dashboard_data(p_partner_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pending_quotes_data json;
    in_progress_services_data json;
    budget_counters_data json;
    result json;
BEGIN
    -- 1. Contadores de Orçamentos por Status (Perspectiva do Parceiro)
    SELECT json_build_object(
        'total', COUNT(*),
        -- Pendente: Novas solicitações (orçamentos que ainda não foram elaborados)  
        'pending', COUNT(*) FILTER (WHERE status IS NULL OR status = '' OR status = 'draft'),
        -- Em Análise: Aguardando aprovação (admin OU cliente)
        'in_analysis', COUNT(*) FILTER (WHERE status IN ('pending_admin_approval', 'pending_client_approval')),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected')
    )
    INTO budget_counters_data
    FROM public.quotes
    WHERE partner_id = p_partner_id;

    -- 2. Agrega dados de Orçamentos Pendentes (incluindo os em análise)
    SELECT json_build_object(
        'count', COUNT(q.id),
        'items', COALESCE(json_agg(
            json_build_object(
                'id', q.id,
                'client_name', client_profile.full_name,
                'service_description', (SELECT s.description FROM public.services s WHERE s.quote_id = q.id LIMIT 1),
                'date', q.created_at,
                'status', q.status,
                'total_value', q.total_value,
                -- DADOS DO VEÍCULO ADICIONADOS
                'vehicle_plate', v.plate,
                'vehicle_brand', v.brand,
                'vehicle_model', v.model,
                'vehicle_year', v.year,
                'vehicle_info', CONCAT(v.brand, ' ', v.model, CASE WHEN v.year IS NOT NULL THEN CONCAT(' (', v.year, ')') ELSE '' END)
            )
        ) FILTER (WHERE q.id IS NOT NULL), '[]'::json)
    )
    INTO pending_quotes_data
    FROM public.quotes q
    LEFT JOIN public.service_orders so ON q.service_order_id = so.id
    LEFT JOIN public.vehicles v ON so.vehicle_id = v.id
    LEFT JOIN public.profiles client_profile ON so.client_id = client_profile.id
    WHERE q.partner_id = p_partner_id 
      AND (q.status IN ('pending_admin_approval', 'pending_client_approval') 
           OR q.status IS NULL 
           OR q.status = '' 
           OR q.status = 'draft');

    -- 3. Agrega dados de Serviços em Andamento (Service Orders)
    SELECT json_build_object(
        'count', COUNT(so.id),
        'items', COALESCE(json_agg(
            json_build_object(
                'id', so.id,
                'client_name', client_profile.full_name,
                'service_description', (SELECT s.description FROM public.services s JOIN public.quotes q2 ON s.quote_id = q2.id WHERE q2.service_order_id = so.id AND q2.partner_id = p_partner_id LIMIT 1),
                'status', so.status,
                -- DADOS DO VEÍCULO ADICIONADOS
                'vehicle_plate', v.plate,
                'vehicle_brand', v.brand,
                'vehicle_model', v.model,
                'vehicle_year', v.year,
                'vehicle_info', CONCAT(v.brand, ' ', v.model, CASE WHEN v.year IS NOT NULL THEN CONCAT(' (', v.year, ')') ELSE '' END)
            )
        ) FILTER (WHERE so.id IS NOT NULL), '[]'::json)
    )
    INTO in_progress_services_data
    FROM public.service_orders so
    LEFT JOIN public.vehicles v ON so.vehicle_id = v.id
    LEFT JOIN public.profiles client_profile ON so.client_id = client_profile.id
    WHERE so.status = 'in_progress'
      AND EXISTS (
          SELECT 1 FROM public.quotes q_ex
          WHERE q_ex.service_order_id = so.id
            AND q_ex.partner_id = p_partner_id
      );

    -- 4. Combina os resultados em um único JSON
    SELECT json_build_object(
        'budget_counters', budget_counters_data,
        'pending_quotes', pending_quotes_data,
        'in_progress_services', in_progress_services_data
    )
    INTO result;

    RETURN result;
END;
$$;

-- Garante que a role `authenticated` pode executar a função
GRANT EXECUTE ON FUNCTION public.get_partner_dashboard_data(uuid) TO authenticated;