import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createClient } from '@/lib/supabase/server';
import { getLogger } from '@/modules/logger';
import {
  fetchVehicleHistory,
  validateVehicleId,
} from '@/modules/vehicles/utils/vehicleHistoryHelpers';

const logger = getLogger('api:client:vehicle-history');

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');

  // Validar vehicleId
  const validationError = validateVehicleId(vehicleId);
  if (validationError) return validationError;

  const supabase = await createClient();

  // Usar helper compartilhado
  // O RLS já garante que o cliente só vê seus próprios veículos
  return fetchVehicleHistory({
    supabase,
    vehicleId: vehicleId!,
    logger,
    context: 'client',
  });
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
