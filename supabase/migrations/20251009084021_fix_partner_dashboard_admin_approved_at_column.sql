-- Corrigir função get_partner_dashboard_data
-- Problema: estava usando q.admin_approved_at (coluna inexistente)
-- Solução: usar q.admin_reviewed_at (coluna correta)

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
        -- PENDENTE: Quotes sem status (NULL) ou com total_value zerado
        'pending', COUNT(*) FILTER (WHERE (status IS NULL OR total_value IS NULL OR total_value = 0)),
        -- EM ANÁLISE: Orçamentos já elaborados e enviados para aprovação
        'in_analysis', COUNT(*) FILTER (WHERE status IN ('pending_admin_approval', 'admin_review', 'pending_client_approval') AND total_value > 0),
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
                'total_value', COALESCE(q.total_value, 0),
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
      AND (
        q.status IS NULL 
        OR q.status IN ('pending_admin_approval', 'admin_review', 'pending_client_approval')
      );

    -- 3. Orçamentos Aprovados pelo Cliente (Serviços em Andamento)
    SELECT json_build_object(
        'count', COUNT(q.id),
        'items', COALESCE(json_agg(
            json_build_object(
                'id', q.id,
                'client_name', client_profile.full_name,
                'service_description', (SELECT s.description FROM public.services s WHERE s.quote_id = q.id LIMIT 1),
                'status', 'approved',
                'total_value', q.total_value,
                -- CORRIGIDO: usar admin_reviewed_at ao invés de admin_approved_at
                'approved_at', COALESCE(q.client_approved_at, q.admin_reviewed_at),
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

-- Comentário para documentação
COMMENT ON FUNCTION public.get_partner_dashboard_data(uuid) IS 
'Retorna dados do dashboard do parceiro incluindo:
- budget_counters: contadores por status (pending, in_analysis, approved, rejected)
- pending_quotes: quotes que precisam de ação do parceiro (status NULL ou pending)
- in_progress_services: quotes aprovadas aguardando execução

IMPORTANTE:
- PENDENTE: status IS NULL OU total_value = 0 (parceiro precisa preencher)
- EM ANÁLISE: status IN (pending_admin_approval, admin_review, pending_client_approval) E total_value > 0
';
