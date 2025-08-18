import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import {
  sanitizeString,
  sanitizeObject,
  sanitizeNumber,
} from '@/modules/common/utils/inputSanitization';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminEditUserAPI');

async function editUserHandler(req: AuthenticatedRequest) {
  const adminUser = req.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const rawData = await req.json();
    const sanitizedData = sanitizeObject(rawData);
    const { userId, full_name, email, role, status, taxa_operacao, parqueamento } = sanitizedData;
    logger.info(`Attempting to edit user ID: ${userId}`);
    logger.debug('Received data:', sanitizedData);

    if (!userId) {
      logger.warn('User ID not provided for edit operation.');
      return NextResponse.json({ error: 'ID do usuário não informado.' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Update auth.users table
    logger.info(`Updating auth user email for ID: ${userId}`);
    const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(userId, {
      email: sanitizeString(email as string),
    });

    if (authError) {
      logger.error(`Error updating auth user ${userId}:`, authError);
      return NextResponse.json(
        { error: `Erro ao atualizar usuário (auth): ${authError.message}` },
        { status: 500 }
      );
    }
    logger.info(`Auth user email updated for ID: ${userId}`);

    // Update profiles table
    const sanitizedRole = sanitizeString(role as string);
    const sanitizedStatus = sanitizeString(status as string);
    logger.info(
      `Updating profile for user ID: ${userId} with role: ${sanitizedRole}, status: ${sanitizedStatus}`
    );

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: sanitizeString(full_name as string),
        role: sanitizedRole,
        status: sanitizedStatus,
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      logger.error(`Error updating profile for user ${userId}:`, profileError);
      return NextResponse.json(
        { error: `Erro ao atualizar perfil: ${profileError.message}` },
        { status: 500 }
      );
    }
    logger.info(`Profile updated successfully for user ID: ${userId}`);

    if (sanitizedRole === 'client') {
      logger.info(`Updating client-specific data for user ID: ${userId}`);
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          taxa_operacao: taxa_operacao ? sanitizeNumber(taxa_operacao as number) : null,
          parqueamento: parqueamento ? sanitizeNumber(parqueamento as number) : null,
        })
        .eq('profile_id', userId);

      if (clientError) {
        logger.error(`Error updating client data for user ${userId}:`, clientError);
        return NextResponse.json(
          { error: `Erro ao atualizar dados do cliente: ${clientError.message}` },
          { status: 500 }
        );
      }
      logger.info(`Client-specific data updated successfully for user ID: ${userId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso!',
      user: {
        id: profile.id,
        full_name: profile.full_name,
        email: authUser?.user?.email,
        role: sanitizedRole,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in editUserHandler:', errorMessage, error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(editUserHandler);
