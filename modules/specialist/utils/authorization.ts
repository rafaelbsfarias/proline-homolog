import { SupabaseService } from '@/modules/common/services/SupabaseService';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AuthResult {
  authorized: boolean;
  error?: string;
  status?: number;
  clientId?: string; // Return clientId for convenience
}

/**
 * Checks if a specialist is directly linked to a given client.
 * @returns A result object indicating authorization status.
 */
export async function checkSpecialistClientLink(
  supabase: SupabaseClient,
  specialistId: string,
  clientId: string
): Promise<Omit<AuthResult, 'clientId'>> {
  const { data: link, error: linkErr } = await supabase
    .from('client_specialists')
    .select('client_id')
    .eq('client_id', clientId)
    .eq('specialist_id', specialistId)
    .maybeSingle();

  if (linkErr) {
    // Log the database error for debugging
    console.error('Authorization check error:', linkErr);
    return { authorized: false, error: 'Erro interno de autorização', status: 500 };
  }
  if (!link) {
    return {
      authorized: false,
      error: 'Acesso negado: o especialista não está vinculado a este cliente.',
      status: 403,
    };
  }
  return { authorized: true };
}

/**
 * Authorizes a specialist for a specific vehicle.
 * It fetches the vehicle's client and then uses checkSpecialistClientLink.
 * @returns A result object indicating authorization status, including the vehicle's client ID.
 */
export async function authorizeSpecialistForVehicle(
  specialistId: string,
  vehicleId: string
): Promise<AuthResult> {
  const supabase = SupabaseService.getInstance().getAdminClient();

  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('client_id')
    .eq('id', vehicleId)
    .maybeSingle();

  if (vehicleError) {
    console.error('Error fetching vehicle for auth:', vehicleError);
    return { authorized: false, error: 'Erro ao carregar veículo para autorização', status: 500 };
  }
  if (!vehicle) {
    return { authorized: false, error: 'Veículo não encontrado', status: 404 };
  }

  const linkResult = await checkSpecialistClientLink(supabase, specialistId, vehicle.client_id);
  return { ...linkResult, clientId: vehicle.client_id };
}
