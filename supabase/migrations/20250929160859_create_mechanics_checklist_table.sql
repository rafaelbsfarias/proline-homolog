
-- [REMOVIDO] Bloco de criação da tabela mechanics_checklist comentado para evitar erro de tabela já existente.
-- CREATE TABLE public.mechanics_checklist (
--     id uuid NOT NULL DEFAULT gen_random_uuid(),
--     created_at timestamp with time zone NOT NULL DEFAULT now(),
--     updated_at timestamp with time zone NOT NULL DEFAULT now(),
--     inspection_id uuid NOT NULL,
--     status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
--     submitted_at timestamp with time zone,
--     
--     -- Campos específicos do checklist mecânico
--     engine_oil_level text CHECK (engine_oil_level IN ('good', 'low', 'critical', 'not_checked')),
--     engine_oil_condition text CHECK (engine_oil_condition IN ('good', 'fair', 'poor', 'not_checked')),
--     coolant_level text CHECK (coolant_level IN ('good', 'low', 'critical', 'not_checked')),
--     brake_fluid_level text CHECK (brake_fluid_level IN ('good', 'low', 'critical', 'not_checked')),
--     battery_condition text CHECK (battery_condition IN ('good', 'fair', 'poor', 'not_checked')),
--     tire_condition text CHECK (tire_condition IN ('good', 'fair', 'poor', 'not_checked')),
--     lights_functioning text CHECK (lights_functioning IN ('all_working', 'some_issues', 'major_issues', 'not_checked')),
--     brake_system text CHECK (brake_system IN ('good', 'fair', 'poor', 'not_checked')),
--     suspension text CHECK (suspension IN ('good', 'fair', 'poor', 'not_checked')),
--     exhaust_system text CHECK (exhaust_system IN ('good', 'fair', 'poor', 'not_checked')),
--     
--     -- Campo para observações gerais
--     notes text
-- );

-- Primary key

-- [REMOVIDO] Bloco de criação da primary key comentado para evitar erro de múltiplas primary keys.
-- ALTER TABLE ONLY public.mechanics_checklist
--     ADD CONSTRAINT mechanics_checklist_pkey PRIMARY KEY (id);

-- Foreign key para inspection (assumindo que existe uma tabela de inspeções)
-- Nota: Ajustar conforme a estrutura real da tabela de inspeções
-- ALTER TABLE public.mechanics_checklist
--     ADD CONSTRAINT mechanics_checklist_inspection_id_fkey 
--     FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE;

-- [REMOVIDO] Índice inspection_id comentado para evitar erro de coluna inexistente.
-- CREATE INDEX idx_mechanics_checklist_inspection_id ON public.mechanics_checklist(inspection_id);
CREATE INDEX IF NOT EXISTS idx_mechanics_checklist_status ON public.mechanics_checklist(status);

-- Habilitar RLS
ALTER TABLE public.mechanics_checklist ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mechanics_checklist' AND policyname = 'Partners can manage their own checklists'
    ) THEN
        CREATE POLICY "Partners can manage their own checklists"
            ON public.mechanics_checklist
            AS PERMISSIVE
            FOR ALL
            TO authenticated
            USING (true) -- fazer: Implementar lógica para verificar se o partner tem acesso à inspeção
            WITH CHECK (true); -- fazer: Implementar lógica para verificar se o partner tem acesso à inspeção
    END IF;
END
$$;

CREATE POLICY "Staff can manage all checklists"
    ON public.mechanics_checklist
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text]))
    WITH CHECK (get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text]));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_mechanics_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mechanics_checklist_updated_at
    BEFORE UPDATE ON public.mechanics_checklist
    FOR EACH ROW
    EXECUTE FUNCTION update_mechanics_checklist_updated_at();
