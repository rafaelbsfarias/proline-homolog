/**
 * Mapeadores para conversão entre HTTP e Application Service
 */

import type {
  CreateServiceRequest,
  UpdateServiceRequest,
  SearchServicesRequest,
  ValidateServiceNameRequest,
} from './schemas';
import type { PartnerService } from '@/modules/partner/domain/entities/PartnerService';

// Mapeamento para comando de criação
export function mapCreateServiceRequestToCommand(request: CreateServiceRequest) {
  return {
    partnerId: request.partnerId,
    name: request.name,
    price: request.price,
    description: request.description,
  };
}

// Mapeamento para comando de atualização
export function mapUpdateServiceRequestToCommand(request: UpdateServiceRequest) {
  return {
    id: request.id,
    name: request.name,
    price: request.price,
    description: request.description,
  };
}

// Mapeamento para comando de busca
export function mapSearchServicesRequestToCommand(request: SearchServicesRequest) {
  return {
    partnerId: request.partnerId,
    name: request.name,
    page: request.page,
    limit: request.limit,
  };
}

// Mapeamento para comando de validação de nome
export function mapValidateServiceNameRequestToCommand(request: ValidateServiceNameRequest) {
  return {
    partnerId: request.partnerId,
    name: request.name,
    excludeServiceId: request.excludeServiceId,
  };
}

// Mapeamento de entidade PartnerService para resposta HTTP
export function mapPartnerServiceToResponse(service: PartnerService) {
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

// Mapeamento de lista de serviços para resposta HTTP
export function mapPartnerServicesToResponse(services: PartnerService[]) {
  return services.map(mapPartnerServiceToResponse);
}

// Mapeamento de resposta paginada
export function mapPaginatedResponse<T>(items: T[], total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
