-- Tabela para armazenar o status por item do checklist, sem alterar a UI

CREATE TABLE IF NOT EXISTS mechanics_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  item_status TEXT NOT NULL CHECK (item_status IN ('ok','attention','critical')),
  item_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (inspection_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_mci_inspection_id ON mechanics_checklist_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_mci_vehicle_id ON mechanics_checklist_items(vehicle_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_mechanics_checklist_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mechanics_checklist_items_updated_at
  BEFORE UPDATE ON mechanics_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_mechanics_checklist_items_updated_at();
