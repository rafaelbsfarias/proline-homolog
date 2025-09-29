-- Atualiza mechanics_checklist para suportar vínculo com inspeção e evidências separadas

-- 1) Adiciona coluna inspection_id
ALTER TABLE IF EXISTS mechanics_checklist
  ADD COLUMN IF NOT EXISTS inspection_id UUID REFERENCES inspections(id);

-- 2) Ajusta constraints de unicidade: remove UNIQUE(vehicle_id) se existir e cria (vehicle_id, inspection_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_vehicle_id'
      AND conrelid = 'mechanics_checklist'::regclass
  ) THEN
    ALTER TABLE mechanics_checklist DROP CONSTRAINT unique_vehicle_id;
  END IF;
END $$;

ALTER TABLE mechanics_checklist
  ADD CONSTRAINT unique_vehicle_inspection UNIQUE (vehicle_id, inspection_id);

-- 3) Cria tabela para evidências (somente referências a arquivos no storage)
CREATE TABLE IF NOT EXISTS mechanics_checklist_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (inspection_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_mce_inspection_id ON mechanics_checklist_evidences(inspection_id);
CREATE INDEX IF NOT EXISTS idx_mce_vehicle_id ON mechanics_checklist_evidences(vehicle_id);
