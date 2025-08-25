import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import {
  sanitizeString,
  sanitizeObject,
  validateEmail,
} from '@/modules/common/utils/inputSanitization';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminSendMagicLinkAPI');

async function sendMagicLinkHandler(req: AuthenticatedRequest) {
  const adminUser = req.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const rawData = await req.json();
    const sanitizedData = sanitizeObject(rawData);
    const { email } = sanitizedData;
    logger.info(`Attempting to send magic link to email: ${email}`);

    if (!email) {
      logger.warn('Email not provided for magic link.');
      return NextResponse.json(
        {
          error: 'Email é obrigatório.',
          code: 'MISSING_EMAIL',
        },
        { status: 400 }
      );
    }

    if (!validateEmail(email as string)) {
      logger.warn(`Invalid email format for magic link: ${email}`);
      return NextResponse.json(
        {
          error: 'Email inválido.',
          code: 'INVALID_EMAIL',
        },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeString(email as string).toLowerCase();

    const supabase = SupabaseService.getInstance().getAdminClient();

    logger.info(`Sending magic link via signInWithOtp to ${sanitizedEmail}`);
    const { data, error } = await supabase.auth.signInWithOtp({
      email: sanitizedEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.prolineauto.com.br'}/dashboard?magic=true`,
      },
    });

    if (error) {
      logger.error(`Error sending magic link to ${sanitizedEmail}:`, error);
      return NextResponse.json(
        {
          error: 'Erro ao enviar Magic Link.',
          code: 'MAGIC_LINK_ERROR',
          details: error.message,
          debugInfo: {
            email: sanitizedEmail,
          },
        },
        { status: 500 }
      );
    }

    logger.info(`Magic link sent successfully to ${sanitizedEmail}.`);
    logger.debug('Supabase response for magic link:', data);
    return NextResponse.json(
      {
        success: true,
        message: 'Magic Link enviado com sucesso!',
        emailSent: true,
        email: sanitizedEmail,
        templateType: 'Magic Link (signInWithOtp)',
        debugInfo: {
          supabaseResponse: data,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in sendMagicLinkHandler:', errorMessage, error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(sendMagicLinkHandler);
