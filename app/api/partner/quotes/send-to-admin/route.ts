import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { z } from 'zod';

const logger = getLogger('api:partner:quotes:send-to-admin');

// Validação
const SendQuoteSchema = z.object({
  quoteId: z.string().uuid('ID do orçamento inválido'),
  vehicleStatus: z.string().optional().default('AGUARDANDO APROVAÇÃO DO ORÇAMENTO'),
});

async function handler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();

    // Validar entrada
    const validation = SendQuoteSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('validation_error', { errors: validation.error.errors });
      return NextResponse.json(
        { ok: false, error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { quoteId, vehicleStatus } = validation.data;
    const supabase = SupabaseService.getInstance().getAdminClient();

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
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error('unexpected_error', { error: error.message });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withPartnerAuth(handler);
