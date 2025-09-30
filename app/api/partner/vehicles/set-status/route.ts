import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createApiClient } from '@/lib/supabase/api';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:vehicles:set-status');

async function handler(req: AuthenticatedRequest) {
  try {
    const supabase = createApiClient();
    const body = await req.json();
    const quoteId: string | undefined = body?.quoteId;
    const status: string | undefined = body?.status;

    if (!quoteId || !status) {
      return NextResponse.json(
        { ok: false, error: 'quoteId e status são obrigatórios' },
        { status: 400 }
      );
    }

    // Resolve vehicle_id a partir da quote
    const { data: quote, error: qErr } = await supabase
      .from('quotes')
      .select('id, service_order_id, service_orders ( id, vehicle_id )')
      .eq('id', quoteId)
      .single();

    const so: any = Array.isArray((quote as any)?.service_orders)
      ? (quote as any).service_orders[0]
      : (quote as any)?.service_orders;
    if (qErr || !so?.vehicle_id) {
      logger.warn('quote_lookup_failed', { quoteId, error: qErr?.message });
      return NextResponse.json(
        { ok: false, error: 'Não foi possível encontrar o veículo da cotação' },
        { status: 404 }
      );
    }

    const vehicleId = so.vehicle_id as string;

    const { error: uErr } = await supabase.from('vehicles').update({ status }).eq('id', vehicleId);

    if (uErr) {
      logger.error('vehicle_update_failed', { vehicleId, status, error: uErr.message });
      return NextResponse.json(
        { ok: false, error: 'Falha ao atualizar status do veículo' },
        { status: 500 }
      );
    }

    logger.info('vehicle_status_updated', { vehicleId, status, by: req.user.id });
    return NextResponse.json({ ok: true, vehicleId, status });
  } catch (e) {
    logger.error('unexpected_error', { error: (e as any)?.message || String(e) });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withPartnerAuth(handler);
