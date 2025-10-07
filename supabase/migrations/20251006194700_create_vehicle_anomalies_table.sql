-- Criação da tabela vehicle_anomalies para armazenar anomalias específicas do veículo
-- Usada pelo dynamic-checklist para parceiros não-mecânicos

CREATE TABLE IF NOT EXISTS vehicle_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}', -- Array de URLs/paths das fotos no storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vehicle_anomalies_inspection_id ON vehicle_anomalies(inspection_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_anomalies_vehicle_id ON vehicle_anomalies(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_anomalies_created_at ON vehicle_anomalies(created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_vehicle_anomalies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_vehicle_anomalies_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_vehicle_anomalies_updated_at
      BEFORE UPDATE ON vehicle_anomalies
      FOR EACH ROW
      EXECUTE FUNCTION update_vehicle_anomalies_updated_at();
  END IF;
END $$;

-- RLS (Row Level Security)
ALTER TABLE vehicle_anomalies ENABLE ROW LEVEL SECURITY;

-- Remove política existente se houver
DROP POLICY IF EXISTS "Users can manage anomalies for accessible inspections" ON vehicle_anomalies;
DROP POLICY IF EXISTS "Users can manage anomalies for accessible vehicles" ON vehicle_anomalies;

-- Política: usuários autenticados podem gerenciar anomalias de inspeções que têm acesso
-- Partners podem acessar anomalias de vehicles para os quais têm quotes ativas
-- Clients podem acessar anomalias de seus próprios vehicles
-- Specialists podem acessar anomalias de vehicles de seus clients
CREATE POLICY "Users can manage anomalies for accessible vehicles" ON vehicle_anomalies
  FOR ALL USING (
    -- Partners: têm quotes para service_orders que envolvem o vehicle
    EXISTS (
      SELECT 1 FROM quotes q
      JOIN service_orders so ON so.id = q.service_order_id
      WHERE so.vehicle_id = vehicle_anomalies.vehicle_id
      AND q.partner_id = auth.uid()
    )
    OR
    -- Clients: proprietários do vehicle
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = vehicle_anomalies.vehicle_id
      AND v.client_id = auth.uid()
    )
    OR
    -- Specialists: vehicles de seus clients associados
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN client_specialists cs ON cs.client_id = v.client_id
      WHERE v.id = vehicle_anomalies.vehicle_id
      AND cs.specialist_id = auth.uid()
    )
    OR
    -- Admins: acesso total
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Comentários para documentação
COMMENT ON TABLE vehicle_anomalies IS 'Anomalias específicas do veículo registradas no dynamic-checklist';
COMMENT ON COLUMN vehicle_anomalies.inspection_id IS 'Referência à inspeção relacionada';
COMMENT ON COLUMN vehicle_anomalies.vehicle_id IS 'Referência ao veículo inspecionado';
COMMENT ON COLUMN vehicle_anomalies.description IS 'Descrição detalhada da anomalia';
COMMENT ON COLUMN vehicle_anomalies.photos IS 'Array de URLs das fotos da anomalia no storage vehicle-media';
