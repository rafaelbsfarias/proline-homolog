import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { getLogger } from '@/modules/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = getLogger('api:admin:delegate-service');
export const dynamic = 'force-dynamic';

interface DelegationPayload {
  inspection_id: string;
  service_category_id: string;
  partner_id: string;
  is_parallel?: boolean;
  priority?: number;
}

async function createServiceOrderAndQuote({
  supabase,
  delegation,
  quoteStatus,
}: {
  supabase: SupabaseClient;
  delegation: DelegationPayload;
  quoteStatus: 'pending_partner' | 'queued';
}) {
  const { inspection_id, service_category_id, partner_id } = delegation;

  // 1. Busca vehicle_id e specialist_id da inspeção
  const { data: inspectionData, error: inspectionError } = await supabase
    .from('inspections')
    .select('vehicle_id, specialist_id')
    .eq('id', inspection_id)
    .single();

  if (inspectionError || !inspectionData) {
    throw new Error('Inspeção não encontrada.');
  }

  // 2. Busca client_id na tabela vehicles
  const { data: vehicleData, error: vehicleError } = await supabase
    .from('vehicles')
    .select('client_id')
    .eq('id', inspectionData.vehicle_id)
    .single();

  if (vehicleError || !vehicleData || !vehicleData.client_id) {
    throw new Error('Veículo não encontrado ou client_id ausente.');
  }

  const clientId = vehicleData.client_id;

  // 3. Cria Service Order
  const orderCode = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const { data: serviceOrder, error: soError } = await supabase
    .from('service_orders')
    .insert({
      vehicle_id: inspectionData.vehicle_id,
      client_id: clientId,
      specialist_id: inspectionData.specialist_id,
      status: 'pending_quote',
      order_code: orderCode,
      source_inspection_id: inspection_id,
      category_id: service_category_id,
    })
    .select('id')
    .single();

  if (soError || !serviceOrder) {
    throw new Error('Não foi possível criar a Service Order.');
  }

  // 4. Cria Quote para o parceiro
  const { error: quoteError } = await supabase.from('quotes').insert({
    service_order_id: serviceOrder.id,
    partner_id,
    status: quoteStatus,
    total_value: 0,
  });

  if (quoteError) {
    throw new Error('Não foi possível criar o Quote.');
  }

  return {
    success: true,
    inspection_id,
    service_order_id: serviceOrder.id,
    partner_id,
    quoteStatus,
  };
}

const handler = async (request: AuthenticatedRequest) => {
  const supabase = createApiClient();
  const adminUserId = request.user.id;

  try {
    const payload: DelegationPayload[] = await request.json();
    const delegations = Array.isArray(payload) ? payload : [payload];

    const results: any[] = [];

    // Processa delegações paralelas e sequenciais
    const parallelDelegations = delegations.filter(d => d.is_parallel);
    const sequentialDelegations = delegations.filter(d => !d.is_parallel);

    // 1. Paralelas
    for (const delegation of parallelDelegations) {
      try {
        const result = await createServiceOrderAndQuote({
          supabase,
          delegation,
          // Após delegação pelo admin, a responsabilidade passa ao parceiro:
          // status inicial deve ser 'pending_partner'.
          quoteStatus: 'pending_partner',
        });
        results.push(result);
      } catch (e: any) {
        results.push({
          success: false,
          inspection_id: delegation.inspection_id,
          message: e.message,
        });
      }
    }

    // 2. Sequenciais
    if (sequentialDelegations.length > 0) {
      const lowestPriority = Math.min(...sequentialDelegations.map(d => d.priority ?? 0));
      for (const delegation of sequentialDelegations) {
        const quoteStatus =
          (delegation.priority ?? 0) === lowestPriority ? 'pending_partner' : 'queued';
        try {
          const result = await createServiceOrderAndQuote({ supabase, delegation, quoteStatus });
          results.push(result);
        } catch (e: any) {
          results.push({
            success: false,
            inspection_id: delegation.inspection_id,
            message: e.message,
          });
        }
      }
    }

    // 3. Registra delegações
    const dataToInsert = delegations.map(d => ({
      inspection_id: d.inspection_id,
      service_category_id: d.service_category_id,
      partner_id: d.partner_id,
      is_parallel: d.is_parallel ?? false,
      priority: d.priority ?? 0,
      reviewed_by: adminUserId,
    }));

    const { error: delegationInsertError } = await supabase
      .from('inspection_delegations')
      .insert(dataToInsert);

    if (delegationInsertError) {
      logger.error('Falha ao registrar delegações', { error: delegationInsertError });
      results.push({
        success: false,
        message: 'Falha ao registrar delegações.',
        details: delegationInsertError.message,
      });
    }

    return NextResponse.json({ results });
  } catch (e: any) {
    logger.error('[DEBUG] Erro inesperado na delegate-service API:', e);
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: e.message || 'Erro desconhecido.' },
      { status: 500 }
    );
  }
};

export const POST = withAdminAuth(handler);
