import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { DeliveryService } from '@/modules/delivery/domain/DeliveryService';
import { SupabaseDeliveryRequestRepository } from '@/modules/delivery/infra/SupabaseDeliveryRequestRepository';
import { SupabaseVehicleRepository } from '@/modules/delivery/infra/SupabaseVehicleRepository';
import { SupabaseTimelineWriter } from '@/modules/delivery/infra/SupabaseTimelineWriter';
import { DevNotificationPort } from '@/modules/delivery/infra/DevNotificationPort';

const logger = getLogger('api:admin:accept-vehicle-delivery-date');

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { requestId } = body || {};

    if (!requestId) {
      return NextResponse.json({ error: 'requestId é obrigatório' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    const service = new DeliveryService(
      new SupabaseDeliveryRequestRepository(admin),
      new SupabaseVehicleRepository(admin),
      new SupabaseTimelineWriter(admin),
      new DevNotificationPort()
    );

    const result = await service.approveDeliveryByRequestId({
      requestId,
      actorId: req.user.id,
    });

    return NextResponse.json({ success: true, requestId: result.requestId });
  } catch (e: any) {
    logger.error('unexpected_error', { e: e?.message || e });
    const msg = e?.message || 'Erro interno';
    const status = msg.includes('não encontrada')
      ? 404
      : msg.includes('sem data desejada')
        ? 400
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
