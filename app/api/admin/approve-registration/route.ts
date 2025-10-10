import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import {
  sanitizeString,
  sanitizeObject,
  sanitizeNumber,
} from '@/modules/common/utils/inputSanitization';
import { RegistrationApprovalService } from '@/modules/admin/services/RegistrationApprovalService'; // New import
import { ValidationError } from '@/modules/common/errors'; // New imports
import { getLogger, ILogger } from '@/modules/logger';
import { respondWithError } from '@/modules/common/utils/apiErrorResponse';

const logger: ILogger = getLogger('AdminApproveRegistrationAPI');

async function approveRegistrationHandler(req: AuthenticatedRequest) {
  const adminUser = req.user; // Assuming withAdminAuth adds user to request
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const rawData = await req.json();
    const sanitizedData = sanitizeObject(rawData);
    const { userId, parqueamento, taxaOperacao } = sanitizedData;
    logger.info(`Processing approval for user ID: ${userId}`);

    if (!userId) {
      throw new ValidationError('ID do usuário não informado.');
    }
    if (!parqueamento || !taxaOperacao) {
      throw new ValidationError('Todos os campos do contrato são obrigatórios.');
    }

    const numTaxaOperacao = sanitizeNumber(taxaOperacao);

    if (isNaN(numTaxaOperacao)) {
      throw new ValidationError('Taxa de operação deve ser um número válido.');
    }

    const approvalService = new RegistrationApprovalService();
    await approvalService.approveRegistration({
      userId: sanitizeString(userId as string),
      parqueamento: sanitizeString(parqueamento as string),
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
    return respondWithError(error);
  }
}

// Exportar handler protegido com autenticação admin
export const POST = withAdminAuth(approveRegistrationHandler);
