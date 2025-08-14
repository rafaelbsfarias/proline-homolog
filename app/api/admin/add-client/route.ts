import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { CreateUserUseCase, CreateUserInput } from '@/modules/admin/application/CreateUserUseCase';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminAddClientAPI');

// Headers para garantir runtime Node.js e comportamento dinâmico na Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function addClientHandler(req: AuthenticatedRequest) {
  const adminUser = req.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const rawData = await req.json();
    logger.debug('Received raw data for new client:', rawData);

    // Mapear os dados da requisição para o formato esperado pelo CreateUserUseCase
    const input: CreateUserInput = {
      name: rawData.name,
      email: rawData.email,
      role: 'client',
      phone: rawData.phone,
      documentType: rawData.documentType,
      document: rawData.document,
      parqueamento: rawData.parqueamento,
      quilometragem: rawData.quilometragem,
      percentualFipe: rawData.percentualFipe,
      taxaOperacao: rawData.taxaOperacao,
    };
    logger.info(`Attempting to create new client with email: ${input.email}`);

    const createUserUseCase = new CreateUserUseCase();
    const result = await createUserUseCase.execute(input);

    logger.info(`Client ${result.userId} created successfully.`);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error in addClientHandler:', error);
    return handleApiError(error);
  }
}

// Exportar handler protegido com autenticação admin
export const POST = withAdminAuth(addClientHandler);
