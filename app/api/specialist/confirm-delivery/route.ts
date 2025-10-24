import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { DeliveryService } from '@/modules/delivery/domain/DeliveryService';
import { SupabaseDeliveryRequestRepository } from '@/modules/delivery/infra/SupabaseDeliveryRequestRepository';
import { SupabaseVehicleRepository } from '@/modules/delivery/infra/SupabaseVehicleRepository';
import { SupabaseTimelineWriter } from '@/modules/delivery/infra/SupabaseTimelineWriter';
import { DevNotificationPort } from '@/modules/delivery/infra/DevNotificationPort';

const logger = getLogger('api:specialist:confirm-delivery');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { vehicleId } = body || {};

    if (!vehicleId) {
      return NextResponse.json({ error: 'vehicleId é obrigatório' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // Buscar a solicitação de entrega/retirada agendada para este veículo
    const { data: deliveryRequest, error: fetchError } = await admin
      .from('delivery_requests')
      .select('id, vehicle_id, status, address_id')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'scheduled')
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (fetchError) {
      logger.error('fetch-delivery-request-error', { error: fetchError.message, vehicleId });
      return NextResponse.json(
        { error: 'Erro ao buscar solicitação de entrega/retirada' },
        { status: 500 }
      );
    }

    if (!deliveryRequest) {
      return NextResponse.json(
        { error: 'Nenhuma entrega/retirada agendada encontrada para este veículo' },
        { status: 404 }
      );
    }

    // Usar o DeliveryService para marcar como entregue
    const service = new DeliveryService(
      new SupabaseDeliveryRequestRepository(admin),
      new SupabaseVehicleRepository(admin),
      new SupabaseTimelineWriter(admin),
      new DevNotificationPort()
    );

    await service.markDelivered({
      requestId: deliveryRequest.id,
      actorId: req.user.id,
    });

    logger.info('delivery-confirmed', {
      vehicleId,
      requestId: deliveryRequest.id,
      specialistId: req.user.id,
      isDelivery: !!deliveryRequest.address_id,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('unexpected-error', { error: e?.message || e });
    return NextResponse.json(
      { error: e?.message || 'Erro ao confirmar entrega/retirada' },
      { status: 500 }
    );
  }
});
