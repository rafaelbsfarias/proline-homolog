import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cria cliente Supabase para uso em Server Components e API Routes
 * que precisam acessar cookies
 */
export function createServerSupabaseClient() {
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
        remove(name, options) {
          cookieStore.set(name, '', { ...options, expires: new Date(0) });
        },
      },
    }
  );
}
