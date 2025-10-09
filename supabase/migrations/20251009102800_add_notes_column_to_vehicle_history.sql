-- Migration: add_notes_column_to_vehicle_history
-- Purpose: Add notes column to vehicle_history table to store additional context
-- Idempotent: checks if column exists before adding

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vehicle_history'
      AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.vehicle_history
    ADD COLUMN notes TEXT;
    
    COMMENT ON COLUMN public.vehicle_history.notes
    IS 'Additional context or notes about the status change (e.g., rejection reason, approval details)';
  END IF;
END $$;
