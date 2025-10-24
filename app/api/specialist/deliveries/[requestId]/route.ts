import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { DeliveryService } from '@/modules/delivery/domain/DeliveryService';
import { SupabaseDeliveryRequestRepository } from '@/modules/delivery/infra/SupabaseDeliveryRequestRepository';
import { SupabaseVehicleRepository } from '@/modules/delivery/infra/SupabaseVehicleRepository';
import { SupabaseTimelineWriter } from '@/modules/delivery/infra/SupabaseTimelineWriter';
import { DevNotificationPort } from '@/modules/delivery/infra/DevNotificationPort';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const PATCH = withSpecialistAuth(
  async (req: AuthenticatedRequest, ctx: { params: Promise<{ requestId: string }> }) => {
    const { requestId } = await ctx.params;
    try {
      const body = await req.json();
      const { action } = body || {};
      if (!requestId || !action) {
        return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
      }

      const admin = SupabaseService.getInstance().getAdminClient();
      const service = new DeliveryService(
        new SupabaseDeliveryRequestRepository(admin),
        new SupabaseVehicleRepository(admin),
        new SupabaseTimelineWriter(admin),
        new DevNotificationPort()
      );

      if (action === 'mark_in_transit') {
        await service.markInTransit({ requestId, actorId: req.user.id });
      } else if (action === 'mark_delivered') {
        await service.markDelivered({ requestId, actorId: req.user.id });
      } else {
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
    }
  }
);
