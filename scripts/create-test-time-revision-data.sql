-- Script para criar dados de teste para o fluxo de revisão de prazos
-- Execute no Supabase SQL Editor ou via `supabase db execute`

-- ================================================
-- 1. Encontrar um parceiro, especialista e orçamento existente
-- ================================================

-- Buscar um parceiro (substitua pelo ID real se necessário)
DO $$
DECLARE
  v_partner_id UUID;
  v_specialist_id UUID;
  v_quote_id UUID;
  v_item_id_1 UUID;
  v_item_id_2 UUID;
BEGIN
  -- Pegar primeiro parceiro
  SELECT id INTO v_partner_id
  FROM profiles p
  WHERE EXISTS (
    SELECT 1 FROM partners WHERE profile_id = p.id
  )
  LIMIT 1;

  -- Pegar primeiro especialista
  SELECT id INTO v_specialist_id
  FROM profiles p
  WHERE EXISTS (
    SELECT 1 FROM specialists WHERE profile_id = p.id
  )
  LIMIT 1;

  -- Pegar um orçamento do parceiro (ou criar um novo)
  SELECT id INTO v_quote_id
  FROM quotes
  WHERE partner_id = v_partner_id
    AND status IN ('pending', 'approved')
  LIMIT 1;

  -- Se não houver orçamento, avisar
  IF v_quote_id IS NULL THEN
    RAISE NOTICE 'Nenhum orçamento encontrado para o parceiro. Execute os scripts de seed primeiro.';
    RETURN;
  END IF;

  -- Pegar 2 itens do orçamento
  SELECT id INTO v_item_id_1
  FROM quote_items
  WHERE quote_id = v_quote_id
  LIMIT 1;

  SELECT id INTO v_item_id_2
  FROM quote_items
  WHERE quote_id = v_quote_id
  OFFSET 1
  LIMIT 1;

  -- ================================================
  -- 2. CENÁRIO 1: Orçamento com Revisão Solicitada
  -- ================================================
  RAISE NOTICE '🔄 Criando cenário de revisão solicitada...';

  -- Mudar status do orçamento para specialist_time_revision_requested
  UPDATE quotes
  SET status = 'specialist_time_revision_requested'
  WHERE id = v_quote_id;

  -- Criar registro de revisão solicitada pelo especialista
  INSERT INTO quote_time_reviews (
    quote_id,
    specialist_id,
    action,
    comments,
    revision_requests,
    created_at
  ) VALUES (
    v_quote_id,
    v_specialist_id,
    'revision_requested',
    'Os prazos estão muito curtos para a complexidade dos serviços. Por favor, revisar considerando possíveis imprevistos.',
    jsonb_build_object(
      v_item_id_1::text, jsonb_build_object(
        'suggested_days', 7,
        'reason', 'Considerar tempo de espera de peças e imprevistos'
      ),
      v_item_id_2::text, jsonb_build_object(
        'suggested_days', 15,
        'reason', 'Serviço complexo que pode ter complicações'
      )
    ),
    NOW() - INTERVAL '2 hours'
  );

  RAISE NOTICE '✅ Orçamento % configurado como specialist_time_revision_requested', v_quote_id;
  RAISE NOTICE '✅ Você verá este orçamento no card laranja "Solicitações de Ajuste de Prazo"';

  -- ================================================
  -- 3. CENÁRIO 2: Orçamento em Análise (admin_review)
  -- ================================================
  -- Para criar este cenário, precisaríamos de outro orçamento
  -- Vamos apenas documentar como criar manualmente

  RAISE NOTICE '';
  RAISE NOTICE '📝 Para criar cenário de orçamento em análise:';
  RAISE NOTICE '   1. Abra o dashboard como parceiro';
  RAISE NOTICE '   2. Clique em "Revisar Prazos" no card laranja';
  RAISE NOTICE '   3. Edite os prazos e salve';
  RAISE NOTICE '   4. O orçamento mudará para admin_review';
  RAISE NOTICE '   5. Aparecerá no card roxo "Orçamentos em Análise"';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Orçamento ID: %', v_quote_id;
  RAISE NOTICE '👤 Parceiro ID: %', v_partner_id;
  RAISE NOTICE '👨‍⚕️ Especialista ID: %', v_specialist_id;

END $$;
