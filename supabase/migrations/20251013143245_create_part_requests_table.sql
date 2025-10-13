-- Migration: Create part_requests table
-- Purpose: Track part purchase requests associated with vehicle anomalies
-- Created: 2025-10-13

-- Create table for part requests
CREATE TABLE IF NOT EXISTS part_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_id UUID NOT NULL REFERENCES vehicle_anomalies(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  part_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  estimated_price NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'ordered', 'received')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_part_requests_anomaly_id ON part_requests(anomaly_id);
CREATE INDEX IF NOT EXISTS idx_part_requests_vehicle_id ON part_requests(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_part_requests_partner_id ON part_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_part_requests_status ON part_requests(status);
CREATE INDEX IF NOT EXISTS idx_part_requests_created_at ON part_requests(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_part_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_part_requests_updated_at
  BEFORE UPDATE ON part_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_part_requests_updated_at();

-- Enable RLS
ALTER TABLE part_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Partners can view/create their own requests
CREATE POLICY "Partners can manage their own part requests" ON part_requests
  FOR ALL USING (
    partner_id = auth.uid()
  );

-- RLS Policy: Clients can view part requests for their vehicles
CREATE POLICY "Clients can view part requests for their vehicles" ON part_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = part_requests.vehicle_id
      AND v.client_id = auth.uid()
    )
  );

-- RLS Policy: Specialists can view part requests for their clients' vehicles
CREATE POLICY "Specialists can view part requests for their clients' vehicles" ON part_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN client_specialists cs ON cs.client_id = v.client_id
      WHERE v.id = part_requests.vehicle_id
      AND cs.specialist_id = auth.uid()
    )
  );

-- RLS Policy: Admins have full access
CREATE POLICY "Admins have full access to part requests" ON part_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE part_requests IS 'Part purchase requests associated with vehicle anomalies';
COMMENT ON COLUMN part_requests.anomaly_id IS 'Reference to the vehicle anomaly that requires the part';
COMMENT ON COLUMN part_requests.vehicle_id IS 'Reference to the vehicle';
COMMENT ON COLUMN part_requests.partner_id IS 'Partner who requested the part';
COMMENT ON COLUMN part_requests.part_name IS 'Name of the part to be purchased';
COMMENT ON COLUMN part_requests.part_description IS 'Detailed description of the part';
COMMENT ON COLUMN part_requests.quantity IS 'Quantity of parts requested';
COMMENT ON COLUMN part_requests.estimated_price IS 'Estimated price per unit';
COMMENT ON COLUMN part_requests.status IS 'Status: pending, approved, rejected, ordered, received';
COMMENT ON COLUMN part_requests.admin_notes IS 'Admin notes about approval/rejection';
