import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';

const logger = getLogger('ResetPasswordAPI');

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Nova senha é obrigatória.' }, { status: 400 });
    }

    // Recupera o access_token do header Authorization: Bearer <token>
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Token de autenticação ausente.' }, { status: 401 });
    }
    const accessToken = authHeader.split(' ')[1];

    // Cria um cliente Supabase autenticado com o token do usuário
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

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
