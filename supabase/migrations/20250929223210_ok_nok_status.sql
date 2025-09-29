-- Align mechanics checklist status to binary 'ok'/'nok'
-- Idempotent migration: drop legacy CHECKs, normalize values, recreate CHECKs

BEGIN;

-- 1) Drop old constraints first (avoid violations during UPDATE)
ALTER TABLE mechanics_checklist DROP CONSTRAINT IF EXISTS mechanics_checklist_motor_condition_check;
ALTER TABLE mechanics_checklist DROP CONSTRAINT IF EXISTS mechanics_checklist_transmission_condition_check;
ALTER TABLE mechanics_checklist DROP CONSTRAINT IF EXISTS mechanics_checklist_brakes_condition_check;
ALTER TABLE mechanics_checklist DROP CONSTRAINT IF EXISTS mechanics_checklist_suspension_condition_check;
ALTER TABLE mechanics_checklist DROP CONSTRAINT IF EXISTS mechanics_checklist_tires_condition_check;
ALTER TABLE mechanics_checklist DROP CONSTRAINT IF EXISTS mechanics_checklist_electrical_condition_check;
ALTER TABLE mechanics_checklist_items DROP CONSTRAINT IF EXISTS mechanics_checklist_items_item_status_check;

-- 2) Normalize existing values in mechanics_checklist to 'ok'/'nok'
UPDATE mechanics_checklist SET motor_condition = CASE LOWER(COALESCE(motor_condition, ''))
  WHEN 'good' THEN 'ok'
  WHEN 'poor' THEN 'nok'
  WHEN 'regular' THEN 'nok'
  WHEN 'critical' THEN 'nok'
  ELSE motor_condition END
WHERE motor_condition IS NOT NULL
  AND LOWER(motor_condition) IN ('good','poor','regular','critical');

UPDATE mechanics_checklist SET transmission_condition = CASE LOWER(COALESCE(transmission_condition, ''))
  WHEN 'good' THEN 'ok'
  WHEN 'poor' THEN 'nok'
  WHEN 'regular' THEN 'nok'
  WHEN 'critical' THEN 'nok'
  ELSE transmission_condition END
WHERE transmission_condition IS NOT NULL
  AND LOWER(transmission_condition) IN ('good','poor','regular','critical');

UPDATE mechanics_checklist SET brakes_condition = CASE LOWER(COALESCE(brakes_condition, ''))
  WHEN 'good' THEN 'ok'
  WHEN 'poor' THEN 'nok'
  WHEN 'regular' THEN 'nok'
  WHEN 'critical' THEN 'nok'
  ELSE brakes_condition END
WHERE brakes_condition IS NOT NULL
  AND LOWER(brakes_condition) IN ('good','poor','regular','critical');

UPDATE mechanics_checklist SET suspension_condition = CASE LOWER(COALESCE(suspension_condition, ''))
  WHEN 'good' THEN 'ok'
  WHEN 'poor' THEN 'nok'
  WHEN 'regular' THEN 'nok'
  WHEN 'critical' THEN 'nok'
  ELSE suspension_condition END
WHERE suspension_condition IS NOT NULL
  AND LOWER(suspension_condition) IN ('good','poor','regular','critical');

UPDATE mechanics_checklist SET tires_condition = CASE LOWER(COALESCE(tires_condition, ''))
  WHEN 'good' THEN 'ok'
  WHEN 'poor' THEN 'nok'
  WHEN 'regular' THEN 'nok'
  WHEN 'critical' THEN 'nok'
  ELSE tires_condition END
WHERE tires_condition IS NOT NULL
  AND LOWER(tires_condition) IN ('good','poor','regular','critical');

UPDATE mechanics_checklist SET electrical_condition = CASE LOWER(COALESCE(electrical_condition, ''))
  WHEN 'good' THEN 'ok'
  WHEN 'poor' THEN 'nok'
  WHEN 'regular' THEN 'nok'
  WHEN 'critical' THEN 'nok'
  ELSE electrical_condition END
WHERE electrical_condition IS NOT NULL
  AND LOWER(electrical_condition) IN ('good','poor','regular','critical');

-- 3) Normalize existing values in mechanics_checklist_items
UPDATE mechanics_checklist_items SET item_status = CASE LOWER(COALESCE(item_status, ''))
  WHEN 'good' THEN 'ok'
  WHEN 'poor' THEN 'nok'
  WHEN 'regular' THEN 'nok'
  WHEN 'critical' THEN 'nok'
  WHEN 'attention' THEN 'nok'
  ELSE item_status END
WHERE item_status IS NOT NULL
  AND LOWER(item_status) IN ('good','poor','regular','critical','attention');

-- 4) Add new constraints allowing only 'ok'/'nok'
ALTER TABLE mechanics_checklist
  ADD CONSTRAINT mechanics_checklist_motor_condition_check CHECK (motor_condition IN ('ok','nok') OR motor_condition IS NULL);
ALTER TABLE mechanics_checklist
  ADD CONSTRAINT mechanics_checklist_transmission_condition_check CHECK (transmission_condition IN ('ok','nok') OR transmission_condition IS NULL);
ALTER TABLE mechanics_checklist
  ADD CONSTRAINT mechanics_checklist_brakes_condition_check CHECK (brakes_condition IN ('ok','nok') OR brakes_condition IS NULL);
ALTER TABLE mechanics_checklist
  ADD CONSTRAINT mechanics_checklist_suspension_condition_check CHECK (suspension_condition IN ('ok','nok') OR suspension_condition IS NULL);
ALTER TABLE mechanics_checklist
  ADD CONSTRAINT mechanics_checklist_tires_condition_check CHECK (tires_condition IN ('ok','nok') OR tires_condition IS NULL);
ALTER TABLE mechanics_checklist
  ADD CONSTRAINT mechanics_checklist_electrical_condition_check CHECK (electrical_condition IN ('ok','nok') OR electrical_condition IS NULL);
ALTER TABLE mechanics_checklist_items
  ADD CONSTRAINT mechanics_checklist_items_item_status_check CHECK (item_status IN ('ok','nok'));

COMMIT;
