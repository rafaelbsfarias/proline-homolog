-- Add fields to confirm payment reception for vehicle collections
ALTER TABLE public.vehicle_collections
ADD COLUMN IF NOT EXISTS payment_received boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_received_at timestamptz NULL;

