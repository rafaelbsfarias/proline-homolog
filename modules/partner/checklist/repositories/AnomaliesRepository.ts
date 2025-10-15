import { createClient } from '@/lib/supabase/server';
import type { AnomalyRow } from '../../checklist/schemas';

export async function getAnomaliesByVehicle(vehicleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehicle_anomalies')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });
  if (error) return [] as AnomalyRow[];
  return (data as AnomalyRow[]) ?? [];
}
