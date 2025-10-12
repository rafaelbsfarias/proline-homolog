-- Migration: add_partner_service_to_vehicle_history
-- Purpose: Add partner_service column to vehicle_history table to store service category context
-- Idempotent: checks if column exists before adding

DO $$
BEGIN
  -- Add partner_service column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vehicle_history'
      AND column_name = 'partner_service'
  ) THEN
    ALTER TABLE public.vehicle_history
    ADD COLUMN partner_service VARCHAR(255);

    COMMENT ON COLUMN public.vehicle_history.partner_service
    IS 'Service category associated with this status change (e.g., Mecânica, Funilaria, Pintura, Elétrica)';
    
    RAISE NOTICE 'Column partner_service added to vehicle_history';
  ELSE
    RAISE NOTICE 'Column partner_service already exists in vehicle_history';
  END IF;
END $$;
