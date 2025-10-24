import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:update-delivery-fee');

export const runtime = 'nodejs';

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { requestId, addressId, fee } = body;

    if (!requestId || !addressId || fee == null) {
      return NextResponse.json(
        { error: 'requestId, addressId e fee são obrigatórios' },
        { status: 400 }
      );
    }

    if (typeof fee !== 'number' || fee < 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // Atualizar o valor da taxa de entrega
    const { error: updateError } = await admin
      .from('delivery_requests')
      .update({ fee_amount: fee })
      .eq('id', requestId)
      .eq('address_id', addressId);

    if (updateError) {
      logger.error('update_delivery_fee_error', { error: updateError.message, requestId });
      return NextResponse.json({ error: 'Erro ao atualizar valor da entrega' }, { status: 500 });
    }

    logger.info('delivery_fee_updated', { requestId, addressId, fee });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const err = e as Error;
    logger.error('unexpected_error', { error: err?.message });
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});
