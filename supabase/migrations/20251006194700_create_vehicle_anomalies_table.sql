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

CREATE TRIGGER trigger_update_vehicle_anomalies_updated_at
  BEFORE UPDATE ON vehicle_anomalies
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_anomalies_updated_at();

-- RLS (Row Level Security)
ALTER TABLE vehicle_anomalies ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados podem gerenciar anomalias de inspeções que têm acesso
CREATE POLICY "Users can manage anomalies for accessible inspections" ON vehicle_anomalies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = vehicle_anomalies.inspection_id
      AND (
        i.partner_id::text = auth.uid()::text
        OR i.client_id::text = auth.uid()::text
      )
    )
  );

-- Comentários para documentação
COMMENT ON TABLE vehicle_anomalies IS 'Anomalias específicas do veículo registradas no dynamic-checklist';
COMMENT ON COLUMN vehicle_anomalies.inspection_id IS 'Referência à inspeção relacionada';
COMMENT ON COLUMN vehicle_anomalies.vehicle_id IS 'Referência ao veículo inspecionado';
COMMENT ON COLUMN vehicle_anomalies.description IS 'Descrição detalhada da anomalia';
COMMENT ON COLUMN vehicle_anomalies.photos IS 'Array de URLs das fotos da anomalia no storage vehicle-media';
