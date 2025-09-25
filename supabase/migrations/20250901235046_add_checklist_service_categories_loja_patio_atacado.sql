-- Add new service categories for checklist: loja and patio_atacado
INSERT INTO public.service_categories (key, name)
VALUES
  ('loja', 'Loja'),
  ('patio_atacado', 'Pátio Atacado')
ON CONFLICT (key) DO NOTHING;