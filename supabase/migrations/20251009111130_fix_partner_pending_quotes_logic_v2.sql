-- Corrigir lógica de "pending_quotes" para incluir quotes que precisam ação do parceiro
-- 
-- PROBLEMA REAL IDENTIFICADO:
-- - Existe um quote com status="pending_client_approval" MAS sent_to_admin_at=NULL
-- - Isso significa que o quote NÃO foi enviado ao admin ainda
-- - O parceiro precisa ver e agir nesse quote (preencher orçamento e enviar)
-- - Mas com a migration anterior, ele desapareceu da lista
--
-- SOLUÇÃO:
-- A lista "pending_quotes" deve mostrar quotes que PRECISAM DE AÇÃO DO PARCEIRO:
-- 1. Status = 'pending_partner' (óbvio - aguardando parceiro)
-- 2. Status em análise MAS sent_to_admin_at IS NULL (bug no fluxo - precisa correção)
-- 3. Status em análise MAS total_value = 0 (orçamento não preenchido)
--
-- O contador deve refletir o total da lista para ser consistente

CREATE OR REPLACE FUNCTION public.get_partner_dashboard_data(p_partner_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pending_quotes_data json;
    in_progress_services_data json;
    budget_counters_data json;
    pending_count integer;
    in_analysis_count integer;
    result json;
BEGIN
    -- 1. Lista orçamentos que PRECISAM DE AÇÃO DO PARCEIRO
    -- Incluindo casos de inconsistência no fluxo
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
        -- Caso normal: pending_partner
        q.status = 'pending_partner'
        -- OU caso de inconsistência: em análise mas não foi enviado
        OR (
          q.status IN ('pending_admin_approval', 'admin_review', 'pending_client_approval')
          AND q.sent_to_admin_at IS NULL
        )
        -- OU caso de orçamento não preenchido
        OR (
          q.status IN ('pending_admin_approval', 'admin_review', 'pending_client_approval')
          AND (q.total_value IS NULL OR q.total_value = 0)
        )
      );

    -- Extrair o count para usar nos contadores
    SELECT (pending_quotes_data->>'count')::integer INTO pending_count;

    -- 2. Contar quotes REALMENTE em análise (enviadas E com valor)
    SELECT COUNT(*)
    INTO in_analysis_count
    FROM public.quotes
    WHERE partner_id = p_partner_id
      AND status IN ('pending_admin_approval', 'admin_review', 'pending_client_approval')
      AND sent_to_admin_at IS NOT NULL
      AND total_value > 0;

    -- 3. Contadores de Orçamentos por Status
    SELECT json_build_object(
        'total', COUNT(*),
        -- PENDENTE: quotes que o parceiro precisa agir (da lista acima)
        'pending', pending_count,
        -- EM ANÁLISE: orçamentos REALMENTE enviados e com valor
        'in_analysis', in_analysis_count,
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected')
    )
    INTO budget_counters_data
    FROM public.quotes
    WHERE partner_id = p_partner_id;

    -- 4. Orçamentos Aprovados pelo Cliente (Serviços em Andamento)
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

    -- 5. Resultado final
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
  * pending: quotes que o parceiro PRECISA AGIR
  * in_analysis: quotes JÁ ENVIADAS para aprovação (sent_to_admin_at NOT NULL AND total_value > 0)
  * approved: quotes aprovadas
  * rejected: quotes rejeitadas
- pending_quotes: Quotes que precisam ação do parceiro, incluindo:
  * status = pending_partner
  * status em análise MAS sent_to_admin_at IS NULL (inconsistência/bug)
  * status em análise MAS total_value = 0 (orçamento não preenchido)
- in_progress_services: quotes aprovadas aguardando execução

CORREÇÃO APLICADA (09/10/2025 - v2):
- Identificado que existem quotes com status de análise MAS não foram enviados
- Lista "pending_quotes" agora inclui esses casos de inconsistência
- Contador "pending" reflete exatamente o que está na lista
- Contador "in_analysis" conta APENAS quotes realmente enviadas (sent_to_admin_at NOT NULL)
- Isso mantém consistência entre contador e lista, mas também mostra quotes "bugados"
';
