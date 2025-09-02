import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ResendEmailService } from '@/modules/common/services/ResendEmailService';
import { getLogger, ILogger } from '@/modules/logger';
import { generateTemporaryPassword } from '@/lib/security/passwordUtils';
import { User, SupabaseClient } from '@supabase/supabase-js';

const logger: ILogger = getLogger('RequestPasswordResetAPI');

/**
 * Finds a user by email using an efficient RPC call to the custom `get_user_by_email` Supabase database function.
 */
async function findUserByEmail(supabaseAdmin: SupabaseClient, email: string): Promise<User | null> {
  logger.info(`Searching for user with email via RPC: ${email}`);

  const { data, error } = await supabaseAdmin.rpc('get_user_by_email', { p_email: email }).single();

  if (error) {
    logger.error(`Error calling get_user_by_email RPC for ${email}:`, error);
    return null;
  }

  if (!data) {
    logger.warn(`User with email ${email} not found via RPC.`);
    return null;
  }

  // The RPC function returns a custom shape that includes id, email, and user_metadata.
  // We cast it to a partial User type for use in the main logic.
  const user = data as User;

  logger.info(`User ${user.id} found for password reset.`);
  return user;
}

function getSuccessResponse() {
  return NextResponse.json({
    success: true,
    message: 'Se um usuário com este email existir, um email de redefinição de senha foi enviado.',
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      logger.warn('Email not provided for password reset.');
      return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
    }

    const supabaseAdmin = SupabaseService.getInstance().getAdminClient();
    const user = await findUserByEmail(supabaseAdmin, email);

    // To prevent user enumeration, always return a generic success message,
    // regardless of whether the user was found or if an error occurred.
    if (!user) {
      return getSuccessResponse();
    }

    const temporaryPassword = generateTemporaryPassword();
    logger.info(`Generated temporary password for user ${user.id}.`);

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: temporaryPassword,
    });

    if (updateError) {
      logger.error(`Error updating password for user ${user.id}:`, updateError);
      return getSuccessResponse(); // Still return success to not leak info
    }

    logger.info(`Password updated successfully for user ${user.id}.`);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', user.id);

    if (profileError) {
      logger.error(`Error updating must_change_password for user ${user.id}:`, profileError);
      // Non-critical error, proceed with sending email.
    } else {
      logger.debug(`must_change_password updated successfully for user ${user.id}`);
    }

    const resendEmailService = new ResendEmailService();
    const userName = user.user_metadata?.full_name || 'Usuário';

    await resendEmailService.sendTemporaryPasswordForReset(email, userName, temporaryPassword);
    logger.info(`New temporary password sent to ${email}.`);

    return getSuccessResponse();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in request-password-reset API:', errorMessage, error);
    // On internal errors, also return a generic success message.
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
