import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createClient } from '@/lib/supabase/server';
import { getLogger } from '@/modules/logger';
import {
  fetchVehicleHistory,
  validateVehicleId,
} from '@/modules/vehicles/utils/vehicleHistoryHelpers';

const logger = getLogger('api:partner:vehicle-history');

export const GET = withPartnerAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');

  // Validar vehicleId
  const validationError = validateVehicleId(vehicleId);
  if (validationError) return validationError;

  const supabase = await createClient();
  const partnerId = req.user.id;

  // Verificar se o parceiro tem acesso a este veículo através de partner_clients
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('client_id')
    .eq('id', vehicleId!)
    .single();

  if (vehicleError || !vehicle) {
    logger.warn('vehicle_not_found', { vehicleId: vehicleId!.slice(0, 8) });
    return NextResponse.json({ success: false, error: 'Veículo não encontrado' }, { status: 404 });
  }

  // Verificar se o parceiro tem acesso a este cliente
  const { data: partnerClient, error: partnerError } = await supabase
    .from('partner_clients')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('client_id', vehicle.client_id)
    .single();

  if (partnerError || !partnerClient) {
    logger.warn('unauthorized_access', {
      partnerId: partnerId.slice(0, 8),
      vehicleId: vehicleId!.slice(0, 8),
    });
    return NextResponse.json(
      { success: false, error: 'Acesso não autorizado a este veículo' },
      { status: 403 }
    );
  }

  // Buscar histórico usando helper compartilhado
  return fetchVehicleHistory({
    supabase,
    vehicleId: vehicleId!,
    logger,
    context: 'partner',
  });
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
