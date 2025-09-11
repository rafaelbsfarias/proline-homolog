-- Service categories and partner mappings

CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL
);
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
-- Admin only
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_categories' AND policyname='svc_cat_admin_all') THEN
    DROP POLICY "svc_cat_admin_all" ON public.service_categories;
  END IF;
END $$;
CREATE POLICY "svc_cat_admin_all" ON public.service_categories FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
-- Seed categories
INSERT INTO public.service_categories (key, name)
VALUES
  ('mechanics','Mecânica'),
  ('body_paint','Funilaria/Pintura'),
  ('washing','Lavagem'),
  ('tires','Pneus')
ON CONFLICT (key) DO NOTHING;
-- Partners x categories (admin only)
CREATE TABLE IF NOT EXISTS public.partners_service_categories (
  partner_id uuid NOT NULL REFERENCES public.partners(profile_id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (partner_id, category_id)
);
ALTER TABLE public.partners_service_categories ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='partners_service_categories' AND policyname='partner_svc_admin_all') THEN
    DROP POLICY "partner_svc_admin_all" ON public.partners_service_categories;
  END IF;
END $$;
CREATE POLICY "partner_svc_admin_all" ON public.partners_service_categories FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
