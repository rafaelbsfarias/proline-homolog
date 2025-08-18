-- Link service_orders to categories and inspections

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.service_categories(id),
  ADD COLUMN IF NOT EXISTS source_inspection_id uuid REFERENCES public.inspections(id);

CREATE INDEX IF NOT EXISTS idx_service_orders_category_id ON public.service_orders(category_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_source_inspection_id ON public.service_orders(source_inspection_id);

