-- Atualizar função get_partner_dashboard_data
-- Modificar seção "Serviços em Andamento" para mostrar orçamentos aprovados pelo cliente

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
    -- 1. Contadores de Orçamentos por Status (Perspectiva CORRETA do Parceiro)
    SELECT json_build_object(
        'total', COUNT(*),
        -- PENDENTE: Novas solicitações que o parceiro recebeu e precisa orçar
        'pending', COUNT(*) FILTER (WHERE status = 'pending_admin_approval' AND (total_value IS NULL OR total_value = 0)),
        -- EM ANÁLISE: Orçamentos já elaborados pelo parceiro e enviados para aprovação
        'in_analysis', COUNT(*) FILTER (WHERE status = 'pending_admin_approval' AND total_value > 0) + 
                      COUNT(*) FILTER (WHERE status = 'pending_client_approval'),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected')
    )
    INTO budget_counters_data
    FROM public.quotes
    WHERE partner_id = p_partner_id;

    -- 2. Lista orçamentos que precisam de ação do parceiro (Pendentes + Em Análise)
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
                'sent_to_admin_at', q.sent_to_admin_at,
                -- DADOS DO VEÍCULO
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
      AND q.status IN ('pending_admin_approval', 'pending_client_approval');

    -- 3. MODIFICADO: Orçamentos Aprovados pelo Cliente (Serviços em Andamento)
    -- Agora mostra quotes com status 'approved' ao invés de service_orders 'in_progress'
    SELECT json_build_object(
        'count', COUNT(q.id),
        'items', COALESCE(json_agg(
            json_build_object(
                'id', q.id,
                'client_name', client_profile.full_name,
                'service_description', (SELECT s.description FROM public.services s WHERE s.quote_id = q.id LIMIT 1),
                'status', 'approved',
                'total_value', q.total_value,
                'approved_at', COALESCE(q.client_approved_at, q.admin_approved_at),
                -- DADOS DO VEÍCULO
                'vehicle_plate', v.plate,
                'vehicle_brand', v.brand,
                'vehicle_model', v.model,
                'vehicle_year', v.year,
                'vehicle_info', CONCAT(v.brand, ' ', v.model, CASE WHEN v.year IS NOT NULL THEN CONCAT(' (', v.year, ')') ELSE '' END)
            )
        ) FILTER (WHERE q.id IS NOT NULL), '[]'::json)
    )
    INTO in_progress_services_data
    FROM public.quotes q
    LEFT JOIN public.service_orders so ON q.service_order_id = so.id
    LEFT JOIN public.vehicles v ON so.vehicle_id = v.id
    LEFT JOIN public.profiles client_profile ON so.client_id = client_profile.id
    WHERE q.partner_id = p_partner_id
      AND q.status = 'approved';

    -- 4. Resultado final
    SELECT json_build_object(
        'budget_counters', budget_counters_data,
        'pending_quotes', pending_quotes_data,
        'in_progress_services', in_progress_services_data
    )
    INTO result;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_dashboard_data(uuid) TO authenticated;
