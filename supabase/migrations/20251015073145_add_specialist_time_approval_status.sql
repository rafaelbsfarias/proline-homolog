-- Add specialist time approval functionality
-- Add new quote statuses for specialist time approval workflow

-- Add new quote statuses to the enum (if using enum, otherwise skip this)
-- For now, we'll assume quote_status is a text column

-- Create quote_time_reviews table for tracking specialist reviews
CREATE TABLE IF NOT EXISTS public.quote_time_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    quote_id uuid NOT NULL,
    specialist_id uuid NOT NULL,
    action text NOT NULL CHECK (action IN ('approved', 'revision_requested')),
    comments text,
    reviewed_item_ids uuid[],
    revision_requests jsonb,
    created_by uuid NOT NULL
);

-- Add primary key
ALTER TABLE ONLY public.quote_time_reviews
    ADD CONSTRAINT quote_time_reviews_pkey PRIMARY KEY (id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_quote_time_reviews_quote_id ON public.quote_time_reviews(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_time_reviews_specialist_id ON public.quote_time_reviews(specialist_id);
CREATE INDEX IF NOT EXISTS idx_quote_time_reviews_created_at ON public.quote_time_reviews(created_at);

-- Add foreign key constraints
ALTER TABLE public.quote_time_reviews
    ADD CONSTRAINT quote_time_reviews_quote_id_fkey
    FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;

ALTER TABLE public.quote_time_reviews
    ADD CONSTRAINT quote_time_reviews_specialist_id_fkey
    FOREIGN KEY (specialist_id) REFERENCES public.specialists(profile_id) ON DELETE CASCADE;

ALTER TABLE public.quote_time_reviews
    ADD CONSTRAINT quote_time_reviews_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.quote_time_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Specialists can view time reviews for their clients' quotes"
ON public.quote_time_reviews
AS PERMISSIVE
FOR SELECT
TO public
USING (
    specialist_id = auth.uid() OR
    get_my_claim('role'::text) = 'admin'::text
);

CREATE POLICY "Specialists can create time reviews"
ON public.quote_time_reviews
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
    specialist_id = auth.uid() AND
    get_my_claim('role'::text) = 'specialist'::text
);

CREATE POLICY "Admins can manage all time reviews"
ON public.quote_time_reviews
AS PERMISSIVE
FOR ALL
TO public
USING (get_my_claim('role'::text) = 'admin'::text)
WITH CHECK (get_my_claim('role'::text) = 'admin'::text);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_quote_time_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_quote_time_reviews_updated_at
    BEFORE UPDATE ON public.quote_time_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_time_reviews_updated_at();

-- Add comments
COMMENT ON TABLE public.quote_time_reviews IS 'Tracks specialist reviews of quote time estimates';
COMMENT ON COLUMN public.quote_time_reviews.action IS 'Action taken: approved or revision_requested';
COMMENT ON COLUMN public.quote_time_reviews.reviewed_item_ids IS 'Array of quote_item IDs that were reviewed';
COMMENT ON COLUMN public.quote_time_reviews.revision_requests IS 'JSON object with revision details per item';