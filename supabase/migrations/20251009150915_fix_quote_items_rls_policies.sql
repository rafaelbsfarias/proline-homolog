-- Fix quote_items RLS policies to use quote_id instead of budget_id
-- The previous migration renamed budget_id to quote_id, but the RLS policies were not updated

-- Drop the old policies that reference budget_id
DROP POLICY IF EXISTS "Staff can manage all quote_items" ON public.quote_items;
DROP POLICY IF EXISTS "Partners can manage quote_items for their quotes" ON public.quote_items;

-- Recreate policies with correct quote_id reference
CREATE POLICY "Staff can manage all quote_items"
ON public.quote_items
AS PERMISSIVE
FOR ALL
TO public
USING (get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text]))
WITH CHECK (get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text]));

CREATE POLICY "Partners can manage quote_items for their quotes"
ON public.quote_items
AS PERMISSIVE
FOR ALL
TO public
USING (auth.uid() = (SELECT partner_id FROM quotes WHERE id = quote_items.quote_id))
WITH CHECK (auth.uid() = (SELECT partner_id FROM quotes WHERE id = quote_items.quote_id));

-- Add policy for clients to view quote_items from their quotes
CREATE POLICY "Clients can view quote_items from their quotes"
ON public.quote_items
AS PERMISSIVE
FOR SELECT
TO public
USING (
  auth.uid() IN (
    SELECT so.client_id 
    FROM quotes q
    JOIN service_orders so ON q.service_order_id = so.id
    WHERE q.id = quote_items.quote_id
  )
);

COMMENT ON POLICY "Staff can manage all quote_items" ON public.quote_items IS 
'Allows admins and specialists to manage all quote items';

COMMENT ON POLICY "Partners can manage quote_items for their quotes" ON public.quote_items IS 
'Allows partners to manage quote items for their own quotes';

COMMENT ON POLICY "Clients can view quote_items from their quotes" ON public.quote_items IS 
'Allows clients to view quote items from their own service orders';
