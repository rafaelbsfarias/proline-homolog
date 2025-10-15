-- Migration: vehicle_history_trigger_skip_budget_phase_variants
-- Purpose: Ensure trigger does NOT create vehicle_history entry when vehicles.status
--          is set to a generic Budget Phase, regardless of case/accents variants
-- Context: Admin approval routes set status to 'Fase Orçamentaria' (no accent),
--          while an earlier migration only skipped exact 'FASE ORÇAMENTÁRIA'.
--          This led to unwanted generic entries in vehicle_history via trigger.

-- Idempotent change: redefine function with broader skip condition
CREATE OR REPLACE FUNCTION public.log_vehicle_history()
RETURNS TRIGGER AS $$
DECLARE
    v_prevision_date DATE;
    v_previous_prevision_date DATE;
    v_end_date TIMESTAMP WITH TIME ZONE;
    v_status_lower TEXT;
BEGIN
    -- Na inserção (novo veículo), apenas registra o status inicial
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.vehicle_history (vehicle_id, status)
        VALUES (NEW.id, NEW.status);

    -- Na atualização (mudança de status do veículo)
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN

        -- Normalizar status para comparação case-insensitive
        v_status_lower := lower(NEW.status);

        -- SKIP automatic entry for generic Budget Phase statuses to avoid duplicates.
        -- We skip when status equals the generic phase text (with or without accent),
        -- but DO NOT skip specific timeline texts like 'Fase Orçamentária Iniciada - ...'.
        IF v_status_lower IN ('fase orçamentária', 'fase orcamentaria') THEN
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

COMMENT ON FUNCTION public.log_vehicle_history()
IS 'Logs vehicle status changes to history; skips generic Budget Phase ("Fase Orçamentária" / "Fase Orçamentaria") to avoid duplicate timeline entries.';

