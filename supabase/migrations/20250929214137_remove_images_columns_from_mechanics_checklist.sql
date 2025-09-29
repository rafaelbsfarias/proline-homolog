-- Remove colunas de imagens da tabela mechanics_checklist
-- As imagens agora são referenciadas em mechanics_checklist_evidences

ALTER TABLE IF EXISTS mechanics_checklist
  DROP COLUMN IF EXISTS motor_images,
  DROP COLUMN IF EXISTS transmission_images,
  DROP COLUMN IF EXISTS brakes_images,
  DROP COLUMN IF EXISTS suspension_images,
  DROP COLUMN IF EXISTS tires_images,
  DROP COLUMN IF EXISTS electrical_images,
  DROP COLUMN IF EXISTS fluids_images,
  DROP COLUMN IF EXISTS body_images,
  DROP COLUMN IF EXISTS interior_images,
  DROP COLUMN IF EXISTS general_images;
