-- Relax specialist insert policy to avoid dependency on RLS-protected tables
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='vehicle_media_specialist_insert'
  ) THEN
    DROP POLICY "vehicle_media_specialist_insert" ON storage.objects;
  END IF;
END $$;
-- New specialist insert policy: only role + path ownership are enforced
CREATE POLICY "vehicle_media_specialist_insert"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-media'
  AND split_part(name, '/', 2) = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'specialist')
);
