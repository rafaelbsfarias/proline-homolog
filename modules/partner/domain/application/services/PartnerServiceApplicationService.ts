/**
 * PartnerService Application Service Interface
 * Define os casos de uso e operações de negócio para PartnerService
 */

import { Result } from '@/modules/common/types/domain';
import { PartnerService } from '../../entities/PartnerService';

export interface CreatePartnerServiceCommand {
  partnerId: string;
  name: string;
  price: number;
  description?: string;
}

export interface UpdatePartnerServiceCommand {
  id: string;
  name?: string;
  price?: number;
  description?: string;
  isActive?: boolean;
}

export interface PartnerServiceFilters {
  partnerId?: string;
  isActive?: boolean;
  nameFilter?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginatedPartnerServices {
  services: PartnerService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PartnerServiceApplicationService {
  /**
   * Cria um novo serviço para um parceiro
   * Valida regras de negócio e garante unicidade do nome por parceiro
   */
  createService(command: CreatePartnerServiceCommand): Promise<Result<PartnerService>>;

  /**
   * Atualiza um serviço existente
   * Valida regras de negócio e mantém consistência dos dados
   */
  updateService(command: UpdatePartnerServiceCommand): Promise<Result<PartnerService>>;

  /**
   * Remove um serviço (soft delete - desativa)
   */
  deactivateService(serviceId: string): Promise<Result<void>>;

  /**
   * Reativa um serviço desativado
   */
  activateService(serviceId: string): Promise<Result<PartnerService>>;

  /**
   * Busca um serviço por ID
   */
  getServiceById(serviceId: string): Promise<Result<PartnerService | null>>;

  /**
   * Lista serviços de um parceiro com filtros e paginação
   */
  getServicesByPartner(
    partnerId: string,
    filters?: Omit<PartnerServiceFilters, 'partnerId'>,
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedPartnerServices>>;

  /**
   * Lista todos os serviços com filtros avançados e paginação
   */
  getAllServices(
    filters?: PartnerServiceFilters,
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedPartnerServices>>;

  /**
   * Busca serviços por nome (pesquisa parcial)
   */
  searchServicesByName(name: string, partnerId?: string): Promise<Result<PartnerService[]>>;

  /**
   * Busca serviços por faixa de preço
   */
  getServicesByPriceRange(
    minPrice: number,
    maxPrice: number,
    partnerId?: string
  ): Promise<Result<PartnerService[]>>;

  /**
   * Conta serviços ativos de um parceiro
   */
  countActiveServices(partnerId: string): Promise<Result<number>>;

  /**
   * Desativa todos os serviços de um parceiro
   */
  deactivateAllServices(partnerId: string): Promise<Result<number>>;

  /**
   * Valida se um nome de serviço é único para um parceiro
   */
  validateServiceNameUniqueness(
    partnerId: string,
    name: string,
    excludeServiceId?: string
  ): Promise<Result<boolean>>;
}
