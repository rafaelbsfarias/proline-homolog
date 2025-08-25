import { createServerClient, CookieOptions } from '@supabase/ssr';
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
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set(name, value, options);
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set(name, '', { ...options, expires: new Date(0) });
        },
      },
    }
  );
}
