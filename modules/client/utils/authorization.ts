import { SupabaseService } from '@/modules/common/services/SupabaseService';

interface AuthResult {
  authorized: boolean;
  error?: string;
  status?: number;
}

/**
 * Authorizes a client for a specific vehicle.
 * Ensures the client owns the vehicle.
 * @returns A result object indicating authorization status.
 */
export async function authorizeClientForVehicle(
  clientId: string,
  vehicleId: string
): Promise<AuthResult> {
  const supabase = SupabaseService.getInstance().getAdminClient();

  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('client_id')
    .eq('id', vehicleId)
    .maybeSingle();

  if (vehicleError) {
    return { authorized: false, error: 'Erro ao carregar veículo para autorização', status: 500 };
  }

  if (!vehicle) {
    return { authorized: false, error: 'Veículo não encontrado', status: 404 };
  }

  if (vehicle.client_id !== clientId) {
    return {
      authorized: false,
      error: 'Acesso negado: você não tem permissão para acessar este veículo',
      status: 403,
    };
  }

  return { authorized: true };
}
