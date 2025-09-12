import { type SupabaseClient } from '@supabase/supabase-js';

export async function getVehicleStatusCounts(
  supabase: SupabaseClient,
  filters: { clientId: string; plate?: string; status?: string }
) {
  const { data, error } = await supabase.rpc('get_client_vehicles_paginated', {
    p_client_id: filters.clientId,
    p_page_num: 1,
    p_page_size: 1, // We don't need the vehicles, so we fetch the minimum.
    p_plate_filter: filters.plate || '',
    p_status_filter: filters.status || '',
  });

  if (error) {
    return { data: null, error };
  }

  return { data: data.status_counts || {}, error: null };
}
