-- Migration: add_partner_id_to_vehicle_anomalies
-- Purpose: Add partner_id column to vehicle_anomalies table to track which partner created each anomaly
-- Issue: The API /api/checklist/categories was trying to fetch partner_id but the column didn't exist
-- Solution: Add partner_id column with foreign key to profiles table

-- Add partner_id column
ALTER TABLE vehicle_anomalies 
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add quote_id column (new architecture)
ALTER TABLE vehicle_anomalies 
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_anomalies_partner_id ON vehicle_anomalies(partner_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_anomalies_quote_id ON vehicle_anomalies(quote_id);

-- Update existing records to set partner_id based on the partner who has access to the vehicle
-- This is a one-time fix for existing anomalies without partner_id
DO $$
DECLARE
  v_anomaly_id UUID;
  v_vehicle_id UUID;
  v_partner_id UUID;
  v_updated_count INT := 0;
BEGIN
  FOR v_anomaly_id, v_vehicle_id IN
    SELECT id, vehicle_id 
    FROM vehicle_anomalies 
    WHERE partner_id IS NULL
  LOOP
    -- Find the partner_id from quotes for this vehicle
    SELECT q.partner_id INTO v_partner_id
    FROM quotes q
    JOIN service_orders so ON so.id = q.service_order_id
    WHERE so.vehicle_id = v_vehicle_id
    LIMIT 1;

    -- Update anomaly if partner found
    IF v_partner_id IS NOT NULL THEN
      UPDATE vehicle_anomalies
      SET partner_id = v_partner_id
      WHERE id = v_anomaly_id;
      
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Updated % existing anomalies with partner_id', v_updated_count;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN vehicle_anomalies.partner_id IS 'ID do parceiro que criou a anomalia';
COMMENT ON COLUMN vehicle_anomalies.quote_id IS 'ID do quote relacionado (nova arquitetura)';
