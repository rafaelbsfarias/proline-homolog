-- Create quote_items table with initial structure
-- This migration creates the quote_items table that was missing

CREATE TABLE public.quote_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    budget_id uuid, -- Will be migrated to quote_id
    service_id uuid,
    quantity integer,
    unit_price numeric,
    total_price numeric,
    notes text, -- Will be migrated to description
    parts_needed jsonb
);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Primary key
ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_pkey PRIMARY KEY (id);

-- Indexes
CREATE INDEX idx_quote_items_budget_id ON public.quote_items(budget_id);

-- Foreign key to quotes (initially nullable, will be made not null later)
ALTER TABLE public.quote_items
    ADD CONSTRAINT quote_items_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.quotes(id) ON DELETE CASCADE;

-- RLS Policies (basic policies, can be refined later)
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
USING (auth.uid() = (SELECT partner_id FROM quotes WHERE id = quote_items.budget_id))
WITH CHECK (auth.uid() = (SELECT partner_id FROM quotes WHERE id = quote_items.budget_id));