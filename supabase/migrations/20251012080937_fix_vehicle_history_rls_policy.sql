-- Migration: fix_vehicle_history_rls_policy
-- Purpose: Fix RLS policy to allow authenticated users to read vehicle_history
-- The API will handle authorization logic
-- Idempotent: drops and recreates policy

DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Allow individual read access" ON vehicle_history;
  
  -- Create new policy that allows all authenticated users to read
  -- Authorization will be handled at the API level
  CREATE POLICY "Allow authenticated read access"
  ON vehicle_history
  FOR SELECT
  TO authenticated
  USING (true);
  
  RAISE NOTICE 'RLS policy updated: authenticated users can read vehicle_history';
END $$;
