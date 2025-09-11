// lib/supabase/server-with-token.ts

import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient(token?: string) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    }
  );

  return supabase;
}
