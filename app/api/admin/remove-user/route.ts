import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { NextResponse } from 'next/server';
import { UserDeletionService } from '@/modules/admin/services/UserDeletionService';
import { NotFoundError, DatabaseError, AppError } from '@/modules/common/errors';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminRemoveUserAPI');

async function removeUserHandler(request: AuthenticatedRequest) {
  const adminUser = request.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const body = await request.json();
    const { userId } = body;
    logger.info(`Attempting to remove user with ID: ${userId}`);

    if (!userId) {
      logger.warn('User ID not provided for removal.');
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const userDeletionService = new UserDeletionService();
    await userDeletionService.deleteUserAndAssociatedData(userId);

    logger.info(`User ${userId} removed successfully.`);
    return NextResponse.json({
      success: true,
      message: 'Usuário removido com sucesso',
      userId: userId,
    });
  } catch (error: unknown) {
    logger.error('Error in removeUserHandler:', error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message, code: 'USER_NOT_FOUND' },
        { status: error.statusCode }
      );
    }
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: 'DATABASE_ERROR' },
        { status: error.statusCode }
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: 'APP_ERROR' },
        { status: error.statusCode }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(removeUserHandler);
