import type { SupabaseClient } from '@supabase/supabase-js';
import type { TimelineEvent } from './types';

type Logger = {
  info?: (...a: any[]) => void;
  warn?: (...a: any[]) => void;
  error?: (...a: any[]) => void;
};

export async function getBudgetStartedEvents(
  supabase: SupabaseClient,
  vehicleId: string,
  logger?: Logger
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('vehicle_history')
    .select('id, vehicle_id, status, created_at')
    .eq('vehicle_id', vehicleId)
    .ilike('status', 'Fase Orçamentária Iniciada%')
    .order('created_at', { ascending: true });

  if (error) {
    logger?.error?.('timeline_budget_fetch_error', { error: error.message });
    throw new Error('Erro ao buscar eventos de orçamentação');
  }

  const events: TimelineEvent[] = (data || []).map(row => ({
    id: row.id,
    vehicleId: row.vehicle_id,
    type: 'BUDGET_STARTED',
    title: row.status,
    date: row.created_at,
  }));

  logger?.info?.('timeline_budget_events', { count: events.length });
  return events;
}
