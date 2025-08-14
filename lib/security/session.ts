import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { AuthError } from '@/lib/utils/errors';
import { User } from '@supabase/supabase-js';

export async function getAuthenticatedUser(): Promise<User> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting authenticated user:', error.message);
    throw new AuthError('Authentication failed');
  }

  if (!data?.user) {
    throw new AuthError('User not authenticated');
  }

  return data.user;
}
