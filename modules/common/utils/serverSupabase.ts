import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cria cliente Supabase para uso em Server Components e API Routes
 * que precisam acessar cookies
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
''
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies();
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}
