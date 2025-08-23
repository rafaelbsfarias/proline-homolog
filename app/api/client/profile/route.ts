import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('ClientProfileAPI');

async function getProfileHandler(req: AuthenticatedRequest) {
  const clientUser = req.user;
  logger.info(`Handler started by client: ${clientUser?.email} (${clientUser?.id})`);

  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, role, must_change_password')
      .eq('id', clientUser?.id)
      .single();

    if (profileError) {
      logger.error(`Error fetching profile for ${clientUser?.id}:`, profileError);
      return NextResponse.json(
        { error: `Erro ao buscar perfil: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Fetch client-specific data
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('parqueamento, taxa_operacao')
      .eq('profile_id', clientUser?.id)
      .single();

    if (clientError) {
      logger.error(`Error fetching client data for ${clientUser?.id}:`, clientError);
      return NextResponse.json(
        { error: `Erro ao buscar dados do cliente: ${clientError.message}` },
        { status: 500 }
      );
    }

    // Check contract acceptance
    const { data: acceptance, error: acceptanceError } = await supabase
      .from('client_contract_acceptance')
      .select('accepted_at')
      .eq('client_id', clientUser?.id)
      .maybeSingle();

    if (acceptanceError) {
      logger.error(`Error checking contract acceptance for ${clientUser?.id}:`, acceptanceError);
    }

    const profileWithClientData = {
      ...profile,
      client: clientData,
      contract_accepted: !!acceptance,
    };

    return NextResponse.json({ success: true, profile: profileWithClientData });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in getProfileHandler:', errorMessage, error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export const GET = withClientAuth(getProfileHandler);
