import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';

const logger = getLogger('ResetPasswordAPI');

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Nova senha é obrigatória.' }, { status: 400 });
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      logger.error('Erro ao redefinir senha:', updateError);
      return NextResponse.json(
        { error: 'Erro ao redefinir senha', details: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Senha redefinida com sucesso!' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Erro interno na API reset-password:', errorMessage);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 }
    );
  }
}
