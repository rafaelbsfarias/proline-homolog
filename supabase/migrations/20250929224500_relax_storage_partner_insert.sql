-- Relax partner insert policy similar to specialist: avoid joins that depend on RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='vehicle_media_partner_insert'
  ) THEN
    DROP POLICY "vehicle_media_partner_insert" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "vehicle_media_partner_insert"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-media'
  AND split_part(name, '/', 2) = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'partner')
);

