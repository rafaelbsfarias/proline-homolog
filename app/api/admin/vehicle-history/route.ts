import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createClient } from '@/lib/supabase/server';
import { getLogger } from '@/modules/logger';
import {
  fetchVehicleHistory,
  validateVehicleId,
} from '@/modules/vehicles/utils/vehicleHistoryHelpers';

const logger = getLogger('api:admin:vehicle-history');

export const GET = withAdminAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');

  // Validar vehicleId
  const validationError = validateVehicleId(vehicleId);
  if (validationError) return validationError;

  const supabase = await createClient();

  // Usar helper compartilhado
  return fetchVehicleHistory({
    supabase,
    vehicleId: vehicleId!,
    logger,
    context: 'admin',
  });
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
