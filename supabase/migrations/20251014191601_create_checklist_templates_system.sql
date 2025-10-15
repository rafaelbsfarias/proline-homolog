-- =====================================================
-- Migration: Create Checklist Templates System
-- Description: Sistema de templates versionados por categoria
-- Author: System
-- Date: 2025-10-14
-- =====================================================

-- 1. Criar tabela de templates
-- =====================================================
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Garantir apenas um template ativo por categoria
  CONSTRAINT unique_active_category 
    EXCLUDE (category WITH =) 
    WHERE (is_active = true),
  
  -- Garantir unicidade de versão por categoria
  CONSTRAINT unique_category_version 
    UNIQUE (category, version)
);

-- 2. Criar tabela de itens do template
-- =====================================================
CREATE TABLE IF NOT EXISTS checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  
  -- Chave do item (usado no mechanics_checklist_items)
  item_key TEXT NOT NULL,
  
  -- Informações de exibição
  label TEXT NOT NULL,
  description TEXT,
  help_text TEXT,
  
  -- Agrupamento e ordem
  section TEXT NOT NULL, -- 'motor', 'transmission', 'brakes', etc.
  subsection TEXT, -- 'engine_oil', 'brake_pads', etc.
  position INTEGER NOT NULL DEFAULT 0,
  
  -- Validações
  is_required BOOLEAN NOT NULL DEFAULT false,
  allows_photos BOOLEAN NOT NULL DEFAULT true,
  max_photos INTEGER DEFAULT 5,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Garantir unicidade de item_key por template
  CONSTRAINT unique_template_item_key 
    UNIQUE (template_id, item_key)
);

-- 3. Criar índices de performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_templates_category 
  ON checklist_templates(category);

