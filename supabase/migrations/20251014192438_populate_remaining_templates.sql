-- =====================================================
-- Migration: Populate Remaining Templates
-- Description: Popular itens dos templates de outras categorias
-- Author: System
-- Date: 2025-10-14
-- =====================================================

-- 1. Template: Funilaria/Pintura
-- =====================================================
DO $$
DECLARE
  template_funilaria UUID;
BEGIN
  -- Buscar ID do template de funilaria_pintura
  SELECT id INTO template_funilaria
  FROM checklist_templates
  WHERE category = 'funilaria_pintura' AND version = '1.0';

  -- Seção: Carroceria/Funilaria
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_funilaria, 'body_damage_assessment', 'Avaliação de Danos na Carroceria', 'body', 'avaliacao', 1, true, 'Inspeção geral de amassados, riscos e danos estruturais'),
    (template_funilaria, 'front_bumper', 'Para-choque Dianteiro', 'body', 'componentes', 2, true, 'Estado e alinhamento do para-choque dianteiro'),
    (template_funilaria, 'rear_bumper', 'Para-choque Traseiro', 'body', 'componentes', 3, true, 'Estado e alinhamento do para-choque traseiro'),
    (template_funilaria, 'doors_alignment', 'Alinhamento de Portas', 'body', 'portas', 4, true, 'Verificar folgas, alinhamento e fechamento'),
    (template_funilaria, 'hood_trunk', 'Capô e Porta-malas', 'body', 'tampas', 5, true, 'Estado e alinhamento de capô e porta-malas'),
    (template_funilaria, 'fenders', 'Para-lamas', 'body', 'componentes', 6, false, 'Condição dos para-lamas dianteiros e traseiros'),
    (template_funilaria, 'rocker_panels', 'Soleiras', 'body', 'estrutura', 7, false, 'Estado das soleiras laterais');

  -- Seção: Pintura
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_funilaria, 'paint_condition', 'Condição Geral da Pintura', 'paint', 'avaliacao', 1, true, 'Estado geral da pintura (brilho, oxidação, desbotamento)'),
    (template_funilaria, 'paint_color_match', 'Uniformidade de Cor', 'paint', 'acabamento', 2, true, 'Verificar diferenças de tonalidade'),
    (template_funilaria, 'clear_coat', 'Verniz/Clear Coat', 'paint', 'acabamento', 3, true, 'Estado do verniz protetor'),
    (template_funilaria, 'scratches_chips', 'Riscos e Lascas', 'paint', 'danos', 4, true, 'Identificar riscos superficiais e lascas'),
    (template_funilaria, 'rust_spots', 'Pontos de Ferrugem', 'paint', 'corrosao', 5, true, 'Verificar início de corrosão'),
    (template_funilaria, 'paint_thickness', 'Espessura da Pintura', 'paint', 'medicao', 6, false, 'Medição com espessímetro (detectar repintura)');

  -- Seção: Polimento e Acabamento
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_funilaria, 'surface_preparation', 'Preparo de Superfície', 'finishing', 'preparacao', 1, false, 'Lixamento, desengraxe e primer'),
    (template_funilaria, 'polishing_needed', 'Necessidade de Polimento', 'finishing', 'polimento', 2, false, 'Avaliar se requer polimento técnico'),
    (template_funilaria, 'waxing_protection', 'Proteção (Cera/Vitrificação)', 'finishing', 'protecao', 3, false, 'Estado da proteção aplicada');

END $$;

-- 2. Template: Lavagem
-- =====================================================
DO $$
DECLARE
  template_lavagem UUID;
BEGIN
  SELECT id INTO template_lavagem
  FROM checklist_templates
  WHERE category = 'lavagem' AND version = '1.0';

  -- Seção: Exterior
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_lavagem, 'exterior_wash', 'Lavagem Externa Completa', 'exterior', 'lavagem', 1, true, 'Carroceria, vidros, rodas e pneus'),
    (template_lavagem, 'wheels_tires', 'Limpeza de Rodas e Pneus', 'exterior', 'rodas', 2, true, 'Remoção de sujeira e pretinho nos pneus'),
    (template_lavagem, 'glass_cleaning', 'Limpeza de Vidros', 'exterior', 'vidros', 3, true, 'Vidros externos sem manchas'),
    (template_lavagem, 'mirrors_trim', 'Retrovisores e Frisos', 'exterior', 'detalhes', 4, false, 'Limpeza de retrovisores e frisos plásticos'),
    (template_lavagem, 'wax_application', 'Aplicação de Cera', 'exterior', 'protecao', 5, false, 'Cera líquida ou pasta aplicada');

  -- Seção: Interior
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_lavagem, 'vacuum_cleaning', 'Aspiração Completa', 'interior', 'limpeza', 1, true, 'Bancos, tapetes, porta-malas'),
    (template_lavagem, 'dashboard_console', 'Painel e Console', 'interior', 'superficies', 2, true, 'Limpeza e hidratação do painel'),
    (template_lavagem, 'seats_upholstery', 'Bancos e Estofados', 'interior', 'estofados', 3, true, 'Limpeza profunda de tecido ou couro'),
    (template_lavagem, 'door_panels', 'Forros de Porta', 'interior', 'superficies', 4, false, 'Limpeza dos forros internos'),
    (template_lavagem, 'ceiling_carpet', 'Teto e Carpete', 'interior', 'revestimentos', 5, false, 'Limpeza de teto e carpete'),
    (template_lavagem, 'ac_vents', 'Saídas de Ar', 'interior', 'detalhes', 6, false, 'Limpeza das grades de ventilação');

  -- Seção: Higienização
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_lavagem, 'sanitization', 'Higienização/Sanitização', 'hygiene', 'sanitizacao', 1, false, 'Aplicação de produtos sanitizantes'),
    (template_lavagem, 'odor_removal', 'Eliminação de Odores', 'hygiene', 'odores', 2, false, 'Tratamento com ozônio ou produtos específicos'),
    (template_lavagem, 'ac_cleaning', 'Limpeza de Ar-condicionado', 'hygiene', 'ar_condicionado', 3, false, 'Higienização do sistema de ar');

