import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminClientDetailsAPI');

async function getClientDetailsHandler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  const adminUser = req.user;
  const { id } = params;
  logger.info(
    `Handler started by admin: ${adminUser?.email} (${adminUser?.id}) to fetch details for client ${id}`
  );

  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    const { data, error } = await supabase
      .from('clients')
      .select('taxa_operacao, parqueamento')
      .eq('profile_id', id)
      .single();

    if (error) {
      logger.error(`Error fetching client details for ${id}:`, error);
      return NextResponse.json(
        { error: `Erro ao buscar detalhes do cliente: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, client: data });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in getClientDetailsHandler:', errorMessage, error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getClientDetailsHandler);
