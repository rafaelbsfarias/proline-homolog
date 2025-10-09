import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { createClient } from '@/lib/supabase/server';
import { getLogger } from '@/modules/logger';
import {
  fetchVehicleHistory,
  validateVehicleId,
} from '@/modules/vehicles/utils/vehicleHistoryHelpers';

const logger = getLogger('api:specialist:vehicle-history');

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');

  // Validar vehicleId
  const validationError = validateVehicleId(vehicleId);
  if (validationError) return validationError;

  const supabase = await createClient();

  // Especialista pode ver histórico de qualquer veículo
  return fetchVehicleHistory({
    supabase,
    vehicleId: vehicleId!,
    logger,
    context: 'specialist',
  });
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
