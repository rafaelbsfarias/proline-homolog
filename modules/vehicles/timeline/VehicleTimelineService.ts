import type { SupabaseClient } from '@supabase/supabase-js';
import type { TimelineEvent } from './types';
import { capitalizeTitle } from './utils';

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
    title: capitalizeTitle(row.status),
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
    title: capitalizeTitle(row.status || 'Orçamento Aprovado'),
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
    title: capitalizeTitle(row.status || 'Serviço Concluído'),
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
    .or(
      [
        'status.eq.Finalizado',
        'status.ilike.Execução Finalizada%',
        'status.ilike.Execucao Finalizada%',
      ].join(',')
    )
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

export async function getAllVehicleHistoryEvents(
  supabase: SupabaseClient,
  vehicleId: string,
  logger?: Logger
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('vehicle_history')
    .select('id, vehicle_id, status, partner_service, notes, created_at')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true });

  if (error) {
    logger?.error?.('timeline_all_events_fetch_error', { error: error.message });
    throw new Error('Erro ao buscar histórico completo do veículo');
  }

  // Suprimir apenas a entrada "Orçamento Aprovado Integralmente pelo Administrador" da timeline
  const normalize = (text: string) =>
    (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  const isAdminFullApproval = (status: string) =>
    normalize(status) === 'orcamento aprovado integralmente pelo administrador';

  const rows = (data || []).filter(row => !isAdminFullApproval(row.status));

  let events: TimelineEvent[] = rows.map(row => {
    // Determinar o tipo do evento baseado no status
    let type: TimelineEvent['type'] = 'BUDGET_STARTED';

    const statusLower = row.status.toLowerCase();

    if (statusLower.includes('orçamento aprovado') || statusLower.includes('orcamento aprovado')) {
      type = 'BUDGET_APPROVED';
    } else if (
      statusLower.includes('fase orçamentária iniciada') ||
      statusLower.includes('fase orcamentaria iniciada')
    ) {
      type = 'BUDGET_STARTED';
    } else if (statusLower === 'em execução') {
      type = 'EXECUTION_STARTED';
    } else if (
      statusLower.includes('serviço concluído') ||
      statusLower.includes('servico concluido')
    ) {
      type = 'SERVICE_COMPLETED';
    } else if (
      statusLower === 'finalizado' ||
      statusLower.includes('execução finalizada') ||
      statusLower.includes('execucao finalizada')
    ) {
      type = 'EXECUTION_COMPLETED';
    }

    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      type,
      title: capitalizeTitle(row.status),
      date: row.created_at,
      meta: {
        partner_service: row.partner_service,
        notes: row.notes,
      },
    };
  });

  // Pós-processamento: remover eventos 'EXECUTION_STARTED' que ocorram após o último 'EXECUTION_COMPLETED'
  const lastCompletionIdx = (() => {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === 'EXECUTION_COMPLETED') return i;
    }
    return -1;
  })();

  if (lastCompletionIdx >= 0) {
    const lastCompletionDate = new Date(events[lastCompletionIdx].date).getTime();
    events = events.filter(ev => {
      if (ev.type !== 'EXECUTION_STARTED') return true;
      return new Date(ev.date).getTime() <= lastCompletionDate;
    });
  }

  logger?.info?.('timeline_all_events', { count: events.length });
  return events;
}
