-- Fix RLS policies for storage.objects (vehicle-media) to avoid recursion via quotes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='vehicle_media_partner_insert') THEN
    DROP POLICY "vehicle_media_partner_insert" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='vehicle_media_specialist_insert') THEN
    DROP POLICY "vehicle_media_specialist_insert" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='vehicle_media_specialist_read') THEN
    DROP POLICY "vehicle_media_specialist_read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='vehicle_media_client_read') THEN
    DROP POLICY "vehicle_media_client_read" ON storage.objects;
  END IF;
END $$;

-- Client: read own vehicles’ media (with role guard)
CREATE POLICY "vehicle_media_client_read"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'vehicle-media'
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'client')
  AND EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id::text = split_part(name, '/', 1)
      AND v.client_id = auth.uid()
  )
);

-- Specialist: read media for vehicles of linked clients (with role guard)
CREATE POLICY "vehicle_media_specialist_read"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'vehicle-media'
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'specialist')
  AND EXISTS (
    SELECT 1
    FROM public.vehicles v
    JOIN public.client_specialists cs ON cs.client_id = v.client_id
    WHERE v.id::text = split_part(name, '/', 1)
      AND cs.specialist_id = auth.uid()
  )
);

-- Specialist: insert under /<vehicle_id>/<auth.uid()>/** when linked to the client
CREATE POLICY "vehicle_media_specialist_insert"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-media'
  AND split_part(name, '/', 2) = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'specialist')
  AND EXISTS (
    SELECT 1
    FROM public.vehicles v
    JOIN public.client_specialists cs ON cs.client_id = v.client_id
    WHERE v.id::text = split_part(name, '/', 1)
      AND cs.specialist_id = auth.uid()
  )
);

-- Partner: insert under /<vehicle_id>/<auth.uid()>/** (no quotes reference to avoid recursion)
CREATE POLICY "vehicle_media_partner_insert"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-media'
  AND split_part(name, '/', 2) = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'partner')
  AND EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id::text = split_part(name, '/', 1)
  )
);

-- Note: keeps existing admin ALL and owner update/delete policies

