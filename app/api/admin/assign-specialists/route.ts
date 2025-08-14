import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { AdminService } from '@/modules/admin/services/AdminService';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminAssignSpecialistsAPI');

interface AssignSpecialistsRequest {
  clientId: string;
  specialistIds: string[];
}

interface AssignSpecialistsResponse {
  success: boolean;
  message: string;
}

// Single Responsibility: Validação de entrada
class RequestValidator {
  static validateAssignSpecialists(data: unknown): data is AssignSpecialistsRequest {
    logger.debug('Validating assign specialists request data.');
    if (!data || typeof data !== 'object') {
      logger.warn('Invalid request data: data is null or not an object.');
      return false;
    }

    const { clientId, specialistIds } = data as Record<string, unknown>;

    const isValid = Boolean(
      clientId &&
        typeof clientId === 'string' &&
        Array.isArray(specialistIds) &&
        specialistIds.length > 0 &&
        specialistIds.every(id => typeof id === 'string')
    );

    if (!isValid) {
      logger.warn('Invalid request data: missing clientId or invalid specialistIds format.');
    }
    return isValid;
  }
}

// Single Responsibility: Formatação de resposta
class ResponseFormatter {
  static success(message: string): NextResponse<AssignSpecialistsResponse> {
    logger.info(`Responding with success: ${message}`);
    return NextResponse.json({ success: true, message }, { status: 200 });
  }

  static error(message: string, status: number): NextResponse {
    logger.error(`Responding with error: ${message} (Status: ${status})`);
    return NextResponse.json({ error: message }, { status });
  }
}

// Single Responsibility: Handler principal
class AssignSpecialistsHandler {
  private readonly adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
    logger.info('AssignSpecialistsHandler initialized.');
  }

  async handle(request: AuthenticatedRequest): Promise<NextResponse> {
    const adminUser = request.user;
    logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

    const requestData = await this.parseRequest(request);
    logger.debug('Parsed request data:', requestData);

    if (!RequestValidator.validateAssignSpecialists(requestData)) {
      return ResponseFormatter.error(
        'Dados inválidos. É necessário fornecer clientId e lista válida de specialistIds.',
        400
      );
    }

    return this.processAssignment(requestData);
  }

  private async parseRequest(request: NextRequest): Promise<unknown> {
    try {
      const parsed = await request.json();
      logger.debug('Request JSON parsed successfully.');
      return parsed;
    } catch (e: unknown) {
      logger.error('Error parsing request JSON:', e);
      return null;
    }
  }

  private async processAssignment(data: AssignSpecialistsRequest): Promise<NextResponse> {
    logger.info(
      `Processing assignment for client ${data.clientId} with ${data.specialistIds.length} specialists.`
    );
    try {
      await this.adminService.assignSpecialistsToClient(data.clientId, data.specialistIds);
      logger.info(`Specialists successfully assigned to client ${data.clientId}.`);
      return ResponseFormatter.success('Especialista(s) vinculado(s) com sucesso!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
      logger.error(`Error processing assignment for client ${data.clientId}:`, errorMessage, error);
      return ResponseFormatter.error(errorMessage, 500);
    }
  }
}

// Dependency Inversion: Interface limpa para o endpoint
export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  const handler = new AssignSpecialistsHandler();
  return handler.handle(req);
});
