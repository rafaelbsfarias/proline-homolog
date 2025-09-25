-- Criação da tabela mechanics_checklist para armazenar dados do checklist de mecânica
-- Cada item do checklist tem sua própria coluna para facilitar consultas e validações

CREATE TABLE mechanics_checklist (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status do checklist
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'submitted')),
  
  -- MOTOR
  motor_condition TEXT CHECK (motor_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  motor_notes TEXT,
  motor_images TEXT[], -- Array de URLs do storage
  
  -- TRANSMISSÃO
  transmission_condition TEXT CHECK (transmission_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  transmission_notes TEXT,
  transmission_images TEXT[],
  
  -- FREIOS
  brakes_condition TEXT CHECK (brakes_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  brake_pads_front NUMERIC(5,2), -- mm de pastilha
  brake_pads_rear NUMERIC(5,2),
  brake_discs_front_condition TEXT CHECK (brake_discs_front_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  brake_discs_rear_condition TEXT CHECK (brake_discs_rear_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  brakes_notes TEXT,
  brakes_images TEXT[],
  
  -- SUSPENSÃO
  suspension_condition TEXT CHECK (suspension_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  suspension_front_left TEXT CHECK (suspension_front_left IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  suspension_front_right TEXT CHECK (suspension_front_right IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  suspension_rear_left TEXT CHECK (suspension_rear_left IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  suspension_rear_right TEXT CHECK (suspension_rear_right IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  suspension_notes TEXT,
  suspension_images TEXT[],
  
  -- PNEUS
  tires_condition TEXT CHECK (tires_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  tire_front_left_depth NUMERIC(3,1), -- mm
  tire_front_right_depth NUMERIC(3,1),
  tire_rear_left_depth NUMERIC(3,1),
  tire_rear_right_depth NUMERIC(3,1),
  tire_front_left_condition TEXT CHECK (tire_front_left_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  tire_front_right_condition TEXT CHECK (tire_front_right_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  tire_rear_left_condition TEXT CHECK (tire_rear_left_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  tire_rear_right_condition TEXT CHECK (tire_rear_right_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  tires_notes TEXT,
  tires_images TEXT[],
  
  -- SISTEMA ELÉTRICO
  electrical_condition TEXT CHECK (electrical_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  battery_voltage NUMERIC(4,2), -- volts
  alternator_condition TEXT CHECK (alternator_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  electrical_notes TEXT,
  electrical_images TEXT[],
  
  -- FLUIDOS
  oil_condition TEXT CHECK (oil_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  oil_level TEXT CHECK (oil_level IN ('full', 'adequate', 'low', 'critical')),
  coolant_condition TEXT CHECK (coolant_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  coolant_level TEXT CHECK (coolant_level IN ('full', 'adequate', 'low', 'critical')),
  brake_fluid_condition TEXT CHECK (brake_fluid_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  brake_fluid_level TEXT CHECK (brake_fluid_level IN ('full', 'adequate', 'low', 'critical')),
  fluids_notes TEXT,
  fluids_images TEXT[],
  
  -- CARROCERIA E PINTURA
  body_condition TEXT CHECK (body_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  paint_condition TEXT CHECK (paint_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  rust_spots BOOLEAN DEFAULT FALSE,
  dents BOOLEAN DEFAULT FALSE,
  scratches BOOLEAN DEFAULT FALSE,
  body_notes TEXT,
  body_images TEXT[],
  
  -- INTERIOR
  interior_condition TEXT CHECK (interior_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  seats_condition TEXT CHECK (seats_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  dashboard_condition TEXT CHECK (dashboard_condition IN ('excellent', 'good', 'regular', 'poor', 'critical')),
  interior_notes TEXT,
  interior_images TEXT[],
  
  -- DOCUMENTAÇÃO E OBSERVAÇÕES GERAIS
  documents_ok BOOLEAN DEFAULT FALSE,
  maintenance_history TEXT,
  general_observations TEXT,
  recommended_repairs TEXT,
  estimated_repair_cost NUMERIC(10,2),
  
  -- Fotos gerais do veículo
  general_images TEXT[]
);

-- Índices para performance
CREATE INDEX idx_mechanics_checklist_vehicle_id ON mechanics_checklist(vehicle_id);
CREATE INDEX idx_mechanics_checklist_partner_id ON mechanics_checklist(partner_id);
CREATE INDEX idx_mechanics_checklist_status ON mechanics_checklist(status);
CREATE INDEX idx_mechanics_checklist_created_at ON mechanics_checklist(created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_mechanics_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mechanics_checklist_updated_at
  BEFORE UPDATE ON mechanics_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_mechanics_checklist_updated_at();

-- RLS (Row Level Security) - Adicionar políticas conforme necessário
ALTER TABLE mechanics_checklist ENABLE ROW LEVEL SECURITY;

-- Política básica: parceiros só podem ver/editar seus próprios checklists
CREATE POLICY "Partners can manage their own checklists" ON mechanics_checklist
  FOR ALL USING (auth.uid()::text = partner_id::text);

-- Política para admins (se necessário)
-- CREATE POLICY "Admins can manage all checklists" ON mechanics_checklist
--   FOR ALL TO admin_role USING (true);

-- Comentários para documentação
COMMENT ON TABLE mechanics_checklist IS 'Checklist mecânico detalhado para veículos, preenchido por parceiros';
COMMENT ON COLUMN mechanics_checklist.vehicle_id IS 'Referência ao veículo sendo inspecionado';
COMMENT ON COLUMN mechanics_checklist.partner_id IS 'ID do parceiro que está realizando a inspeção';
COMMENT ON COLUMN mechanics_checklist.status IS 'Status do preenchimento do checklist';
COMMENT ON COLUMN mechanics_checklist.motor_images IS 'URLs das imagens do motor no storage vehicle-media';
COMMENT ON COLUMN mechanics_checklist.estimated_repair_cost IS 'Custo estimado dos reparos identificados';