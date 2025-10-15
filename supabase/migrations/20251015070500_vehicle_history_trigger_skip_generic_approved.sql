-- Migration: vehicle_history_trigger_skip_generic_approved
-- Purpose: Ensure trigger does NOT create generic vehicle_history entry when
--          vehicles.status is set to 'Orçamento Aprovado' (with or without accents),
--          since we insert a detailed entry explicitly including the category.

CREATE OR REPLACE FUNCTION public.log_vehicle_history()
RETURNS TRIGGER AS $$
DECLARE
    v_prevision_date DATE;
    v_previous_prevision_date DATE;
    v_end_date TIMESTAMP WITH TIME ZONE;
    v_status_lower TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.vehicle_history (vehicle_id, status)
        VALUES (NEW.id, NEW.status);

    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        v_status_lower := lower(NEW.status);

        -- Skip generic statuses that are inserted explicitly with richer context elsewhere
        IF v_status_lower IN ('fase orçamentária', 'fase orcamentaria', 'orçamento aprovado', 'orcamento aprovado') THEN
            RETURN NEW;
        END IF;

        SELECT prevision_date INTO v_previous_prevision_date
        FROM public.vehicle_history
        WHERE vehicle_id = NEW.id
        ORDER BY created_at DESC
        LIMIT 1;

        v_prevision_date := NULL;
        IF NEW.status IN ('AGUARDANDO ENTREGA DO VEÍCULO', 'AGUARDANDO APROVAÇÃO DA COLETA', 'AGUARDANDO CHEGADA DO VEÍCULO') THEN
            v_prevision_date := NEW.estimated_arrival_date;
        END IF;

        IF v_prevision_date IS NULL AND NEW.status NOT IN ('EM ANÁLISE', 'ANALISE FINALIZADA') THEN
            v_prevision_date := v_previous_prevision_date;
        END IF;

        v_end_date := NULL;
        IF NEW.status = 'CHEGADA CONFIRMADA' THEN
            v_end_date := NOW();
        END IF;

        INSERT INTO public.vehicle_history (vehicle_id, status, prevision_date, end_date)
        VALUES (NEW.id, NEW.status, v_prevision_date, v_end_date);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_vehicle_history()
IS 'Logs vehicle status changes to history; skips generic Budget Phase and generic Approved statuses to avoid duplicate/low-context entries.';

