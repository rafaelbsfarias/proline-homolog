import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { RegistrationRejectionService } from '@/modules/admin/services/RegistrationRejectionService';
import { NotFoundError, DatabaseError, AppError, ValidationError } from '@/modules/common/errors';
import { getLogger, ILogger } from '@/modules/logger';

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

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message, code: 'USER_NOT_FOUND' },
        { status: error.statusCode }
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, code: 'INVALID_INPUT' },
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
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(rejectRegistrationHandler);
