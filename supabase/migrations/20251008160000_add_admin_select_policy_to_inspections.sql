-- Add RLS policy to allow admins to read all inspections

CREATE POLICY "Admins can read all inspections"
ON public.inspections
FOR SELECT
TO authenticated
USING (get_my_claim('role')::text = 'admin');
