-- Add missing service categories
INSERT INTO public.service_categories (key, name)
VALUES
  ('loja', 'Loja'),
  ('patio_atacado', 'Pátio Atacado')
ON CONFLICT (key) DO NOTHING;
