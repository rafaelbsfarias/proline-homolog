-- Cria uma VIEW para mostrar o estado mais recente de cada veículo a partir da tabela de histórico.
CREATE OR REPLACE VIEW public.current_vehicle_state AS
SELECT DISTINCT ON (vh.vehicle_id)
    vh.id AS history_id,
    vh.vehicle_id,
    v.plate,
    v.model,
    vh.status,
    vh.prevision_date,
    vh.end_date,
    vh.created_at AS status_changed_at
FROM
    public.vehicle_history vh
JOIN
    public.vehicles v ON vh.vehicle_id = v.id
ORDER BY
    vh.vehicle_id, vh.created_at DESC;

-- Concede permissões de leitura para os roles.
-- As políticas de segurança a nível de linha (RLS) da tabela `vehicles` e `vehicle_history` ainda serão aplicadas ao consultar esta VIEW.
GRANT SELECT ON public.current_vehicle_state TO service_role;
GRANT SELECT ON public.current_vehicle_state TO authenticated;
