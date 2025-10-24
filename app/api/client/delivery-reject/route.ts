import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:delivery-reject');
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
      .select('id, client_id, vehicle_id, status, address_id')
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

    // Atualizar status para 'rejected'
    const { error: updateError } = await admin
      .from('delivery_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (updateError) {
      logger.error('delivery-request-update-error', { error: updateError.message, requestId });
      return NextResponse.json(
        { success: false, error: 'Erro ao rejeitar entrega' },
        { status: 500 }
      );
    }

    // Registrar evento
    await admin.from('delivery_request_events').insert({
      request_id: requestId,
      event_type: 'rejected',
      status_from: 'approved',
      status_to: 'rejected',
      actor_id: userId,
      actor_role: 'client',
      notes: 'Cliente rejeitou a proposta de entrega',
    });

    // Voltar status do veículo para aguardando definição
    await admin
      .from('vehicles')
      .update({ status: 'Finalizado: Aguardando Definição de Entrega' })
      .eq('id', deliveryRequest.vehicle_id);

    logger.info('delivery-rejected-by-client', {
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
