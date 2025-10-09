/**
 * PartnerService API v2 - Endpoints REST usando Application Service
 * Seguindo princípios DDD e Clean Architecture
 */

import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { CreateServiceSchema, SearchServicesSchema } from './lib/schemas';
import {
  mapCreateServiceRequestToCommand,
  mapPartnerServicesToResponse,
  mapPaginatedResponse,
} from './lib/mappers';
import {
  handleServiceResult,
  handleValidationError,
  handleApiError,
} from '@/modules/common/http/errorHandlers';
import { PartnerServiceApplicationServiceImpl } from '@/modules/partner/domain/application/services/PartnerServiceApplicationServiceImpl';
import { SupabasePartnerServiceRepository } from '@/modules/partner/domain/repositories/SupabasePartnerServiceRepository';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

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

/**
 * POST /api/partner/services/v2
 * Cria um novo serviço para o parceiro autenticado
 */
async function createServiceHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // Parse do corpo da requisição
    const body = await req.json();

    // Validação usando Zod
    const validationResult = CreateServiceSchema.safeParse(body);
    if (!validationResult.success) {
      return handleValidationError(validationResult.error);
    }

    // Adicionar partnerId do usuário autenticado
    const validatedData = {
      ...validationResult.data,
      partnerId: req.user.id,
    };

    // Mapear para comando do Application Service
    const command = mapCreateServiceRequestToCommand(validatedData);

    // Executar caso de uso através do Application Service
    const service = getApplicationService();
    const result = await service.createService(command);

    // Retornar resposta mapeada
    return handleServiceResult(result, 201);
  } catch {
    return handleApiError();
  }
}

/**
 * GET /api/partner/services/v2
 * Lista serviços do parceiro autenticado com paginação
 */
async function getServicesHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // Extrair parâmetros de query
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const name = url.searchParams.get('name') || undefined;

    // Validar parâmetros usando Zod
    const validationData = { page, limit, name };
    const validationResult = SearchServicesSchema.safeParse(validationData);
    if (!validationResult.success) {
      return handleValidationError(validationResult.error);
    }

    // Adicionar partnerId do usuário autenticado
    const validatedData = {
      ...validationResult.data,
      partnerId: req.user.id,
    };

    // Executar caso de uso através do Application Service
    const service = getApplicationService();
    const result = await service.getServicesByPartner(
      validatedData.partnerId,
      validatedData.name ? { nameFilter: validatedData.name } : undefined,
      validatedData.page,
      validatedData.limit
    );

    if (!result.success) {
      return handleServiceResult(result);
    }

    // Mapear resposta para formato HTTP
    const servicesResponse = mapPartnerServicesToResponse(result.data.services);
    const paginatedResponse = mapPaginatedResponse(
      servicesResponse,
      result.data.total,
      result.data.page,
      result.data.limit
    );

    return NextResponse.json({ success: true, data: paginatedResponse });
  } catch {
    return handleApiError();
  }
}

export const GET = withPartnerAuth(getServicesHandler);
export const POST = withPartnerAuth(createServiceHandler);
