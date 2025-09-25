import { type SupabaseClient } from '@supabase/supabase-js';

export async function getVehicleStatusCounts(
  supabase: SupabaseClient,
  filters: { clientId: string; plate?: string; status?: string | string[] } // Make status flexible
) {
  let statusFilter: string[] | null = null;
  if (filters.status) {
    statusFilter = Array.isArray(filters.status) ? filters.status : [filters.status];
  }

  const { data, error } = await supabase.rpc('get_client_vehicles_paginated', {
    p_client_id: filters.clientId,
    p_page_num: 1,
    p_page_size: 1, // We don't need the vehicles, so we fetch the minimum.
    p_plate_filter: filters.plate || null,
    p_status_filter: statusFilter,
  });

  if (error) {
    return { data: null, error };
  }

  return { data: data.status_counts || {}, error: null };
}
