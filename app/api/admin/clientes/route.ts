import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminListarClientesAPI');

async function listarClientesHandler(req: AuthenticatedRequest) {
  const adminUser = req.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const supabase = SupabaseService.getInstance().getAdminClient();
    logger.info('Fetching client profiles with role "client".');

    const { data: clients, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'client');

    if (error) {
      logger.error('Error fetching clients:', error);
      return NextResponse.json(
        {
          error: 'Erro ao buscar clientes.',
          code: 'CLIENT_FETCH_ERROR',
        },
        { status: 500 }
      );
    }

    logger.info(`Found ${clients?.length || 0} clients.`);
    return NextResponse.json({ clients });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in listarClientesHandler:', errorMessage, error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(listarClientesHandler);
