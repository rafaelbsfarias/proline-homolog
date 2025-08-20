import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ResendEmailService } from '@/modules/common/services/ResendEmailService';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('SendPasswordResetEmailAPI');

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      logger.warn('Email not provided for password reset.');
      return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
    }

    const supabaseAdmin = SupabaseService.getInstance().getAdminClient();
    const resendEmailService = new ResendEmailService();

    // Generate the password reset link using Supabase Admin API
    const { data, error: generateLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.APP_URL}/reset-password`,
      },
    });
    if (generateLinkError) {
      logger.error(`Error generating password reset link for ${email}:`, generateLinkError);
      return NextResponse.json(
        { error: `Erro ao gerar link de redefinição de senha: ${generateLinkError.message}` },
        { status: 500 }
      );
    }

    if (!data?.properties?.action_link) {
      logger.error(`No action_link found in generatedlink for ${email}.`);
      return NextResponse.json(
        { error: 'Erro interno: Link de redefinição inválido.' },
        { status: 500 }
      );
    }

    // Use the Supabase action_link directly so the user is redirected back
    // with access_token and refresh_token in the hash fragment
    const actionLink = data.properties.action_link;

    // Send the email using ResendEmailService with the full action link
    await resendEmailService.sendPasswordResetEmail(email, actionLink);

    logger.info(`Password reset email sent to ${email} via Resend.`);
    return NextResponse.json({
      success: true,
      message: 'Email de redefinição enviado com sucesso!',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in send-password-reset-email API:', errorMessage, error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
