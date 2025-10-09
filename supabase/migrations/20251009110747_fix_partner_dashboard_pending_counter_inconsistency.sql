-- Corrigir inconsistência entre contador "pending" e lista "pending_quotes"
-- 
-- PROBLEMA IDENTIFICADO:
-- - Contador "pending" conta APENAS quotes com status='pending_partner'
-- - Lista "pending_quotes" inclui pending_partner + quotes em análise (pending_admin_approval, admin_review, pending_client_approval)
-- - Resultado: contador mostra 0, mas lista mostra 1 ou mais itens
--
-- SOLUÇÃO:
-- O contador "pending" deve ser consistente com a lista "pending_quotes"
-- Ambos devem considerar APENAS quotes que o parceiro precisa agir (status='pending_partner')
-- Quotes em análise (já enviadas) devem aparecer apenas no contador "in_analysis"

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
        -- PENDENTE: Quotes que o parceiro PRECISA AGIR (pending_partner apenas)
        'pending', COUNT(*) FILTER (WHERE status = 'pending_partner'),
        -- EM ANÁLISE: Orçamentos já elaborados e enviados para aprovação
        'in_analysis', COUNT(*) FILTER (WHERE status IN ('pending_admin_approval', 'admin_review', 'pending_client_approval') AND total_value > 0),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected')
    )
    INTO budget_counters_data
    FROM public.quotes
    WHERE partner_id = p_partner_id;

    -- 2. Lista orçamentos PENDENTES DE AÇÃO DO PARCEIRO
    -- ✅ CORRIGIDO: Agora lista APENAS pending_partner (consistente com o contador)
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
      AND q.status = 'pending_partner'; -- ✅ APENAS pending_partner (consistente com contador)

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
- budget_counters: contadores por status
  * pending: quotes que o parceiro PRECISA AGIR (status=pending_partner)
  * in_analysis: quotes já enviadas para aprovação (pending_admin_approval, admin_review, pending_client_approval)
  * approved: quotes aprovadas
  * rejected: quotes rejeitadas
- pending_quotes: APENAS quotes pending_partner (aguardando ação do parceiro)
- in_progress_services: quotes aprovadas aguardando execução

CORREÇÃO APLICADA (09/10/2025):
- Removida inconsistência onde contador "pending" contava apenas pending_partner
  mas a lista incluía também quotes em análise
- Agora ambos (contador e lista) consideram APENAS status=pending_partner
- Quotes em análise (pending_admin_approval, etc) aparecem no contador "in_analysis"
- Quotes em análise NÃO aparecem mais na lista "pending_quotes"
';
