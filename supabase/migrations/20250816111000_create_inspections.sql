-- Create inspections, inspection_services, inspection_media with RLS

-- 1) Table: inspections
CREATE TABLE IF NOT EXISTS public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  specialist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  inspection_date date NOT NULL,
  odometer integer NOT NULL,
  fuel_level fuel_level_enum NOT NULL,
  observations text
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Admin: full
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspections' AND policyname = 'inspections_admin_all'
  ) THEN
    DROP POLICY "inspections_admin_all" ON public.inspections;
  END IF;
END $$;

CREATE POLICY "inspections_admin_all" ON public.inspections FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Specialist: SELECT inspections for vehicles of linked clients; INSERT own
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspections' AND policyname = 'inspections_specialist_select'
  ) THEN
    DROP POLICY "inspections_specialist_select" ON public.inspections;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspections' AND policyname = 'inspections_specialist_insert'
  ) THEN
    DROP POLICY "inspections_specialist_insert" ON public.inspections;
  END IF;
END $$;

CREATE POLICY "inspections_specialist_select" ON public.inspections FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.client_specialists cs ON cs.client_id = v.client_id
    WHERE v.id = inspections.vehicle_id
      AND cs.specialist_id = auth.uid()
  )
);

CREATE POLICY "inspections_specialist_insert" ON public.inspections FOR INSERT TO authenticated
WITH CHECK (
  specialist_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.client_specialists cs ON cs.client_id = v.client_id
    WHERE v.id = inspections.vehicle_id
      AND cs.specialist_id = auth.uid()
  )
);

-- Client: SELECT inspections of their vehicles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspections' AND policyname = 'inspections_client_select'
  ) THEN
    DROP POLICY "inspections_client_select" ON public.inspections;
  END IF;
END $$;

CREATE POLICY "inspections_client_select" ON public.inspections FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = inspections.vehicle_id AND v.client_id = auth.uid()
  )
);

-- 2) Table: inspection_services
CREATE TABLE IF NOT EXISTS public.inspection_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  category text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  notes text
);

ALTER TABLE public.inspection_services ENABLE ROW LEVEL SECURITY;

-- Admin: full
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inspection_services' AND policyname='inspection_services_admin_all') THEN
    DROP POLICY "inspection_services_admin_all" ON public.inspection_services;
  END IF;
END $$;

CREATE POLICY "inspection_services_admin_all" ON public.inspection_services FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Specialist: SELECT/INSERT/UPDATE/DELETE on rows of inspections they can access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inspection_services' AND policyname='inspection_services_specialist_select') THEN
    DROP POLICY "inspection_services_specialist_select" ON public.inspection_services;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inspection_services' AND policyname='inspection_services_specialist_write') THEN
    DROP POLICY "inspection_services_specialist_write" ON public.inspection_services;
  END IF;
END $$;

CREATE POLICY "inspection_services_specialist_select" ON public.inspection_services FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections i
    JOIN public.vehicles v ON v.id = i.vehicle_id
    JOIN public.client_specialists cs ON cs.client_id = v.client_id
    WHERE i.id = inspection_services.inspection_id
      AND cs.specialist_id = auth.uid()
  )
);

CREATE POLICY "inspection_services_specialist_write" ON public.inspection_services FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections i
    WHERE i.id = inspection_services.inspection_id AND i.specialist_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inspections i
    WHERE i.id = inspection_services.inspection_id AND i.specialist_id = auth.uid()
  )
);

-- Client: SELECT services of inspections of their vehicles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inspection_services' AND policyname='inspection_services_client_select') THEN
    DROP POLICY "inspection_services_client_select" ON public.inspection_services;
  END IF;
END $$;

CREATE POLICY "inspection_services_client_select" ON public.inspection_services FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections i
    JOIN public.vehicles v ON v.id = i.vehicle_id
    WHERE i.id = inspection_services.inspection_id AND v.client_id = auth.uid()
  )
);

-- 3) Table: inspection_media
CREATE TABLE IF NOT EXISTS public.inspection_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_media ENABLE ROW LEVEL SECURITY;

-- Admin: full
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inspection_media' AND policyname='inspection_media_admin_all') THEN
    DROP POLICY "inspection_media_admin_all" ON public.inspection_media;
  END IF;
END $$;

CREATE POLICY "inspection_media_admin_all" ON public.inspection_media FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Specialist: SELECT/INSERT/UPDATE/DELETE on media of inspections they own; SELECT for linked clients
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inspection_media' AND policyname='inspection_media_specialist_select') THEN
    DROP POLICY "inspection_media_specialist_select" ON public.inspection_media;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inspection_media' AND policyname='inspection_media_specialist_write') THEN
    DROP POLICY "inspection_media_specialist_write" ON public.inspection_media;
  END IF;
END $$;

CREATE POLICY "inspection_media_specialist_select" ON public.inspection_media FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections i
    JOIN public.vehicles v ON v.id = i.vehicle_id
    JOIN public.client_specialists cs ON cs.client_id = v.client_id
    WHERE i.id = inspection_media.inspection_id
      AND cs.specialist_id = auth.uid()
  )
);

CREATE POLICY "inspection_media_specialist_write" ON public.inspection_media FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections i
    WHERE i.id = inspection_media.inspection_id AND i.specialist_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inspections i
    WHERE i.id = inspection_media.inspection_id AND i.specialist_id = auth.uid()
  )
);

-- Client: SELECT media of inspections of their vehicles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inspection_media' AND policyname='inspection_media_client_select') THEN
    DROP POLICY "inspection_media_client_select" ON public.inspection_media;
  END IF;
END $$;

CREATE POLICY "inspection_media_client_select" ON public.inspection_media FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections i
    JOIN public.vehicles v ON v.id = i.vehicle_id
    WHERE i.id = inspection_media.inspection_id AND v.client_id = auth.uid()
  )
);

