import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:delivery-approve');
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.id;
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'requestId é obrigatório' },
        { status: 400 }
      );
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // Buscar a solicitação de entrega
    const { data: deliveryRequest, error: fetchError } = await admin
      .from('delivery_requests')
      .select('id, client_id, vehicle_id, status, address_id, fee_amount, desired_date')
      .eq('id', requestId)
      .eq('client_id', userId)
      .maybeSingle();

    if (fetchError || !deliveryRequest) {
      logger.error('delivery-request-not-found', { error: fetchError?.message, requestId });
      return NextResponse.json(
        { success: false, error: 'Solicitação de entrega não encontrada' },
        { status: 404 }
      );
    }

    // Validar que está no status correto (approved - aguardando cliente)
    if (deliveryRequest.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Solicitação não está aguardando aprovação' },
        { status: 400 }
      );
    }

    // Validar que é realmente uma entrega (tem address_id)
    if (!deliveryRequest.address_id) {
      return NextResponse.json(
        { success: false, error: 'Não é uma solicitação de entrega' },
        { status: 400 }
      );
    }

    // Calcular janela de entrega
    const desiredDate = (deliveryRequest.desired_date || '').toString().slice(0, 10);
    if (!desiredDate) {
      return NextResponse.json(
        { success: false, error: 'Data de entrega não definida' },
        { status: 400 }
      );
    }

    const [y, m, d] = desiredDate.split('-').map(Number);
    const windowStart = new Date(
      Date.UTC(y as number, ((m as number) - 1) as number, d as number, 9, 0, 0)
    );
    const windowEnd = new Date(
      Date.UTC(y as number, ((m as number) - 1) as number, d as number, 18, 0, 0)
    );

    // Atualizar status para 'scheduled' e definir janela de entrega
    const { error: updateError } = await admin
      .from('delivery_requests')
      .update({
        status: 'scheduled',
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        scheduled_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      logger.error('delivery-request-update-error', { error: updateError.message, requestId });
      return NextResponse.json(
        { success: false, error: 'Erro ao aprovar entrega' },
        { status: 500 }
      );
    }

    // Registrar evento
    await admin.from('delivery_request_events').insert({
      request_id: requestId,
      event_type: 'scheduled',
      status_from: 'approved',
      status_to: 'scheduled',
      actor_id: userId,
      actor_role: 'client',
      notes: `Cliente aprovou valor de R$ ${deliveryRequest.fee_amount}`,
    });

    // Atualizar status do veículo
    await admin
      .from('vehicles')
      .update({ status: 'FINALIZADO: AGUARDANDO ENTREGA' })
      .eq('id', deliveryRequest.vehicle_id);

    logger.info('delivery-approved-by-client', {
      requestId,
      userId,
      vehicleId: deliveryRequest.vehicle_id,
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
