CREATE TABLE IF NOT EXISTS public.inspection_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
    service_category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
    sets JSONB,
    is_parallel BOOLEAN NOT NULL DEFAULT false,
    priority INTEGER NOT NULL DEFAULT 0,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (inspection_id, service_category_id)
);


CREATE INDEX IF NOT EXISTS idx_inspection_delegations_inspection_id ON public.inspection_delegations(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_delegations_service_category_id ON public.inspection_delegations(service_category_id);
CREATE INDEX IF NOT EXISTS idx_inspection_delegations_reviewed_by ON public.inspection_delegations(reviewed_by);


ALTER TABLE public.inspection_delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_access"
ON public.inspection_delegations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "admin_update_own_only"
ON public.inspection_delegations
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
    AND (
        reviewed_by IS NULL
        OR reviewed_by = auth.uid()
    )
)
WITH CHECK (
    reviewed_by IS NULL
    OR reviewed_by = auth.uid()
);
