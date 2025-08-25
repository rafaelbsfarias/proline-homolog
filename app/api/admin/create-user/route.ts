import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { CreateUserUseCase, CreateUserInput } from '@/modules/admin/application/CreateUserUseCase';
import { AppRole } from '@/lib/security/authorization';
import { ValidationError } from '@/lib/utils/errors';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminCreateUserAPI');

// Headers para garantir runtime Node.js e comportamento dinâmico na Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function createUserHandler(request: AuthenticatedRequest): Promise<Response> {
  const adminUser = request.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const rawData = await request.json();
    const { name, email, role } = rawData;
    logger.debug('Received raw data for new user:', rawData);

    let mappedRole: AppRole;
    if (role === 'administrador' || role === 'admin') {
      mappedRole = 'admin';
    } else if (role === 'especialista' || role === 'specialist') {
      mappedRole = 'specialist';
    } else {
      logger.warn(`Invalid role provided for user creation: ${role}`);
      throw new ValidationError('Papel inválido para criação de usuário.');
    }
    logger.info(
      `Attempting to create new user with email: ${email} and mapped role: ${mappedRole}`
    );

    const input: CreateUserInput = {
      name: name,
      email: email,
      role: mappedRole,
    };

    const createUserUseCase = new CreateUserUseCase();
    const result = await createUserUseCase.execute(input);

    logger.info(`User ${result.userId} created successfully.`);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error in createUserHandler:', error);
    return handleApiError(error);
  }
}

export const POST = withAdminAuth(createUserHandler);