END $$;

-- 3. Template: Pneus
-- =====================================================
DO $$
DECLARE
  template_pneus UUID;
BEGIN
  SELECT id INTO template_pneus
  FROM checklist_templates
  WHERE category = 'pneus' AND version = '1.0';

  -- Seção: Inspeção de Pneus
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_pneus, 'tire_tread_depth', 'Profundidade dos Sulcos', 'inspection', 'medicao', 1, true, 'Medir com paquímetro (mínimo 1.6mm)'),
    (template_pneus, 'tire_wear_pattern', 'Padrão de Desgaste', 'inspection', 'desgaste', 2, true, 'Verificar desgaste irregular'),
    (template_pneus, 'tire_pressure', 'Pressão dos Pneus', 'inspection', 'calibragem', 3, true, 'Verificar e corrigir pressão'),
    (template_pneus, 'tire_damage', 'Danos Visíveis', 'inspection', 'danos', 4, true, 'Cortes, bolhas, rachaduras'),
    (template_pneus, 'valve_condition', 'Estado das Válvulas', 'inspection', 'valvulas', 5, true, 'Verificar vazamentos e tampas'),
    (template_pneus, 'spare_tire', 'Estepe', 'inspection', 'estepe', 6, false, 'Condição e pressão do estepe');

  -- Seção: Rodas
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_pneus, 'wheel_condition', 'Condição das Rodas', 'wheels', 'avaliacao', 1, true, 'Amassados, trincas, corrosão'),
    (template_pneus, 'wheel_balance', 'Balanceamento', 'wheels', 'balanceamento', 2, true, 'Verificar necessidade de balanceamento'),
    (template_pneus, 'lug_nuts', 'Porcas de Roda', 'wheels', 'fixacao', 3, true, 'Torque e condição das porcas');

  -- Seção: Alinhamento e Geometria
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_pneus, 'wheel_alignment', 'Alinhamento', 'alignment', 'geometria', 1, true, 'Verificar se necessita alinhamento'),
    (template_pneus, 'camber_caster', 'Cambagem e Cáster', 'alignment', 'angulos', 2, false, 'Medição de ângulos de suspensão'),
    (template_pneus, 'toe_adjustment', 'Convergência (Toe)', 'alignment', 'angulos', 3, false, 'Ajuste de convergência');

  -- Seção: Serviços
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_pneus, 'tire_rotation', 'Rodízio de Pneus', 'services', 'manutencao', 1, false, 'Realizar rodízio conforme padrão'),
    (template_pneus, 'puncture_repair', 'Reparo de Furos', 'services', 'reparos', 2, false, 'Verificar furos reparáveis');

END $$;

-- 4. Template: Loja
-- =====================================================
DO $$
DECLARE
  template_loja UUID;
BEGIN
  SELECT id INTO template_loja
  FROM checklist_templates
  WHERE category = 'loja' AND version = '1.0';

  -- Seção: Inspeção para Vendas
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_loja, 'parts_needed', 'Peças Necessárias', 'sales', 'levantamento', 1, true, 'Identificar peças que precisam ser vendidas'),
    (template_loja, 'part_compatibility', 'Compatibilidade de Peças', 'sales', 'verificacao', 2, true, 'Verificar compatibilidade com o veículo'),
    (template_loja, 'parts_availability', 'Disponibilidade em Estoque', 'sales', 'estoque', 3, true, 'Consultar estoque de peças'),
    (template_loja, 'oem_aftermarket', 'Tipo de Peça (Original/Paralela)', 'sales', 'qualidade', 4, false, 'Definir tipo de peça a fornecer');

  -- Seção: Acessórios
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_loja, 'accessories_needed', 'Acessórios Sugeridos', 'accessories', 'sugestoes', 1, false, 'Tapetes, capas, organizadores'),
    (template_loja, 'electronics', 'Eletrônicos', 'accessories', 'eletronicos', 2, false, 'Alarme, som, câmera de ré'),
    (template_loja, 'appearance_items', 'Itens de Aparência', 'accessories', 'estetica', 3, false, 'Películas, cromados, adesivos');

  -- Seção: Condição Geral do Veículo
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_loja, 'general_condition', 'Condição Geral', 'general', 'avaliacao', 1, true, 'Avaliação geral para venda de peças'),
    (template_loja, 'urgent_parts', 'Peças Urgentes', 'general', 'prioridade', 2, true, 'Itens críticos que precisam substituição imediata');

