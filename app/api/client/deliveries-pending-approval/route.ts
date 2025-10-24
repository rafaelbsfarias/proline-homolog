import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:deliveries-pending-approval');
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.id;
    const admin = SupabaseService.getInstance().getAdminClient();

    // Buscar entregas no status 'approved' (aguardando aprovação do cliente)
    const { data: deliveryRequests, error: deliveryError } = await admin
      .from('delivery_requests')
      .select(
        `
        id,
        vehicle_id,
        address_id,
        desired_date,
        fee_amount,
        status,
        vehicles!inner(id, plate, brand, model, year),
        addresses!inner(id, street, number, neighborhood, city, state)
      `
      )
      .eq('client_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (deliveryError) {
      logger.error('delivery-requests-fetch-error', { error: deliveryError.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar entregas pendentes' },
        { status: 500 }
      );
    }

    // Formatar resposta
    const pending = (deliveryRequests || []).map((req: any) => ({
      requestId: req.id,
      vehicle: {
        id: req.vehicle_id,
        plate: req.vehicles.plate,
        brand: req.vehicles.brand,
        model: req.vehicles.model,
        year: req.vehicles.year,
      },
      address: {
        id: req.address_id,
        label: [
          req.addresses.street,
          req.addresses.number,
          req.addresses.neighborhood,
          req.addresses.city,
        ]
          .filter(Boolean)
          .join(', '),
      },
      deliveryDate: req.desired_date,
      deliveryFee: req.fee_amount,
    }));

    return NextResponse.json({
      success: true,
      deliveries: pending,
      total: pending.length,
    });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});
