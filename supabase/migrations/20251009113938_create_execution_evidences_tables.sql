-- Create execution_evidences table
CREATE TABLE IF NOT EXISTS public.execution_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    quote_item_id UUID NOT NULL REFERENCES public.quote_items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create execution_checklists table
CREATE TABLE IF NOT EXISTS public.execution_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL UNIQUE REFERENCES public.quotes(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_execution_evidences_quote_id ON public.execution_evidences(quote_id);
CREATE INDEX IF NOT EXISTS idx_execution_evidences_quote_item_id ON public.execution_evidences(quote_item_id);
CREATE INDEX IF NOT EXISTS idx_execution_checklists_quote_id ON public.execution_checklists(quote_id);
CREATE INDEX IF NOT EXISTS idx_execution_checklists_status ON public.execution_checklists(status);

-- Add comments
COMMENT ON TABLE public.execution_evidences IS 'Armazena evidências (fotos) da execução dos serviços de cada item do orçamento';
COMMENT ON TABLE public.execution_checklists IS 'Controla o status do checklist de execução de cada orçamento';

COMMENT ON COLUMN public.execution_evidences.quote_id IS 'ID do orçamento';
COMMENT ON COLUMN public.execution_evidences.quote_item_id IS 'ID do item do orçamento (serviço específico)';
COMMENT ON COLUMN public.execution_evidences.image_url IS 'URL da imagem de evidência armazenada no Supabase Storage';
COMMENT ON COLUMN public.execution_evidences.description IS 'Descrição opcional da evidência';

COMMENT ON COLUMN public.execution_checklists.quote_id IS 'ID do orçamento';
COMMENT ON COLUMN public.execution_checklists.status IS 'Status do checklist: in_progress ou completed';
COMMENT ON COLUMN public.execution_checklists.completed_at IS 'Data e hora da conclusão do checklist';

-- Enable RLS
ALTER TABLE public.execution_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for execution_evidences

-- Parceiros podem ver suas próprias evidências
CREATE POLICY "Partners can view their own execution evidences"
    ON public.execution_evidences
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = execution_evidences.quote_id
            AND q.partner_id = auth.uid()
        )
    );

-- Parceiros podem inserir evidências nos seus orçamentos
CREATE POLICY "Partners can insert execution evidences"
    ON public.execution_evidences
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = execution_evidences.quote_id
            AND q.partner_id = auth.uid()
        )
    );

-- Parceiros podem atualizar suas próprias evidências
CREATE POLICY "Partners can update their own execution evidences"
    ON public.execution_evidences
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = execution_evidences.quote_id
            AND q.partner_id = auth.uid()
        )
    );

-- Parceiros podem deletar suas próprias evidências
CREATE POLICY "Partners can delete their own execution evidences"
    ON public.execution_evidences
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = execution_evidences.quote_id
            AND q.partner_id = auth.uid()
        )
    );

-- Admins podem ver todas as evidências
CREATE POLICY "Admins can view all execution evidences"
    ON public.execution_evidences
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policies for execution_checklists

-- Parceiros podem ver seus próprios checklists
CREATE POLICY "Partners can view their own execution checklists"
    ON public.execution_checklists
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = execution_checklists.quote_id
            AND q.partner_id = auth.uid()
        )
    );

-- Parceiros podem inserir/atualizar seus próprios checklists
CREATE POLICY "Partners can upsert their own execution checklists"
    ON public.execution_checklists
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = execution_checklists.quote_id
            AND q.partner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = execution_checklists.quote_id
            AND q.partner_id = auth.uid()
        )
    );

-- Admins podem ver todos os checklists
CREATE POLICY "Admins can view all execution checklists"
    ON public.execution_checklists
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create storage bucket for execution evidences
INSERT INTO storage.buckets (id, name, public)
VALUES ('execution-evidences', 'execution-evidences', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Partners can upload execution evidence images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'execution-evidences'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Anyone can view execution evidence images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'execution-evidences');

CREATE POLICY "Partners can delete their own execution evidence images"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'execution-evidences'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
