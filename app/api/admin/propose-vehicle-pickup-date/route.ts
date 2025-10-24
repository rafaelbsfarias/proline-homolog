import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { DeliveryService } from '@/modules/delivery/domain/DeliveryService';
import { SupabaseDeliveryRequestRepository } from '@/modules/delivery/infra/SupabaseDeliveryRequestRepository';
import { SupabaseVehicleRepository } from '@/modules/delivery/infra/SupabaseVehicleRepository';
import { SupabaseTimelineWriter } from '@/modules/delivery/infra/SupabaseTimelineWriter';
import { DevNotificationPort } from '@/modules/delivery/infra/DevNotificationPort';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { clientId, vehicleId, proposedDate, requestId } = body || {};

    if (!clientId || !vehicleId || !proposedDate) {
      return NextResponse.json(
        { error: 'clientId, vehicleId e proposedDate são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação simples de data ISO (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(proposedDate)) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();
    const service = new DeliveryService(
      new SupabaseDeliveryRequestRepository(admin),
      new SupabaseVehicleRepository(admin),
      new SupabaseTimelineWriter(admin),
      new DevNotificationPort()
    );

    const result = await service.proposePickupNewDate({
      clientId,
      vehicleId,
      proposedDate,
      actorId: req.user.id,
    });

    return NextResponse.json({ success: true, requestId: result.requestId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
});
