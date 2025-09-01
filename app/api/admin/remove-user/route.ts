import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { NextResponse } from 'next/server';
import { UserDeletionService } from '@/modules/admin/services/UserDeletionService';
import { NotFoundError, DatabaseError, AppError } from '@/modules/common/errors';
import { getLogger, ILogger } from '@/modules/logger';
import { respondWithError } from '@/modules/common/utils/apiErrorResponse';

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
    return respondWithError(error);
  }
}

export const POST = withAdminAuth(removeUserHandler);
