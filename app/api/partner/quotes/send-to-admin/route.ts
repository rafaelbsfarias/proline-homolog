import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createApiClient } from '@/lib/supabase/api';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:quotes:send-to-admin');

async function handler(req: AuthenticatedRequest) {
  try {
    const supabase = createApiClient();
    const body = await req.json();
    const quoteId: string | undefined = body?.quoteId;
    const vehicleStatus: string = body?.vehicleStatus || 'AGUARDANDO APROVAÇÃO DO ORÇAMENTO';

    if (!quoteId) {
      return NextResponse.json({ ok: false, error: 'quoteId é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('partner_send_quote_to_admin', {
      p_partner_id: req.user.id,
      p_quote_id: quoteId,
      p_vehicle_status: vehicleStatus,
    });

    if (error || !data?.ok) {
      logger.error('rpc_error', { error: error?.message || data?.error });
      return NextResponse.json(
        { ok: false, error: error?.message || data?.error || 'Falha na operação' },
        { status: 500 }
      );
    }

    logger.info('quote_sent_to_admin', { quoteId, by: req.user.id, vehicleId: data.vehicle_id });
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    logger.error('unexpected_error', { error: (e as any)?.message || String(e) });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withPartnerAuth(handler);
