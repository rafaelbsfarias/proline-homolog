import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { sanitizeString, validateUUID } from '@/modules/common/utils/inputSanitization';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminSuspendUserAPI');

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  const adminUser = req.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const body = await req.json();
    const { userId, reactivate } = body;
    logger.info(`Attempting to ${reactivate ? 'reactivate' : 'suspend'} user with ID: ${userId}`);
    logger.debug('Received data:', { userId, reactivate });

    if (!userId) {
      logger.warn('User ID not provided for suspend/reactivate operation.');
      return NextResponse.json(
        {
          error: 'ID do usuário é obrigatório',
          code: 'MISSING_USER_ID',
        },
        { status: 400 }
      );
    }

    const sanitizedUserId = sanitizeString(userId);
    if (!validateUUID(sanitizedUserId)) {
      logger.warn(`Invalid user ID format: ${userId}`);
      return NextResponse.json(
        {
          error: 'ID do usuário inválido',
          code: 'INVALID_USER_ID',
        },
        { status: 400 }
      );
    }

    if (reactivate !== undefined && typeof reactivate !== 'boolean') {
      logger.warn(`Invalid 'reactivate' parameter type: ${typeof reactivate}`);
      return NextResponse.json(
        {
          error: 'Parâmetro reactivate deve ser um booleano',
          code: 'INVALID_REACTIVATE_PARAM',
        },
        { status: 400 }
      );
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    logger.info(`Checking existence of profile for user ID: ${sanitizedUserId}`);
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, status, full_name')
      .eq('id', sanitizedUserId)
      .single();

    if (fetchError || !existingProfile) {
      logger.error(`Profile not found for user ID: ${sanitizedUserId}`, fetchError);
      return NextResponse.json(
        {
          error: 'Perfil do usuário não encontrado',
          code: 'PROFILE_NOT_FOUND',
        },
        { status: 404 }
      );
    }
    logger.info(
      `Found profile for user ${sanitizedUserId}. Current status: ${existingProfile.status}`
    );

    const newStatus = reactivate ? 'ativo' : 'suspenso';
    const bannedUntil = reactivate ? null : new Date('2099-12-31T23:59:59.000Z').toISOString();

    if (existingProfile.status === newStatus) {
      logger.warn(`User ${sanitizedUserId} is already ${newStatus}.`);
      return NextResponse.json(
        {
          error: `Usuário já está ${newStatus}`,
          code: 'STATUS_ALREADY_SET',
        },
        { status: 400 }
      );
    }

    logger.info(`Updating profile status for user ${sanitizedUserId} to ${newStatus}`);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sanitizedUserId);

    if (updateError) {
      logger.error(`Error updating profile status for user ${sanitizedUserId}:`, updateError);
      return NextResponse.json(
        {
          error: 'Erro ao atualizar status do usuário',
          code: 'UPDATE_ERROR',
        },
        { status: 500 }
      );
    }
    logger.info(`Profile status updated for user ${sanitizedUserId}.`);

    logger.info(`Updating auth.users.banned_until for user ${sanitizedUserId} to ${bannedUntil}`);
    const { error: banError } = await supabase.auth.admin.updateUserById(sanitizedUserId, {
      banned_until: bannedUntil,
    });

    if (banError) {
      logger.error(`Error updating banned_until for user ${sanitizedUserId}:`, banError);
      return NextResponse.json(
        {
          error: 'Erro ao atualizar suspensão do usuário',
          code: 'BAN_UPDATE_ERROR',
        },
        { status: 500 }
      );
    }
    logger.info(`Auth user banned_until updated for user ${sanitizedUserId}.`);

    return NextResponse.json({
      success: true,
      message: `Usuário ${reactivate ? 'reativado' : 'suspenso'} com sucesso`,
      newStatus,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in suspendUserHandler:', errorMessage, error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
});
