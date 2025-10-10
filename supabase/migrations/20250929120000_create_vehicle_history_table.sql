CREATE TABLE vehicle_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    status VARCHAR(255) NOT NULL,
    prevision_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vehicle_history_vehicle_id ON vehicle_history(vehicle_id);
CREATE INDEX idx_vehicle_history_status ON vehicle_history(status);

-- RLS Policies
ALTER TABLE vehicle_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to service_role"
ON vehicle_history
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Allow individual read access"
ON vehicle_history
FOR SELECT
USING (
 (get_my_claim('role')::text = ANY (ARRAY['admin'::text,'specialist'::text])) OR
  (
    get_my_claim('role')::text = 'client' AND
    vehicle_id IN (
      SELECT id FROM vehicles WHERE client_id = auth.uid()
    )
  )
);