/**
 * PartnerService API v2 - Endpoints para serviço específico
 * GET, PUT, DELETE /api/partner/services/v2/[serviceId]
 */

import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { PartnerServiceApplicationServiceImpl } from '@/modules/partner/domain/application/services/PartnerServiceApplicationServiceImpl';
import { SupabasePartnerServiceRepository } from '@/modules/partner/domain/repositories/SupabasePartnerServiceRepository';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { Result } from '@/modules/common/types/domain';
import { z } from 'zod';

// Schema para atualização de serviço
const UpdateServiceSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome do serviço é obrigatório')
    .max(100, 'Nome do serviço deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  price: z
    .number()
    .positive('Preço deve ser um valor positivo')
    .max(999999.99, 'Preço deve ser menor que 1.000.000')
    .optional(),
  description: z
    .string()
    .min(1, 'Descrição do serviço é obrigatória')
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional(),
});

// Instância do Application Service (singleton pattern)
let applicationService: PartnerServiceApplicationServiceImpl | null = null;

function getApplicationService(): PartnerServiceApplicationServiceImpl {
  if (!applicationService) {
    const supabaseService = SupabaseService.getInstance();
    const repository = new SupabasePartnerServiceRepository(supabaseService);
    applicationService = new PartnerServiceApplicationServiceImpl(repository);
  }
  return applicationService;
}

// Mapeamento de entidade PartnerService para resposta HTTP
function mapPartnerServiceToResponse(service: {
  id: string;
  partnerId: string;
  name: { value: string };
  price: { value: number };
  description: { value: string };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: service.id,
    partnerId: service.partnerId,
    name: service.name.value,
    price: service.price.value,
    description: service.description.value,
    isActive: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

// Tratamento de Result para resposta HTTP
function handleServiceResult<T>(result: Result<T>, successStatus: number = 200): NextResponse {
  if (result.success) {
    return NextResponse.json({ success: true, data: result.data }, { status: successStatus });
  }

  // Determinar código e status baseado no nome do erro
  const errorName = result.error?.name || 'Error';
  const errorMapping: Record<string, { code: string; status: number }> = {
    ValidationError: { code: 'VALIDATION_ERROR', status: 400 },
    NotFoundError: { code: 'NOT_FOUND_ERROR', status: 404 },
    ConflictError: { code: 'CONFLICT_ERROR', status: 409 },
    UnauthorizedError: { code: 'UNAUTHORIZED_ERROR', status: 401 },
    ForbiddenError: { code: 'FORBIDDEN_ERROR', status: 403 },
    DatabaseError: { code: 'DATABASE_ERROR', status: 500 },
  };

  const mapping = errorMapping[errorName] || { code: 'UNKNOWN_ERROR', status: 500 };

  const errorResponse = {
    success: false,
    error: {
      code: mapping.code,
      message: result.error?.message || 'Erro interno do servidor',
    },
  };

  return NextResponse.json(errorResponse, { status: mapping.status });
}

// Tratamento de erros de validação
function handleValidationError(error: { errors?: unknown; message?: string }): NextResponse {
  const errorResponse = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Dados de entrada inválidos',
      details: error.errors || error.message,
    },
  };

  return NextResponse.json(errorResponse, { status: 400 });
}

// Tratamento de erros gerais
function handleApiError(): NextResponse {
  const errorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
    },
  };

  return NextResponse.json(errorResponse, { status: 500 });
}

interface RouteParams {
  serviceId: string;
}

/**
 * GET /api/partner/services/v2/[serviceId]
 * Busca um serviço específico por ID
 */
async function getServiceHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const { serviceId } = await context.params;

    if (!serviceId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'ID do serviço é obrigatório' },
        },
        { status: 400 }
      );
    }

    const service = getApplicationService();
    const result = await service.getServiceById(serviceId);

    if (!result.success) {
      return handleServiceResult(result);
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND_ERROR', message: 'Serviço não encontrado' } },
        { status: 404 }
      );
    }

    // Verificar se o serviço pertence ao parceiro autenticado
    if (result.data.partnerId !== req.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN_ERROR', message: 'Acesso negado' } },
        { status: 403 }
      );
    }

    const serviceResponse = mapPartnerServiceToResponse(result.data);
    return NextResponse.json({ success: true, data: serviceResponse });
  } catch {
    return handleApiError();
  }
}

/**
 * PUT /api/partner/services/v2/[serviceId]
 * Atualiza um serviço específico
 */
async function updateServiceHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const { serviceId } = await context.params;

    if (!serviceId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'ID do serviço é obrigatório' },
        },
        { status: 400 }
      );
    }

    // Parse do corpo da requisição
    const body = await req.json();

    // Validar dados usando Zod
    const validationResult = UpdateServiceSchema.safeParse(body);
    if (!validationResult.success) {
      return handleValidationError(validationResult.error);
    }

    // Adicionar ID do serviço
    const validatedData = {
      ...validationResult.data,
      id: serviceId,
    };

    // Executar caso de uso através do Application Service
    const service = getApplicationService();
    const result = await service.updateService(validatedData);

    // Retornar resposta mapeada
    return handleServiceResult(result);
  } catch {
    return handleApiError();
  }
}

/**
 * DELETE /api/partner/services/v2/[serviceId]
 * Desativa um serviço específico (soft delete)
 */
async function deleteServiceHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const { serviceId } = await context.params;

    if (!serviceId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'ID do serviço é obrigatório' },
        },
        { status: 400 }
      );
    }

    const service = getApplicationService();
    const result = await service.deactivateService(serviceId);

    return handleServiceResult(result);
  } catch {
    return handleApiError();
  }
}

export const GET = withPartnerAuth(getServiceHandler);
export const PUT = withPartnerAuth(updateServiceHandler);
export const DELETE = withPartnerAuth(deleteServiceHandler);
