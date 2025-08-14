import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import crypto from 'crypto';
import { Buffer } from 'buffer';
import { getSupabaseServiceKey, getSupabaseUrl } from '@/modules/common/utils/environmentSecurity';
import { sanitizeString } from '@/modules/common/utils/inputSanitization';

/**
 * Endpoint para confirmar email após aprovação de cadastro
 * Suporta tanto POST (com token) quanto GET (com parâmetros de URL)
 */
export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'Token não informado.' }, { status: 400 });
  }

  return await confirmEmailWithToken(sanitizeString(token));
}

/**
 * Método GET para confirmação via link do email
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          error: 'Token não fornecido.',
          code: 'MISSING_TOKEN',
        },
        { status: 400 }
      );
    }

    const result = await confirmEmailWithToken(sanitizeString(token));

    // Se sucesso, redirecionar para página de login com mensagem
    if (result.status === 200) {
      const redirectUrl = new URL('/login?email_confirmed=true', process.env.NEXT_PUBLIC_SITE_URL);
      return NextResponse.redirect(redirectUrl);
    }

    return result;
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * Função principal para confirmar email com token
 */
async function confirmEmailWithToken(token: string) {
  const supabase = SupabaseService.getInstance().getAdminClient();

  try {
    // Tentar decodificar o token (formato: userId:timestamp:hash)
    const tokenParts = token.split(':');
    if (tokenParts.length !== 3) {
      return NextResponse.json(
        {
          error: 'Token inválido.',
          code: 'INVALID_TOKEN_FORMAT',
        },
        { status: 400 }
      );
    }

    const [userId, timestamp, hash] = tokenParts;

    // Verificar se o token não expirou (24 horas)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 horas

    if (now - tokenTime > expirationTime) {
      return NextResponse.json(
        {
          error: 'Token expirado.',
          code: 'TOKEN_EXPIRED',
        },
        { status: 400 }
      );
    }

    // Verificar hash do token
    const secret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-secret';
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(`${userId}:${timestamp}`)
      .digest('hex')
      .substring(0, 16); // Primeiros 16 caracteres

    if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash))) {
      return NextResponse.json(
        {
          error: 'Token inválido.',
          code: 'INVALID_TOKEN_HASH',
        },
        { status: 400 }
      );
    }

    // Buscar usuário atual para verificar se já foi confirmado
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(userId);

    if (getUserError || !authUser || !authUser.user) {
      return NextResponse.json(
        {
          error: 'Usuário não encontrado.',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Confirmar o email do usuário com timestamp
    const confirmationTimestamp = new Date().toISOString();
    const { error: confirmError } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
      user_metadata: {
        ...authUser.user.user_metadata,
        email_confirmed_at: confirmationTimestamp,
        email_confirmed_by_approval: true,
        email_confirmation_method: 'approval_link',
      },
    });

    if (confirmError) {
      return NextResponse.json(
        {
          error: 'Erro ao confirmar email: ' + confirmError.message,
          code: 'CONFIRMATION_ERROR',
        },
        { status: 500 }
      );
    }

    // Atualizar também o perfil do usuário
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        email_confirmed: true,
        email_confirmed_at: confirmationTimestamp,
      })
      .eq('id', userId);

    if (profileUpdateError) {
      // Log silencioso - não falhar o processo principal
    }

    return NextResponse.json({
      success: true,
      message: 'Email confirmado com sucesso!',
      confirmedAt: confirmationTimestamp,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
