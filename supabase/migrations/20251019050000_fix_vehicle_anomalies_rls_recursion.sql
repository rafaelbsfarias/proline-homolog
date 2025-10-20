-- =====================================================
-- Migration: Fix vehicle_anomalies RLS Recursion
-- =====================================================
-- Data: 2025-10-19
-- Problema: A política "Users can manage anomalies for accessible vehicles" está causando 
--           recursão infinita ao fazer JOIN com a tabela quotes.
--
-- Erro: infinite recursion detected in policy for relation "quotes"
--
-- Solução: Simplificar a política evitando JOIN com quotes, usando apenas
--          relações diretas.
-- =====================================================

BEGIN;

-- Remover política existente que causa recursão
DROP POLICY IF EXISTS "Users can manage anomalies for accessible vehicles" ON public.vehicle_anomalies;
DROP POLICY IF EXISTS "Users can manage anomalies for accessible inspections" ON public.vehicle_anomalies;

-- =====================================================
-- Políticas Simplificadas (Sem Recursão)
-- =====================================================

-- 1. Clientes podem ver anomalias dos próprios veículos
CREATE POLICY "Clients can view anomalies for their vehicles" ON public.vehicle_anomalies
    FOR SELECT
    TO authenticated
    USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE client_id = auth.uid()
        )
    );

-- 2. Admins têm acesso total
CREATE POLICY "Admins can manage all anomalies" ON public.vehicle_anomalies
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins WHERE profile_id = auth.uid()
        )
    );

-- 3. Especialistas podem ver anomalias de veículos de seus clientes
CREATE POLICY "Specialists can view anomalies for their clients" ON public.vehicle_anomalies
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM specialists s
            JOIN client_specialists cs ON cs.specialist_id = s.profile_id
            JOIN vehicles v ON v.client_id = cs.client_id
            WHERE s.profile_id = auth.uid()
            AND v.id = vehicle_anomalies.vehicle_id
        )
    );

-- 4. Parceiros podem ver anomalias de veículos onde estão envolvidos
-- IMPORTANTE: Usar partner_id diretamente (coluna adicionada em migration posterior)
-- Se a coluna ainda não existe, esta policy será ignorada até que seja adicionada
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicle_anomalies' 
        AND column_name = 'partner_id'
    ) THEN
        EXECUTE '
            CREATE POLICY "Partners can view own anomalies" ON public.vehicle_anomalies
                FOR SELECT
                TO authenticated
                USING (
                    partner_id = auth.uid()
                )
        ';
    ELSE
        -- Fallback: Parceiros podem ver anomalias via vehicle_id
        -- (menos seguro, mas evita recursão)
        EXECUTE '
            CREATE POLICY "Partners can view vehicle anomalies" ON public.vehicle_anomalies
                FOR SELECT
                TO authenticated
                USING (
                    EXISTS (
                        SELECT 1 FROM partners WHERE profile_id = auth.uid()
                    )
                )
        ';
    END IF;
END $$;

-- 5. Parceiros podem criar anomalias
CREATE POLICY "Partners can insert anomalies" ON public.vehicle_anomalies
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM partners WHERE profile_id = auth.uid()
        )
    );

-- 6. Parceiros podem atualizar suas próprias anomalias
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicle_anomalies' 
        AND column_name = 'partner_id'
    ) THEN
        EXECUTE '
            CREATE POLICY "Partners can update own anomalies" ON public.vehicle_anomalies
                FOR UPDATE
                TO authenticated
                USING (partner_id = auth.uid())
                WITH CHECK (partner_id = auth.uid())
        ';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- Comentários das políticas
-- =====================================================

COMMENT ON POLICY "Clients can view anomalies for their vehicles" ON public.vehicle_anomalies 
IS 'Permite que clientes vejam anomalias dos próprios veículos';

COMMENT ON POLICY "Admins can manage all anomalies" ON public.vehicle_anomalies 
IS 'Administradores podem gerenciar todas as anomalies';

COMMENT ON POLICY "Specialists can view anomalies for their clients" ON public.vehicle_anomalies 
IS 'Especialistas podem ver anomalias dos veículos de seus clientes';

COMMENT ON POLICY "Partners can insert anomalies" ON public.vehicle_anomalies 
IS 'Parceiros podem criar novas anomalias';
