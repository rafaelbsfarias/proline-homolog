-- Apaga a versão antiga
DROP FUNCTION IF EXISTS get_pending_checklist_reviews();

-- Cria a nova versão ajustada
CREATE OR REPLACE FUNCTION get_pending_checklist_reviews()
RETURNS TABLE (
    inspection_id UUID,
    plate TEXT,
    services JSONB
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id AS inspection_id,
        v.plate::TEXT AS plate,
        (
            SELECT json_agg(s.category)::jsonb
            FROM public.inspection_services s
            WHERE s.inspection_id = i.id
        ) AS services
    FROM
        public.inspections i
    JOIN
        public.vehicles v ON v.id = i.vehicle_id
    WHERE
        i.finalized = true
        AND NOT EXISTS (
            SELECT 1
            FROM public.inspection_delegations idel
            WHERE idel.inspection_id = i.id
        )
    GROUP BY
        i.id, v.plate
    ORDER BY
        i.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Permissões
GRANT EXECUTE ON FUNCTION public.get_pending_checklist_reviews() TO authenticated;
