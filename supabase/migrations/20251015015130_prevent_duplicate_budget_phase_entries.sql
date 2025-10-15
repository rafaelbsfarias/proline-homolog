-- Migration: prevent_duplicate_budget_phase_entries
-- Purpose: Modify vehicle_history trigger to prevent duplicate 'FASE ORÇAMENTÁRIA' entries
-- Issue: Trigger creates automatic entries when status changes to 'FASE ORÇAMENTÁRIA',
--        but checklist submit already creates explicit entries with formatted status
-- Solution: Skip automatic entry creation for 'FASE ORÇAMENTÁRIA' status

-- Drop and recreate the trigger function to exclude 'FASE ORÇAMENTÁRIA' from automatic logging
CREATE OR REPLACE FUNCTION public.log_vehicle_history()
RETURNS TRIGGER AS $$
DECLARE
    v_prevision_date DATE;
    v_previous_prevision_date DATE;
    v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Na inserção (novo veículo), apenas registra o status inicial
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.vehicle_history (vehicle_id, status)
        VALUES (NEW.id, NEW.status);

    -- Na atualização (mudança de status do veículo)
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN

        -- SKIP automatic entry for 'FASE ORÇAMENTÁRIA' - it's created explicitly in checklist submit
        IF NEW.status = 'FASE ORÇAMENTÁRIA' THEN
            RETURN NEW;
        END IF;

        -- Encontra a data de previsão anterior
        SELECT prevision_date INTO v_previous_prevision_date
        FROM public.vehicle_history
        WHERE vehicle_id = NEW.id
        ORDER BY created_at DESC
        LIMIT 1;

        -- Determina se o novo status deve ter uma data de previsão
        v_prevision_date := NULL;
        IF NEW.status IN ('AGUARDANDO ENTREGA DO VEÍCULO', 'AGUARDANDO APROVAÇÃO DA COLETA', 'AGUARDANDO CHEGADA DO VEÍCULO') THEN
            v_prevision_date := NEW.estimated_arrival_date;
        END IF;

        -- Se não houver nova data de previsão, herda a anterior, mas somente até "CHEGADA CONFIRMADA"
        IF v_prevision_date IS NULL AND NEW.status NOT IN ('EM ANÁLISE', 'ANALISE FINALIZADA') THEN
            v_prevision_date := v_previous_prevision_date;
        END IF;

        -- Define o end_date se o status for 'CHEGADA CONFIRMADA'
        v_end_date := NULL;
        IF NEW.status = 'CHEGADA CONFIRMADA' THEN
            v_end_date := NOW();
        END IF;

        -- Insere o novo registro de histórico
        INSERT INTO public.vehicle_history (vehicle_id, status, prevision_date, end_date)
        VALUES (NEW.id, NEW.status, v_prevision_date, v_end_date);

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the change
COMMENT ON FUNCTION public.log_vehicle_history()
IS 'Logs vehicle status changes to history table. SKIPS automatic entry for ''FASE ORÇAMENTÁRIA'' status since it''s created explicitly in checklist submit with formatted status.';