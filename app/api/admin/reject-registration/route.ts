import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { RegistrationRejectionService } from '@/modules/admin/services/RegistrationRejectionService';
import { NotFoundError, DatabaseError, AppError, ValidationError } from '@/modules/common/errors';
import { getLogger, ILogger } from '@/modules/logger';
import { respondWithError } from '@/modules/common/utils/apiErrorResponse';

const logger: ILogger = getLogger('AdminRejectRegistrationAPI');

async function rejectRegistrationHandler(request: AuthenticatedRequest) {
  const adminUser = request.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const body = await request.json();
    const { userId, reason } = body;
    logger.info(
      `Attempting to reject registration for user ID: ${userId} with reason: "${reason}"`
    );

    if (!userId) {
      logger.warn('User ID not provided for rejection.');
      throw new ValidationError('ID do usuário é obrigatório');
    }

    const rejectionService = new RegistrationRejectionService();
    await rejectionService.rejectRegistration({ userId, reason });

    logger.info(`Registration rejected successfully for user ID: ${userId}`);
    return NextResponse.json({
      success: true,
      message: 'Cadastro rejeitado e usuário removido com sucesso',
      emailSent: true,
    });
  } catch (error: unknown) {
    logger.error('Error in rejectRegistrationHandler:', error);
    return respondWithError(error);
  }
}

export const POST = withAdminAuth(rejectRegistrationHandler);
