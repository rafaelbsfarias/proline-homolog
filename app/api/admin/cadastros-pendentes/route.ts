import { getLogger, ILogger } from '@/modules/logger';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

const logger: ILogger = getLogger('AdminCadastrosPendentesAPI');

async function cadastrosPendentesHandler(request: AuthenticatedRequest) {
  logger.info(
    `Request received from user: ${request.user.email} (ID: ${request.user.id}, Role: ${request.user.role})`
  );

  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    logger.info('Executing RPC "get_pending_users"');
    const { data, error } = await supabase.rpc('get_pending_users');

    if (error) {
      logger.error('RPC error while fetching pending users:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar cadastros pendentes' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    logger.info(`Found ${data?.length || 0} pending users.`);
    if (data && data.length > 0) {
      logger.debug('First pending user:', data[0]);
    }

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Server error in cadastrosPendentesHandler:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const GET = withAdminAuth(cadastrosPendentesHandler);
