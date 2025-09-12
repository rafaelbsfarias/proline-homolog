import { type SupabaseClient } from '@supabase/supabase-js';

export async function listAddresses(supabase: SupabaseClient, profileId: string) {
  const { data, error } = await supabase
    .from('addresses')
    .select(
      'id, profile_id, street, number, neighborhood, city, state, zip_code, complement, is_collect_point, is_main_address, created_at'
    )
    .eq('profile_id', profileId)
    .order('is_main_address', { ascending: false })
    .order('created_at', { ascending: false });

  return { data, error };
}
