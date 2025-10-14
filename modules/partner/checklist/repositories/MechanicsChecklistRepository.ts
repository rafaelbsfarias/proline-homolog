import { createClient } from '@/lib/supabase/server';
import type { ChecklistItemRow, EvidenceRow } from '../../checklist/schemas';

export async function getLatestChecklistByVehicle(vehicleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('mechanics_checklist')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data as Record<string, unknown> | null;
}

export async function getItemsByContext(params: {
  quote_id?: string | null;
  inspection_id?: string | null;
  vehicle_id?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('mechanics_checklist_items')
    .select('*')
    .order('created_at', { ascending: true });
  if (params.quote_id) query = query.eq('quote_id', params.quote_id);
  else if (params.inspection_id) query = query.eq('inspection_id', params.inspection_id);
  else if (params.vehicle_id) query = query.eq('vehicle_id', params.vehicle_id);
  const { data, error } = await query;
  if (error) return [] as ChecklistItemRow[];
  return (data as ChecklistItemRow[]) ?? [];
}

export async function getEvidencesByContext(params: {
  quote_id?: string | null;
  inspection_id?: string | null;
}) {
  const supabase = await createClient();
  let query = supabase.from('mechanics_checklist_evidences').select('*');
  if (params.quote_id) query = query.eq('quote_id', params.quote_id);
  else if (params.inspection_id) query = query.eq('inspection_id', params.inspection_id);
  const { data, error } = await query;
  if (error) return [] as EvidenceRow[];
  return (data as EvidenceRow[]) ?? [];
}

export async function getDirectItemsByVehicle(vehicleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('mechanics_checklist_items')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true })
    .limit(2000);
  return (data as ChecklistItemRow[]) ?? [];
}