END $$;

-- 5. Template: Pátio Atacado
-- =====================================================
DO $$
DECLARE
  template_patio UUID;
BEGIN
  SELECT id INTO template_patio
  FROM checklist_templates
  WHERE category = 'patio_atacado' AND version = '1.0';

  -- Seção: Documentação
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_patio, 'vehicle_documents', 'Documentação do Veículo', 'documentation', 'docs', 1, true, 'CRLV, nota fiscal, histórico'),
    (template_patio, 'license_plate', 'Placa e Identificação', 'documentation', 'identificacao', 2, true, 'Verificar placa, chassi, renavam'),
    (template_patio, 'ownership_history', 'Histórico de Proprietários', 'documentation', 'historico', 3, false, 'Quantidade de donos anteriores');

  -- Seção: Avaliação Geral
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_patio, 'overall_condition', 'Estado Geral do Veículo', 'general', 'avaliacao', 1, true, 'Avaliação geral (excelente, bom, regular, ruim)'),
    (template_patio, 'mileage', 'Quilometragem', 'general', 'uso', 2, true, 'Registrar hodômetro'),
    (template_patio, 'accidents_history', 'Histórico de Acidentes', 'general', 'historico', 3, true, 'Verificar sinais de colisão/reparo');

  -- Seção: Motor e Mecânica
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_patio, 'engine_start', 'Partida do Motor', 'mechanical', 'motor', 1, true, 'Motor liga normalmente'),
    (template_patio, 'engine_noise', 'Ruídos Anormais', 'mechanical', 'motor', 2, true, 'Detectar ruídos estranhos'),
    (template_patio, 'fluid_leaks', 'Vazamentos', 'mechanical', 'fluidos', 3, true, 'Óleo, água, combustível'),
    (template_patio, 'transmission_operation', 'Funcionamento do Câmbio', 'mechanical', 'transmissao', 4, true, 'Trocas de marcha suaves');

  -- Seção: Carroceria e Pintura
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_patio, 'body_paint_condition', 'Condição da Carroceria e Pintura', 'body', 'avaliacao', 1, true, 'Estado geral da lataria e pintura'),
    (template_patio, 'panel_alignment', 'Alinhamento de Painéis', 'body', 'estrutura', 2, true, 'Verificar folgas irregulares'),
    (template_patio, 'rust_corrosion', 'Ferrugem/Corrosão', 'body', 'corrosao', 3, true, 'Pontos de ferrugem visíveis');

  -- Seção: Interior
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_patio, 'interior_condition', 'Condição do Interior', 'interior', 'avaliacao', 1, true, 'Bancos, painel, console'),
    (template_patio, 'electronics_operation', 'Funcionamento de Eletrônicos', 'interior', 'eletronicos', 2, true, 'Ar, som, vidros, travas'),
    (template_patio, 'odors_stains', 'Odores e Manchas', 'interior', 'limpeza', 3, false, 'Verificar odores e manchas difíceis');

  -- Seção: Teste de Rodagem
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required, description)
  VALUES
    (template_patio, 'test_drive', 'Teste de Rodagem', 'test_drive', 'teste', 1, false, 'Realizar test drive se possível'),
    (template_patio, 'braking_performance', 'Desempenho de Frenagem', 'test_drive', 'freios', 2, false, 'Freios respondem adequadamente'),
    (template_patio, 'steering_response', 'Resposta da Direção', 'test_drive', 'direcao', 3, false, 'Direção sem folgas ou ruídos');

END $$;

-- 6. Verificar populamento
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Templates populados com sucesso!';
  RAISE NOTICE 'Funilaria/Pintura: % itens', 
    (SELECT COUNT(*) FROM checklist_template_items cti 
     JOIN checklist_templates ct ON ct.id = cti.template_id 
     WHERE ct.category = 'funilaria_pintura');
  RAISE NOTICE 'Lavagem: % itens', 
    (SELECT COUNT(*) FROM checklist_template_items cti 
     JOIN checklist_templates ct ON ct.id = cti.template_id 
     WHERE ct.category = 'lavagem');
  RAISE NOTICE 'Pneus: % itens', 
    (SELECT COUNT(*) FROM checklist_template_items cti 
     JOIN checklist_templates ct ON ct.id = cti.template_id 
     WHERE ct.category = 'pneus');
  RAISE NOTICE 'Loja: % itens', 
    (SELECT COUNT(*) FROM checklist_template_items cti 
     JOIN checklist_templates ct ON ct.id = cti.template_id 
     WHERE ct.category = 'loja');
  RAISE NOTICE 'Pátio Atacado: % itens', 
    (SELECT COUNT(*) FROM checklist_template_items cti 
     JOIN checklist_templates ct ON ct.id = cti.template_id 
     WHERE ct.category = 'patio_atacado');
END $$;

-- =====================================================
-- Fim da Migration
-- =====================================================
