import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { CreateUserUseCase, CreateUserInput } from '@/modules/admin/application/CreateUserUseCase';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminAddPartnerAPI');

// Headers para garantir runtime Node.js e comportamento dinâmico na Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function handleAddPartner(request: AuthenticatedRequest): Promise<Response> {
  const adminUser = request.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const rawData = await request.json();
    logger.debug('Received raw data for new partner:', rawData);

    // Mapear os dados da requisição para o formato esperado pelo CreateUserUseCase
    const input: CreateUserInput = {
      name: rawData.name, // Representante da Empresa
      email: rawData.email,
      role: 'partner',
      phone: rawData.phone,
      documentType: 'CNPJ', // Assumindo CNPJ para parceiros
      document: rawData.cnpj,
      companyName: rawData.companyName, // Razão Social
    };
    logger.info(`Attempting to create new partner with email: ${input.email}`);

    const createUserUseCase = new CreateUserUseCase();
    const result = await createUserUseCase.execute(input);

    logger.info(`Partner ${result.userId} created successfully.`);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error in handleAddPartner:', error);
    return handleApiError(error);
  }
}

export const POST = withAdminAuth(handleAddPartner);
