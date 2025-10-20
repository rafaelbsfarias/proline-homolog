-- =====================================================
-- Migration: Fix mechanics_checklist_evidences RLS Recursion
-- =====================================================
-- Data: 2025-10-19
-- Problema: A política "Admins and clients can view evidences" está causando 
--           recursão infinita ao fazer JOIN com a tabela quotes, que por sua vez
--           tem políticas RLS que fazem JOIN com outras tabelas.
--
-- Erro: infinite recursion detected in policy for relation "quotes"
--
-- Solução: Simplificar a política para evitar recursão, usando apenas as
--          relações diretas sem subqueries complexas.
-- =====================================================

BEGIN;

-- Remover todas as políticas existentes de SELECT
DROP POLICY IF EXISTS "Admins and clients can view evidences" ON public.mechanics_checklist_evidences;
DROP POLICY IF EXISTS "Partners can view own evidences" ON public.mechanics_checklist_evidences;
DROP POLICY IF EXISTS "Admins can view all evidences" ON public.mechanics_checklist_evidences;
DROP POLICY IF EXISTS "Clients can view evidences for their vehicles" ON public.mechanics_checklist_evidences;
DROP POLICY IF EXISTS "Specialists can view evidences for their clients" ON public.mechanics_checklist_evidences;

-- Criar nova política simplificada que evita recursão
-- Esta política permite acesso direto via vehicle_id sem passar por quotes
CREATE POLICY "Clients can view evidences for their vehicles" ON public.mechanics_checklist_evidences
    FOR SELECT
    TO authenticated
    USING (
        -- Cliente pode ver evidências dos próprios veículos
        vehicle_id IN (
            SELECT id FROM vehicles WHERE client_id = auth.uid()
        )
    );

-- Política separada para admins (mais simples)
CREATE POLICY "Admins can view all evidences" ON public.mechanics_checklist_evidences
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE profile_id = auth.uid()
        )
    );

-- Política para especialistas verem evidências dos clientes que gerenciam
CREATE POLICY "Specialists can view evidences for their clients" ON public.mechanics_checklist_evidences
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM specialists s
            JOIN client_specialists cs ON cs.specialist_id = s.profile_id
            JOIN vehicles v ON v.client_id = cs.client_id
            WHERE s.profile_id = auth.uid()
            AND v.id = mechanics_checklist_evidences.vehicle_id
        )
    );

-- Política para parceiros verem suas próprias evidências
CREATE POLICY "Partners can view own evidences" ON public.mechanics_checklist_evidences
    FOR SELECT
    TO authenticated
    USING (
        partner_id IN (
            SELECT profile_id FROM partners WHERE profile_id = auth.uid()
        )
    );

COMMIT;

-- =====================================================
-- Comentários das políticas
-- =====================================================

COMMENT ON POLICY "Clients can view evidences for their vehicles" ON public.mechanics_checklist_evidences 
IS 'Permite que clientes vejam evidências dos próprios veículos sem recursão';

COMMENT ON POLICY "Admins can view all evidences" ON public.mechanics_checklist_evidences 
IS 'Administradores podem ver todas as evidências';

COMMENT ON POLICY "Specialists can view evidences for their clients" ON public.mechanics_checklist_evidences 
IS 'Especialistas podem ver evidências dos veículos de seus clientes';

COMMENT ON POLICY "Partners can view own evidences" ON public.mechanics_checklist_evidences 
IS 'Parceiros podem ver suas próprias evidências';
