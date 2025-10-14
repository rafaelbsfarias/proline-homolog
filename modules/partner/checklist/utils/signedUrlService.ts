import { createClient } from '@/lib/supabase/server';

export interface SignedUrlInput {
  bucket: string;
  path: string;
  expiresIn?: number; // seconds
}

export async function createSignedUrl({ bucket, path, expiresIn = 3600 }: SignedUrlInput) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return { url: '', error } as const;
  return { url: data?.signedUrl ?? '' } as const;
}
