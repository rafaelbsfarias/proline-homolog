import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ResendEmailService } from '@/modules/common/services/ResendEmailService';
import { getLogger, ILogger } from '@/modules/logger';
import { generateTemporaryPassword } from '@/lib/security/passwordUtils';
import { User } from '@supabase/supabase-js';

const logger: ILogger = getLogger('RequestPasswordResetAPI');

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      logger.warn('Email not provided for password reset.');
      return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
    }

    const supabaseAdmin = SupabaseService.getInstance().getAdminClient();
    const resendEmailService = new ResendEmailService();

    // 1. Find the user by email
    logger.info(`Password reset requested for email: ${email}`);
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      logger.error(`Error listing users to find ${email}:`, listError);
      // Still return a generic success message to the client
      return NextResponse.json({
        success: true,
        message:
          'Se um usuário com este email existir, um email de redefinição de senha foi enviado.',
      });
    }

    const user = usersData.users.find((u: User) => u.email === email);

    if (!user) {
      logger.warn(`User with email ${email} not found for password reset.`);
      // To prevent user enumeration, we don't reveal that the user doesn't exist.
      return NextResponse.json({
        success: true,
        message:
          'Se um usuário com este email existir, um email de redefinição de senha foi enviado.',
      });
    }

    logger.info(`User ${user.id} found for password reset.`);

    // 2. Generate a new temporary password
    const temporaryPassword = generateTemporaryPassword();
    logger.info(`Generated temporary password for user ${user.id}.`);

    // 3. Update the user's password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: temporaryPassword,
    });

    if (updateError) {
      logger.error(`Error updating password for user ${user.id}:`, updateError);
      // Even if the update fails, we send a generic success message.
      // This prevents leaking information about the system's state.
      return NextResponse.json({
        success: true,
        message:
          'Se um usuário com este email existir, um email de redefinição de senha foi enviado.',
      });
    }
    logger.info(`Password updated successfully for user ${user.id}.`);

    // 4. Send the new password to the user's email
    const userName = user.user_metadata?.full_name || 'Usuário';
    const userRole = user.user_metadata?.role || 'Usuário';

    await resendEmailService.sendTemporaryPasswordForReset(email, userName, temporaryPassword);

    logger.info(`New temporary password sent to ${email}.`);

    return NextResponse.json({
      success: true,
      message:
        'Se um usuário com este email existir, um email de redefinição de senha foi enviado.',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in request-password-reset API:', errorMessage, error);
    // Generic success message on internal errors as well.
    return NextResponse.json(
      {
        success: true,
        message:
          'Se um usuário com este email existir, um email de redefinição de senha foi enviado.',
      },
      { status: 200 } // Return 200 to not indicate an error state
    );
  }
}
