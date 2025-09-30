-- Função para registrar o histórico do veículo com lógica condicional para datas
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

-- Gatilho para chamar a função
CREATE TRIGGER vehicle_history_trigger
AFTER INSERT OR UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.log_vehicle_history();
