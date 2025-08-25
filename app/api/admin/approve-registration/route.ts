import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import {
  sanitizeString,
  sanitizeObject,
  sanitizeNumber,
} from '@/modules/common/utils/inputSanitization';
import { RegistrationApprovalService } from '@/modules/admin/services/RegistrationApprovalService'; // New import
import { NotFoundError, DatabaseError, ValidationError, AppError } from '@/modules/common/errors'; // New imports
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminApproveRegistrationAPI');

async function approveRegistrationHandler(req: AuthenticatedRequest) {
  const adminUser = req.user; // Assuming withAdminAuth adds user to request
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const rawData = await req.json();
    const sanitizedData = sanitizeObject(rawData);
    const { userId, parqueamento, quilometragem, percentualFipe, taxaOperacao } = sanitizedData;
    logger.info(`Processing approval for user ID: ${userId}`);

    if (!userId) {
      throw new ValidationError('ID do usuário não informado.');
    }
    if (!parqueamento || !quilometragem || !percentualFipe || !taxaOperacao) {
      throw new ValidationError('Todos os campos do contrato são obrigatórios.');
    }

    const numPercentualFipe = sanitizeNumber(percentualFipe);
    const numTaxaOperacao = sanitizeNumber(taxaOperacao);

    if (isNaN(numPercentualFipe) || isNaN(numTaxaOperacao)) {
      throw new ValidationError('Percentual FIPE e taxa de operação devem ser números válidos.');
    }

    const approvalService = new RegistrationApprovalService();
    await approvalService.approveRegistration({
      userId: sanitizeString(userId as string),
      parqueamento: sanitizeString(parqueamento as string),
      quilometragem: sanitizeString(quilometragem as string),
      percentualFipe: numPercentualFipe,
      taxaOperacao: numTaxaOperacao,
    });

    logger.info(`Registration approved successfully for user ID: ${userId}`);
    return NextResponse.json({
      success: true,
      message: 'Cadastro aprovado com sucesso!',
      emailSent: true,
      confirmationTokenSent: true,
    });
  } catch (error: unknown) {
    logger.error('Error in approveRegistrationHandler', error);

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
      // Catch any other custom AppError
      return NextResponse.json(
        { error: error.message, code: 'APP_ERROR' },
        { status: error.statusCode }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
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

// Exportar handler protegido com autenticação admin
export const POST = withAdminAuth(approveRegistrationHandler);