CREATE INDEX IF NOT EXISTS idx_templates_active 
  ON checklist_templates(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_template_items_template 
  ON checklist_template_items(template_id);

CREATE INDEX IF NOT EXISTS idx_template_items_section 
  ON checklist_template_items(template_id, section, position);

-- 4. Adicionar trigger de updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_checklist_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_checklist_templates_updated_at
  BEFORE UPDATE ON checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_checklist_templates_updated_at();

-- 5. Criar função auxiliar para buscar template ativo
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_template_for_category(p_category TEXT)
RETURNS UUID AS $$
DECLARE
  template_id UUID;
BEGIN
  SELECT id INTO template_id
  FROM checklist_templates
  WHERE category = p_category
    AND is_active = true
  LIMIT 1;
  
  RETURN template_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Popular templates padrão para categorias existentes
-- =====================================================

-- Template: Mecânica (Oficina Mecânica)
INSERT INTO checklist_templates (category, version, title, description)
VALUES (
  'mecanica',
  '1.0',
  'Checklist Mecânica Padrão',
  'Template padrão para inspeção de mecânica automotiva'
) ON CONFLICT (category, version) DO NOTHING;

-- Template: Funilaria/Pintura
INSERT INTO checklist_templates (category, version, title, description)
VALUES (
  'funilaria_pintura',
  '1.0',
  'Checklist Funilaria e Pintura',
  'Template padrão para inspeção de funilaria e pintura'
) ON CONFLICT (category, version) DO NOTHING;

-- Template: Lavagem
INSERT INTO checklist_templates (category, version, title, description)
VALUES (
  'lavagem',
  '1.0',
  'Checklist Lavagem',
  'Template padrão para serviços de lavagem'
) ON CONFLICT (category, version) DO NOTHING;

-- Template: Pneus
INSERT INTO checklist_templates (category, version, title, description)
VALUES (
  'pneus',
  '1.0',
  'Checklist Pneus',
  'Template padrão para serviços de pneus'
) ON CONFLICT (category, version) DO NOTHING;

-- Template: Loja
INSERT INTO checklist_templates (category, version, title, description)
VALUES (
  'loja',
  '1.0',
  'Checklist Loja',
  'Template padrão para loja de peças'
) ON CONFLICT (category, version) DO NOTHING;

-- Template: Pátio Atacado
INSERT INTO checklist_templates (category, version, title, description)
VALUES (
  'patio_atacado',
  '1.0',
  'Checklist Pátio Atacado',
  'Template padrão para pátio atacado'
) ON CONFLICT (category, version) DO NOTHING;

-- 7. Popular itens do template de Mecânica
-- =====================================================
DO $$
DECLARE
  template_mecanica UUID;
BEGIN
  -- Buscar ID do template de mecânica
  SELECT id INTO template_mecanica
  FROM checklist_templates
  WHERE category = 'mecanica' AND version = '1.0';

  -- Seção: Motor
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required)
  VALUES
    (template_mecanica, 'motor_condition', 'Condição Geral do Motor', 'motor', 'geral', 1, true),
    (template_mecanica, 'engine_oil', 'Nível e Qualidade do Óleo', 'motor', 'lubrificacao', 2, true),
    (template_mecanica, 'coolant_level', 'Nível do Líquido de Arrefecimento', 'motor', 'arrefecimento', 3, true),
    (template_mecanica, 'air_filter', 'Estado do Filtro de Ar', 'motor', 'filtragem', 4, false),
    (template_mecanica, 'belts_hoses', 'Correias e Mangueiras', 'motor', 'acessorios', 5, true);

  -- Seção: Transmissão
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required)
  VALUES
    (template_mecanica, 'transmission_condition', 'Condição da Transmissão', 'transmission', 'geral', 1, true),
    (template_mecanica, 'clutch_operation', 'Funcionamento da Embreagem', 'transmission', 'embreagem', 2, false),
    (template_mecanica, 'gear_shifting', 'Troca de Marchas', 'transmission', 'cambio', 3, true);

  -- Seção: Freios
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required)
  VALUES
    (template_mecanica, 'brakes_condition', 'Condição Geral dos Freios', 'brakes', 'geral', 1, true),
    (template_mecanica, 'brake_pads_front', 'Pastilhas Dianteiras (% vida útil)', 'brakes', 'pastilhas', 2, true),
    (template_mecanica, 'brake_pads_rear', 'Pastilhas Traseiras (% vida útil)', 'brakes', 'pastilhas', 3, true),
    (template_mecanica, 'brake_fluid', 'Líquido de Freio', 'brakes', 'fluidos', 4, true);

  -- Seção: Suspensão
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required)
  VALUES
    (template_mecanica, 'suspension_condition', 'Condição da Suspensão', 'suspension', 'geral', 1, true),
    (template_mecanica, 'shock_absorbers', 'Amortecedores', 'suspension', 'amortecedores', 2, true),
    (template_mecanica, 'ball_joints', 'Juntas e Terminais', 'suspension', 'componentes', 3, false);

  -- Seção: Pneus
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required)
  VALUES
    (template_mecanica, 'tires_condition', 'Condição Geral dos Pneus', 'tires', 'geral', 1, true),
    (template_mecanica, 'tire_pressure', 'Calibragem dos Pneus', 'tires', 'calibragem', 2, true),
    (template_mecanica, 'tire_tread', 'Profundidade dos Sulcos', 'tires', 'desgaste', 3, true);

  -- Seção: Sistema Elétrico
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required)
  VALUES
    (template_mecanica, 'electrical_condition', 'Condição do Sistema Elétrico', 'electrical', 'geral', 1, true),
    (template_mecanica, 'battery_voltage', 'Tensão da Bateria', 'electrical', 'bateria', 2, true),
    (template_mecanica, 'alternator_condition', 'Funcionamento do Alternador', 'electrical', 'alternador', 3, false),
    (template_mecanica, 'lights_signals', 'Luzes e Sinalizadores', 'electrical', 'iluminacao', 4, true);

  -- Seção: Carroceria e Interior
  INSERT INTO checklist_template_items 
    (template_id, item_key, label, section, subsection, position, is_required)
  VALUES
    (template_mecanica, 'body_condition', 'Condição da Carroceria', 'body_interior', 'carroceria', 1, false),
    (template_mecanica, 'interior_condition', 'Condição do Interior', 'body_interior', 'interior', 2, false),
    (template_mecanica, 'ac_heating', 'Ar Condicionado e Aquecimento', 'body_interior', 'conforto', 3, false);

END $$;

-- 8. Comentários e documentação
-- =====================================================
COMMENT ON TABLE checklist_templates IS 
  'Templates versionados de checklists por categoria de parceiro';

COMMENT ON TABLE checklist_template_items IS 
  'Itens que compõem cada template de checklist';

COMMENT ON COLUMN checklist_templates.is_active IS 
  'Apenas um template pode estar ativo por categoria (usado para novos checklists)';

COMMENT ON COLUMN checklist_template_items.item_key IS 
  'Chave única do item, usada em mechanics_checklist_items para rastreamento';

COMMENT ON COLUMN checklist_template_items.section IS 
  'Agrupamento principal (motor, transmission, brakes, etc.)';

COMMENT ON COLUMN checklist_template_items.subsection IS 
  'Subagrupamento opcional dentro da seção';

-- =====================================================
-- Fim da Migration
-- =====================================================
