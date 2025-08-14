import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminClientsWithVehicleCountAPI');

async function getClientsWithVehicleCountHandler(_req: AuthenticatedRequest) {
  const adminUser = _req.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const supabase = SupabaseService.getInstance().getAdminClient();
    logger.info('Executing RPC "get_clients_with_vehicle_count".');

    const { data, error } = await supabase.rpc('get_clients_with_vehicle_count');

    if (error) {
      logger.error('RPC error while fetching clients with vehicle count:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar clientes e contagem de veículos.', details: error.message },
        { status: 500 }
      );
    }

    logger.info(`Found ${data?.length || 0} clients with vehicle count.`);
    return NextResponse.json({ success: true, clients: data });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      'Internal server error in getClientsWithVehicleCountHandler:',
      errorMessage,
      error
    );
    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        details: errorMessage,
        stack: error instanceof Error && error.stack ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getClientsWithVehicleCountHandler);
