-- Create Supabase Storage bucket and RLS policies for vehicle media
-- Bucket: vehicle-media (private)
-- Path convention: /<vehicle_id>/<uploader_id>/<filename>
-- Roles access summary:
--  - admin: full read/write on all objects
--  - specialist: can upload under /<vehicle_id>/<auth.uid()>/ if linked to the vehicle's client;
--                can read any media for vehicles of clients linked to them
--  - client: can read media for their own vehicles
--  - partner: can upload under /<vehicle_id>/<auth.uid()>/ if linked through a service order;
--             can read only media uploaded by themselves

-- 1) Create bucket if not exists (private)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'vehicle-media'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('vehicle-media', 'vehicle-media', false);
  END IF;
END $$;

-- 2) Helper comments (not executable logic, just documentation)
-- Comments removed to avoid ownership errors on schema/table

-- 3) Policies for storage.objects on bucket vehicle-media
-- Drop previous policies if they exist to allow idempotent migration reruns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle_media_admin_all') THEN
    DROP POLICY "vehicle_media_admin_all" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle_media_client_read') THEN
    DROP POLICY "vehicle_media_client_read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle_media_specialist_read') THEN
    DROP POLICY "vehicle_media_specialist_read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle_media_partner_read_own') THEN
    DROP POLICY "vehicle_media_partner_read_own" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle_media_specialist_insert') THEN
    DROP POLICY "vehicle_media_specialist_insert" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle_media_partner_insert') THEN
    DROP POLICY "vehicle_media_partner_insert" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle_media_owner_write') THEN
    DROP POLICY "vehicle_media_owner_write" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vehicle_media_owner_delete') THEN
    DROP POLICY "vehicle_media_owner_delete" ON storage.objects;
  END IF;
END $$;

-- 3.1) Admin: full access to the bucket (ALL)
CREATE POLICY "vehicle_media_admin_all"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'vehicle-media'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'vehicle-media'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 3.2) Client: can READ media for their own vehicles
CREATE POLICY "vehicle_media_client_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-media'
  AND EXISTS (
    SELECT 1
    FROM public.vehicles v
    WHERE v.id::text = split_part(name, '/', 1)
      AND v.client_id = auth.uid()
  )
);

-- 3.3) Specialist: can READ media for vehicles of clients linked to them
CREATE POLICY "vehicle_media_specialist_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-media'
  AND EXISTS (
    SELECT 1
    FROM public.vehicles v
    JOIN public.client_specialists cs ON cs.client_id = v.client_id
    WHERE v.id::text = split_part(name, '/', 1)
      AND cs.specialist_id = auth.uid()
  )
);

-- 3.4) Partner: can READ only their own uploads
CREATE POLICY "vehicle_media_partner_read_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-media'
  AND split_part(name, '/', 2) = auth.uid()::text
);

-- 3.5) Specialist: can INSERT only under /<vehicle_id>/<auth.uid()>/** when linked to that vehicle's client
CREATE POLICY "vehicle_media_specialist_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-media'
  AND split_part(name, '/', 2) = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.vehicles v
    JOIN public.client_specialists cs ON cs.client_id = v.client_id
    WHERE v.id::text = split_part(name, '/', 1)
      AND cs.specialist_id = auth.uid()
  )
);

-- 3.6) Partner: can INSERT only under /<vehicle_id>/<auth.uid()>/** when linked by a service order
CREATE POLICY "vehicle_media_partner_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-media'
  AND split_part(name, '/', 2) = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.quotes q
    JOIN public.service_orders so ON so.id = q.service_order_id
    WHERE so.vehicle_id::text = split_part(name, '/', 1)
      AND q.partner_id = auth.uid()
  )
);

-- 3.7) Owner (uploader) can UPDATE/DELETE their own objects; Admin already covered by admin_all
CREATE POLICY "vehicle_media_owner_write"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-media'
  AND split_part(name, '/', 2) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'vehicle-media'
  AND split_part(name, '/', 2) = auth.uid()::text
);

CREATE POLICY "vehicle_media_owner_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-media'
  AND split_part(name, '/', 2) = auth.uid()::text
);
