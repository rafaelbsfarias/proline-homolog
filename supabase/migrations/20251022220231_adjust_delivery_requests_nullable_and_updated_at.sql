-- Make address_id nullable to support pickup-at-yard requests
ALTER TABLE public.delivery_requests
  ALTER COLUMN address_id DROP NOT NULL;

-- Ensure updated_at stays in sync on update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delivery_requests_updated ON public.delivery_requests;
CREATE TRIGGER trg_delivery_requests_updated
BEFORE UPDATE ON public.delivery_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- (Optional) Add a partial index to speed up admin list by status
CREATE INDEX IF NOT EXISTS idx_delivery_requests_status_created_at
  ON public.delivery_requests(status, created_at DESC);

