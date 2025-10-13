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

    // Obter token do header Authorization
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação não encontrado' },
        { status: 401 }
      );
    }

    // Criar cliente Supabase autenticado com token do usuário (para RLS)
    const supabaseService = SupabaseService.getInstance();
    const authenticatedClient = supabaseService.createAuthenticatedClient(token);

    // Criar repositório com cliente autenticado
    const repository = new SupabasePartnerServiceRepository(supabaseService, authenticatedClient);

    // Criar Application Service com repositório autenticado
    const service = new PartnerServiceApplicationServiceImpl(repository);

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

    // Buscar campos de review diretamente do Supabase (não fazem parte da entidade de domínio)
    const serviceIds = result.data.services.map(s => s.id);

    if (serviceIds.length > 0) {
      const { data: reviewData } = await authenticatedClient
        .from('partner_services')
        .select('id, review_status, review_feedback, review_requested_at')
        .in('id', serviceIds);

      // Enriquecer resposta com dados de review
      if (reviewData) {
        type ReviewData = {
          id: string;
          review_status: string | null;
          review_feedback: string | null;
          review_requested_at: string | null;
        };

        const reviewMap = new Map<string, ReviewData>(
          (reviewData as ReviewData[]).map(r => [r.id, r])
        );

        servicesResponse.forEach(
          (s: {
            id: string;
            reviewStatus?: string | null;
            reviewFeedback?: string | null;
            reviewRequestedAt?: string | null;
          }) => {
            const review = reviewMap.get(s.id);
            if (review) {
              s.reviewStatus = review.review_status || undefined;
              s.reviewFeedback = review.review_feedback;
              s.reviewRequestedAt = review.review_requested_at;
            }
          }
        );
      }
    }

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
