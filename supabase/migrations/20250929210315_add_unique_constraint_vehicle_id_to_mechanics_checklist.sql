
-- Adiciona constraint UNIQUE para vehicle_id na mechanics_checklist
ALTER TABLE mechanics_checklist
ADD CONSTRAINT unique_vehicle_id UNIQUE (vehicle_id);
