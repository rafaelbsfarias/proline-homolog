import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:vehicles-awaiting-pickup');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId || !validateUUID(clientId)) {
      return NextResponse.json({ success: false, error: 'clientId inválido' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Buscar solicitações de retirada (address_id null) do cliente em estado relevante
    const { data: pickupRequests, error: pickupError } = await supabase
      .from('delivery_requests')
      .select('vehicle_id, desired_date, created_by, status')
      .eq('client_id', clientId)
      .is('address_id', null)
      .in('status', ['requested', 'approved', 'scheduled']);

    if (pickupError) {
      logger.error('fetch_pickup_requests_error', { error: pickupError.message, clientId });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar solicitações de retirada' },
        { status: 500 }
      );
    }

    if (!pickupRequests || pickupRequests.length === 0) {
      return NextResponse.json({ success: true, vehicles: [] });
    }

    const vehicleIds = pickupRequests.map(r => r.vehicle_id);

    // Buscar dados dos veículos correspondentes (independente do status)
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, plate, brand, model, year')
      .in('id', vehicleIds);

    if (vehiclesError) {
      logger.error('fetch_vehicles_error', { error: vehiclesError.message, clientId });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar veículos' },
        { status: 500 }
      );
    }

    const vehiclesWithPickupInfo = (pickupRequests || []).map(req => {
      const vehicle = vehicles?.find(v => v.id === req.vehicle_id);
      return {
        vehicleId: req.vehicle_id,
        plate: vehicle?.plate || '-',
        brand: vehicle?.brand || '-',
        model: vehicle?.model || '-',
        year: vehicle?.year ? String(vehicle.year) : undefined,
        requestedPickupDate: req.desired_date || null,
        proposedBy: req.created_by === clientId ? ('client' as const) : ('admin' as const),
      };
    });

    return NextResponse.json({ success: true, vehicles: vehiclesWithPickupInfo });
  } catch (e: unknown) {
    const err = e as Error;
    logger.error('unexpected_error', { error: err?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
