import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

// Definir tipo para o retorno da RPC function
interface ClientVehicleCount {
  id: string;
  full_name: string;
  vehicle_count: number;
}

async function vehiclesCountHandler(request: AuthenticatedRequest) {
  console.log('=== VEHICLES COUNT HANDLER ===');
  console.log('User:', request.user.email);
  console.log('User ID:', request.user.id);
  console.log('User Role:', request.user.role);

  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    // Usar RPC function para buscar contagem de veículos
    const { data, error } = await supabase.rpc('get_clients_with_vehicle_count');

    if (error) {
      console.error('=== RPC ERROR ===');
      console.error('RPC error:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar contagem de veículos' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Buscar apenas o cliente logado com tipagem explícita
    const clientsData = data as ClientVehicleCount[] | null;
    const userVehicleCount = clientsData?.find(
      (client: ClientVehicleCount) => client.id === request.user.id
    );

    console.log('=== RPC SUCCESS ===');
    console.log('Total clients with vehicles:', clientsData?.length || 0);
    console.log('Current user vehicle count:', userVehicleCount?.vehicle_count || 0);

    // Retornar apenas a contagem do usuário logado
    const response = {
      vehicle_count: userVehicleCount?.vehicle_count || 0,
      client_id: request.user.id,
      full_name: userVehicleCount?.full_name || 'Usuário',
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('=== VEHICLES COUNT ERROR ===');
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const GET = withClientAuth(vehiclesCountHandler);
