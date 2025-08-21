import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';

const logger: ILogger = getLogger('ForceChangePasswordAPI');

async function forceChangePasswordHandler(req: AuthenticatedRequest) {
  try {
    const { password } = await req.json();
    const user = req.user;

    if (!password) {
      return NextResponse.json({ error: 'Nova senha é obrigatória.' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });

    if (updateError) {
      logger.error(`Error updating password for user ${user.id}:`, updateError);
      return NextResponse.json(
        { error: 'Erro ao redefinir senha', details: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Senha redefinida com sucesso!' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Erro interno na API force-change-password:', errorMessage);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 }
    );
  }
}

export const POST = withClientAuth(forceChangePasswordHandler);
