import { NextResponse } from 'next/server';
import { getLogger, ILogger } from '@/modules/logger';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { withAdminAuth } from '@/modules/common/utils/authMiddleware';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const logger: ILogger = getLogger('AdminGetClientsAPI');

async function getClientsHandler() {
  logger.info('Handler started');
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    logger.info('Fetching client profiles');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at, updated_at')
      .eq('role', 'client')
      .order('full_name');

    if (profilesError) {
      logger.error('Error fetching client profiles:', profilesError);
      return NextResponse.json(
        {
          error: 'Erro ao buscar perfis de clientes.',
          code: 'PROFILES_FETCH_ERROR',
          details: profilesError.message,
        },
        { status: 500 }
      );
    }
    logger.info(`Found ${profiles?.length || 0} client profiles.`);

    const clientsWithUserData = await Promise.all(
      (profiles || []).map(async (profile: Profile) => {
        try {
          logger.debug(`Fetching auth data for profile: ${profile.id}`);
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
            profile.id
          );

          if (authError) {
            logger.warn(`Error fetching auth data for profile ${profile.id}:`, authError.message);
          }

          const email = authUser?.user?.email || '';
          const name = profile.full_name || email || 'Nome não informado';
          const isEmailConfirmed = !!authUser?.user?.email_confirmed_at;

          return {
            id: profile.id,
            full_name: name,
            email,
            role: profile.role,
            status: isEmailConfirmed ? 'Ativo' : 'Pendente',
            created_at: profile.created_at || authUser?.user?.created_at,
            updated_at: profile.updated_at || authUser?.user?.updated_at,
          };
        } catch (error) {
          logger.warn(`Error processing client ${profile.id}:`, error);

          return {
            id: profile.id,
            full_name: profile.full_name || 'Nome não informado',
            email: '',
            role: profile.role,
            status: 'Pendente',
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          };
        }
      })
    );

    logger.info(`Processed ${clientsWithUserData.length} clients.`);

    return NextResponse.json({
      success: true,
      clients: clientsWithUserData,
      count: clientsWithUserData.length,
    });
  } catch (error) {
    logger.error('Internal server error in getClientsHandler:', error);

    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getClientsHandler);
