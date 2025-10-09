/**
 * PartnerService API v2 - Endpoints para serviço específico
 * GET, PUT, DELETE /api/partner/services/v2/[serviceId]
 */

import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { PartnerServiceApplicationServiceImpl } from '@/modules/partner/domain/application/services/PartnerServiceApplicationServiceImpl';
import { SupabasePartnerServiceRepository } from '@/modules/partner/domain/repositories/SupabasePartnerServiceRepository';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import {
  handleServiceResult,
  handleValidationError,
  handleApiError,
} from '@/modules/common/http/errorHandlers';
import { UpdateServiceSchema } from '../lib/schemas';

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

interface RouteParams {
  serviceId: string;
}

/**
 * Valida e extrai o serviceId dos parâmetros da rota
 * @returns NextResponse com erro ou null se válido
 */
async function validateServiceId(context: {
  params: Promise<RouteParams>;
}): Promise<{ serviceId: string | null; error: NextResponse | null }> {
  const { serviceId } = await context.params;

  if (!serviceId) {
    return {
      serviceId: null,
      error: NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'ID do serviço é obrigatório' },
        },
        { status: 400 }
      ),
    };
  }

  return { serviceId, error: null };
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
    const { serviceId, error } = await validateServiceId(context);
    if (error) return error;

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
    const { serviceId, error } = await validateServiceId(context);
    if (error) return error;

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
    const { serviceId, error } = await validateServiceId(context);
    if (error) return error;

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
