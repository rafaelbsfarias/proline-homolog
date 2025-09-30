-- Fix infinite recursion in quotes RLS policy
-- The "Clients can see their own quotes" policy is causing recursion with nested subqueries
-- Replace with a simpler, non-recursive approach

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Clients can see their own quotes" ON public.quotes;

-- Create a new, simpler policy that avoids recursion
-- This policy directly joins with service_orders and vehicles without nested subqueries
CREATE POLICY "Clients can view quotes for their vehicles" ON public.quotes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM service_orders so
            JOIN vehicles v ON v.id = so.vehicle_id
            WHERE so.id = quotes.service_order_id 
            AND v.client_id = auth.uid()
        )
    );

-- Ensure the policy is properly commented
COMMENT ON POLICY "Clients can view quotes for their vehicles" ON public.quotes 
IS 'Allows clients to view quotes for service orders on their vehicles - non-recursive version';
