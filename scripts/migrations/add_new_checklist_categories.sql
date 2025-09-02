-- Insert new service categories for checklist
INSERT INTO public.service_categories (key, name)
VALUES
  ('loja', 'Loja'),
  ('patio_atacado', 'Pátio Atacado')
ON CONFLICT (key) DO NOTHING;
