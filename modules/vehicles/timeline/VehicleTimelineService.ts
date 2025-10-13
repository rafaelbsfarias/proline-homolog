import type { SupabaseClient } from '@supabase/supabase-js';
import type { TimelineEvent } from './types';

type Logger = {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
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
    // Tolerante a variações com/sem acento
    .or(
      [
        // PostgREST usa * como wildcard nesta sintaxe
        'status.ilike.*Fase Orçamentária Iniciada*',
        'status.ilike.*Fase Orcamentaria Iniciada*',
      ].join(',')
    )
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

export async function getBudgetApprovedEvents(
  supabase: SupabaseClient,
  vehicleId: string,
  logger?: Logger
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('vehicle_history')
    .select('id, vehicle_id, status, created_at')
    .eq('vehicle_id', vehicleId)
    .ilike('status', 'Orçamento Aprovado%')
    .order('created_at', { ascending: true });

  if (error) {
    logger?.error?.('timeline_budget_approved_fetch_error', { error: error.message });
    throw new Error('Erro ao buscar eventos de aprovação de orçamento');
  }

  const events: TimelineEvent[] = (data || []).map(row => ({
    id: row.id,
    vehicleId: row.vehicle_id,
    type: 'BUDGET_APPROVED',
    // O título no histórico pode conter detalhes; mantemos conforme salvo
    title: row.status || 'Orçamento Aprovado',
    date: row.created_at,
  }));

  logger?.info?.('timeline_budget_approved_events', { count: events.length });
  return events;
}

export async function getServiceCompletedEvents(
  supabase: SupabaseClient,
  vehicleId: string,
  logger?: Logger
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('vehicle_history')
    .select('id, vehicle_id, status, partner_service, notes, created_at')
    .eq('vehicle_id', vehicleId)
    .ilike('status', 'Serviço Concluído%')
    .order('created_at', { ascending: true });

  if (error) {
    logger?.error?.('timeline_service_completed_fetch_error', { error: error.message });
    throw new Error('Erro ao buscar eventos de serviços concluídos');
  }

  const events: TimelineEvent[] = (data || []).map(row => ({
    id: row.id,
    vehicleId: row.vehicle_id,
    type: 'SERVICE_COMPLETED',
    title: row.status || 'Serviço Concluído',
    date: row.created_at,
    meta: {
      partner_service: row.partner_service,
      notes: row.notes,
    },
  }));

  logger?.info?.('timeline_service_completed_events', { count: events.length });
  return events;
}

export async function getExecutionStartedEvents(
  supabase: SupabaseClient,
  vehicleId: string,
  logger?: Logger
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('vehicle_history')
    .select('id, vehicle_id, status, partner_service, notes, created_at')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'Em Execução')
    .order('created_at', { ascending: true });

  if (error) {
    logger?.error?.('timeline_execution_started_fetch_error', { error: error.message });
    throw new Error('Erro ao buscar eventos de execução iniciada');
  }

  const events: TimelineEvent[] = (data || []).map(row => ({
    id: row.id,
    vehicleId: row.vehicle_id,
    type: 'EXECUTION_STARTED',
    title: 'Execução Iniciada',
    date: row.created_at,
    meta: {
      partner_service: row.partner_service,
      notes: row.notes,
    },
  }));

  logger?.info?.('timeline_execution_started_events', { count: events.length });
  return events;
}

export async function getExecutionCompletedEvents(
  supabase: SupabaseClient,
  vehicleId: string,
  logger?: Logger
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('vehicle_history')
    .select('id, vehicle_id, status, partner_service, notes, created_at')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'Finalizado')
    .order('created_at', { ascending: true });

  if (error) {
    logger?.error?.('timeline_execution_completed_fetch_error', { error: error.message });
    throw new Error('Erro ao buscar eventos de finalização');
  }

  const events: TimelineEvent[] = (data || []).map(row => ({
    id: row.id,
    vehicleId: row.vehicle_id,
    type: 'EXECUTION_COMPLETED',
    title: 'Execução Finalizada',
    date: row.created_at,
    meta: {
      partner_service: row.partner_service,
      notes: row.notes,
    },
  }));

  logger?.info?.('timeline_execution_completed_events', { count: events.length });
  return events;
}
