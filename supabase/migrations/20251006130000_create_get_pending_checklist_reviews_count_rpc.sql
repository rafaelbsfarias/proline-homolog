-- RPC function to get the count of checklists pending admin review
DROP FUNCTION IF EXISTS get_pending_checklist_reviews_count();
CREATE OR REPLACE FUNCTION get_pending_checklist_reviews_count()
RETURNS INTEGER
AS $$
DECLARE
    review_count INTEGER;
BEGIN
    SELECT
        count(*)
    INTO
        review_count
    FROM
        public.inspections i
    WHERE
        i.finalized = true
        AND NOT EXISTS (
            SELECT 1
            FROM public.inspection_delegations idel
            WHERE idel.inspection_id = i.id
        );

    RETURN review_count;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_pending_checklist_reviews_count() TO authenticated;
