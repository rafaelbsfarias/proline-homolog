-- Migration: Create get_partner_financial_summary RPC function
-- Description: Creates RPC function to calculate financial summary metrics for partners
-- Date: 2025-10-16

CREATE OR REPLACE FUNCTION public.get_partner_financial_summary(
  p_partner_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_total_revenue numeric(10,2) := 0;
  v_total_quotes integer := 0;
  v_average_quote_value numeric(10,2) := 0;
  v_total_parts_requested integer := 0;
  v_total_parts_value numeric(10,2) := 0;
  v_pending_approval_value numeric(10,2) := 0;
  v_in_execution_value numeric(10,2) := 0;
  v_total_projected_value numeric(10,2) := 0;
BEGIN
  PERFORM set_config('search_path', 'public', false);

  -- Validate parameters
  IF p_partner_id IS NULL THEN
    RAISE EXCEPTION 'partner_id_cannot_be_null';
  END IF;

  -- Calculate total revenue from completed quotes
  SELECT COALESCE(SUM(q.total_value), 0)
  INTO v_total_revenue
  FROM quotes q
  WHERE q.partner_id = p_partner_id
    AND q.status IN ('approved', 'specialist_time_approved')
    AND (p_start_date IS NULL OR q.created_at >= p_start_date)
    AND (p_end_date IS NULL OR q.created_at <= p_end_date);

  -- Calculate total quotes (completed and finalized)
  SELECT COUNT(*)
  INTO v_total_quotes
  FROM quotes q
  WHERE q.partner_id = p_partner_id
    AND q.status IN ('approved', 'specialist_time_approved')
    AND (p_start_date IS NULL OR q.created_at >= p_start_date)
    AND (p_end_date IS NULL OR q.created_at <= p_end_date);

  -- Calculate average quote value
  IF v_total_quotes > 0 THEN
    v_average_quote_value := v_total_revenue / v_total_quotes;
  END IF;

  -- Calculate parts metrics from part_requests via vehicle_anomalies
  SELECT
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(pr.estimated_price), 0)
  INTO v_total_parts_requested, v_total_parts_value
  FROM part_requests pr
  JOIN vehicle_anomalies va ON pr.anomaly_id = va.id
  JOIN quotes q ON va.quote_id = q.id
  WHERE q.partner_id = p_partner_id
    AND q.status IN ('approved', 'specialist_time_approved')
    AND (p_start_date IS NULL OR q.created_at >= p_start_date)
    AND (p_end_date IS NULL OR q.created_at <= p_end_date);

  -- Calculate projected values from pending quotes
  -- Pending approval value
  SELECT COALESCE(SUM(q.total_value), 0)
  INTO v_pending_approval_value
  FROM quotes q
  WHERE q.partner_id = p_partner_id
    AND q.status IN ('pending_admin_approval', 'pending_specialist_approval')
    AND (p_start_date IS NULL OR q.created_at >= p_start_date)
    AND (p_end_date IS NULL OR q.created_at <= p_end_date);

  -- In execution value (approved but not completed)
  SELECT COALESCE(SUM(q.total_value), 0)
  INTO v_in_execution_value
  FROM quotes q
  WHERE q.partner_id = p_partner_id
    AND q.status IN ('approved', 'specialist_time_approved')
    AND (p_start_date IS NULL OR q.created_at >= p_start_date)
    AND (p_end_date IS NULL OR q.created_at <= p_end_date);

  -- Total projected value
  v_total_projected_value := v_pending_approval_value + v_in_execution_value;

  -- Build result JSON
  v_result := json_build_object(
    'period', json_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date,
      'label', CASE
        WHEN p_start_date IS NULL AND p_end_date IS NULL THEN 'All time'
        WHEN p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
          'From ' || to_char(p_start_date, 'DD/MM/YYYY') || ' to ' || to_char(p_end_date, 'DD/MM/YYYY')
        WHEN p_start_date IS NOT NULL THEN 'From ' || to_char(p_start_date, 'DD/MM/YYYY')
        ELSE 'Until ' || to_char(p_end_date, 'DD/MM/YYYY')
      END
    ),
    'metrics', json_build_object(
      'total_revenue', json_build_object(
        'amount', v_total_revenue,
        'formatted', 'R$ ' || trim(to_char(v_total_revenue, '999G999G999G999D99')),
        'currency', 'BRL'
      ),
      'total_quotes', v_total_quotes,
      'average_quote_value', json_build_object(
        'amount', v_average_quote_value,
        'formatted', 'R$ ' || trim(to_char(v_average_quote_value, '999G999G999G999D99')),
        'currency', 'BRL'
      ),
      'parts', json_build_object(
        'total_parts_requested', v_total_parts_requested,
        'total_parts_value', json_build_object(
          'amount', v_total_parts_value,
          'formatted', 'R$ ' || trim(to_char(v_total_parts_value, '999G999G999G999D99')),
          'currency', 'BRL'
        )
      ),
      'projected_value', json_build_object(
        'pending_approval', json_build_object(
          'amount', v_pending_approval_value,
          'formatted', 'R$ ' || trim(to_char(v_pending_approval_value, '999G999G999G999D99')),
          'currency', 'BRL'
        ),
        'in_execution', json_build_object(
          'amount', v_in_execution_value,
          'formatted', 'R$ ' || trim(to_char(v_in_execution_value, '999G999G999G999D99')),
          'currency', 'BRL'
        ),
        'total_projected', json_build_object(
          'amount', v_total_projected_value,
          'formatted', 'R$ ' || trim(to_char(v_total_projected_value, '999G999G999G999D99')),
          'currency', 'BRL'
        )
      )
    )
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'details', 'Failed to calculate partner financial summary'
  );
END;
$$;

COMMENT ON FUNCTION public.get_partner_financial_summary(uuid, date, date)
IS 'Calculates financial summary metrics for partners including revenue, quotes, parts, and projected values.';

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: get_partner_financial_summary RPC function created';
  RAISE NOTICE '   • Calculates 6 core financial metrics for partners';
  RAISE NOTICE '   • Supports date range filtering';
  RAISE NOTICE '   • Returns formatted currency values';
END $$;