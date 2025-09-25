/**
 * PartnerService Application Service Implementation
 * Coordena operações de negócio entre Domain e Infrastructure layers
 */

import { getLogger } from '@/modules/logger';
import { Result, createSuccess, createError } from '@/modules/common/types/domain';
import { PartnerService } from '../../entities/PartnerService';
import { PartnerServiceRepository } from '../../repositories/PartnerServiceRepository';
import {
  PartnerServiceApplicationService,
  CreatePartnerServiceCommand,
  UpdatePartnerServiceCommand,
  PartnerServiceFilters,
  PaginatedPartnerServices,
} from './PartnerServiceApplicationService';
import { getCacheService, CACHE_KEYS } from '@/modules/common/services/cache/CacheService';
import {
  DuplicateServiceNameError,
  ServiceNotFoundError,
  ServiceAlreadyActiveError,
  ServiceAlreadyInactiveError,
  ServicePersistenceError,
} from '../../errors/PartnerServiceErrors';

/**
 * Implementação do Application Service para PartnerService
 * Responsável por coordenar casos de uso e aplicar regras de negócio transversais
 */
export class PartnerServiceApplicationServiceImpl implements PartnerServiceApplicationService {
  private readonly logger = getLogger('PartnerServiceApplicationService');
  private readonly cache = getCacheService();

  constructor(private readonly repository: PartnerServiceRepository) {}

  /**
   * Cria um novo serviço para um parceiro
   */
  async createService(command: CreatePartnerServiceCommand): Promise<Result<PartnerService>> {
    try {
      this.logger.debug('Criando novo serviço para parceiro', {
        partnerId: command.partnerId,
        name: command.name,
      });

      // Validação: verificar se nome já existe para este parceiro
      const nameExists = await this.repository.existsByNameForPartner(
        command.partnerId,
        command.name
      );

      if (nameExists) {
        this.logger.warn('Tentativa de criar serviço com nome duplicado', {
          partnerId: command.partnerId,
          name: command.name,
        });
        return createError(new DuplicateServiceNameError(command.name));
      }

      // Criar nova entidade PartnerService
      const createResult = PartnerService.create(
        crypto.randomUUID(), // Gerar ID único
        command.name,
        command.price,
        command.description || '',
        command.partnerId
      );

      if (!createResult.success) {
        const failureResult = createResult as { readonly success: false; readonly error: Error };
        this.logger.error('Falha na validação do serviço', {
          error: failureResult.error.message,
          partnerId: command.partnerId,
        });
        return createError(failureResult.error);
      }

      // Salvar no repositório
      const savedService = await this.repository.save(createResult.data);

      // Invalidar cache do parceiro
      this.cache.invalidatePartnerServices(command.partnerId);
      // Invalidar contagem de serviços ativos
      this.cache.invalidateActiveServicesCount(command.partnerId);

      this.logger.info('Serviço criado com sucesso', {
        serviceId: savedService.id,
        partnerId: command.partnerId,
        name: command.name,
      });

      return createSuccess(savedService);
    } catch (error) {
      this.logger.error('Erro inesperado ao criar serviço', {
        error,
        partnerId: command.partnerId,
        name: command.name,
      });
      return createError(
        new ServicePersistenceError(
          'criação de serviço',
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Atualiza um serviço existente
   */
  async updateService(command: UpdatePartnerServiceCommand): Promise<Result<PartnerService>> {
    try {
      this.logger.debug('Atualizando serviço', { serviceId: command.id });

      // Buscar serviço existente
      const existingService = await this.repository.findById(command.id);
      if (!existingService) {
        this.logger.warn('Tentativa de atualizar serviço inexistente', { serviceId: command.id });
        return createError(new ServiceNotFoundError(command.id));
      }

      // Se nome está sendo alterado, verificar unicidade
      if (command.name && command.name !== existingService.name.value) {
        const nameExists = await this.repository.existsByNameForPartner(
          existingService.partnerId,
          command.name,
          command.id
        );

        if (nameExists) {
          this.logger.warn('Tentativa de atualizar serviço com nome duplicado', {
            serviceId: command.id,
            partnerId: existingService.partnerId,
            name: command.name,
          });
          return createError(new DuplicateServiceNameError(command.name));
        }
      }

      // Aplicar atualizações
      const updateData: Partial<{
        name?: string;
        price?: number | string;
        description?: string;
      }> = {};

      if (command.name !== undefined) updateData.name = command.name;
      if (command.price !== undefined) updateData.price = command.price;
      if (command.description !== undefined) updateData.description = command.description;

      const updateResult = existingService.updateMultiple(updateData);

      if (!updateResult.success) {
        const failureResult = updateResult as { readonly success: false; readonly error: Error };
        this.logger.error('Falha na validação da atualização', {
          error: failureResult.error.message,
          serviceId: command.id,
        });
        return createError(failureResult.error);
      }

      let updatedService = updateResult.data;

      // Aplicar mudança de status se necessário
      if (command.isActive !== undefined && command.isActive !== existingService.isActive) {
        if (command.isActive) {
          updatedService = updatedService.reactivate();
        } else {
          updatedService = updatedService.deactivate();
        }
      }

      // Salvar no repositório
      const savedService = await this.repository.save(updatedService);

      // Invalidar cache do serviço específico e do parceiro
      this.cache.invalidateService(savedService.id);
      this.cache.invalidatePartnerServices(savedService.partnerId);
      // Invalidar contagem de serviços ativos
      this.cache.invalidateActiveServicesCount(savedService.partnerId);

      this.logger.info('Serviço atualizado com sucesso', {
        serviceId: savedService.id,
        partnerId: savedService.partnerId,
      });

      return createSuccess(savedService);
    } catch (error) {
      this.logger.error('Erro inesperado ao atualizar serviço', {
        error,
        serviceId: command.id,
      });
      return createError(
        new ServicePersistenceError(
          'atualização de serviço',
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Remove um serviço (soft delete - desativa)
   */
  async deactivateService(serviceId: string): Promise<Result<void>> {
    try {
      this.logger.debug('Desativando serviço', { serviceId });

      // Buscar serviço existente
      const existingService = await this.repository.findById(serviceId);
      if (!existingService) {
        this.logger.warn('Tentativa de desativar serviço inexistente', { serviceId });
        return createError(new ServiceNotFoundError(serviceId));
      }

      // Verificar se já está desativado
      if (!existingService.isActive) {
        this.logger.warn('Tentativa de desativar serviço já desativado', { serviceId });
        return createError(new ServiceAlreadyInactiveError(serviceId));
      }

      // Desativar serviço
      const deactivatedService = existingService.deactivate();

      // Salvar no repositório
      await this.repository.save(deactivatedService);

      // Invalidar cache do serviço específico e do parceiro
      this.cache.invalidateService(serviceId);
      this.cache.invalidatePartnerServices(existingService.partnerId);
      // Invalidar contagem de serviços ativos
      this.cache.invalidateActiveServicesCount(existingService.partnerId);

      this.logger.info('Serviço desativado com sucesso', {
        serviceId,
        partnerId: existingService.partnerId,
      });

      return createSuccess(undefined);
    } catch (error) {
      this.logger.error('Erro inesperado ao desativar serviço', { error, serviceId });
      return createError(
        new ServicePersistenceError(
          'desativação de serviço',
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Reativa um serviço desativado
   */
  async activateService(serviceId: string): Promise<Result<PartnerService>> {
    try {
      this.logger.debug('Reativando serviço', { serviceId });

      // Buscar serviço existente
      const existingService = await this.repository.findById(serviceId);
      if (!existingService) {
        this.logger.warn('Tentativa de reativar serviço inexistente', { serviceId });
        return createError(new ServiceNotFoundError(serviceId));
      }

      // Verificar se já está ativo
      if (existingService.isActive) {
        this.logger.warn('Tentativa de reativar serviço já ativo', { serviceId });
        return createError(new ServiceAlreadyActiveError(serviceId));
      }

      // Reativar serviço
      const reactivatedService = existingService.reactivate();

      // Salvar no repositório
      const savedService = await this.repository.save(reactivatedService);

      // Invalidar cache do serviço específico e do parceiro
      this.cache.invalidateService(serviceId);
      this.cache.invalidatePartnerServices(existingService.partnerId);
      // Invalidar contagem de serviços ativos
      this.cache.invalidateActiveServicesCount(existingService.partnerId);

      this.logger.info('Serviço reativado com sucesso', {
        serviceId,
        partnerId: existingService.partnerId,
      });

      return createSuccess(savedService);
    } catch (error) {
      this.logger.error('Erro inesperado ao reativar serviço', { error, serviceId });
      return createError(
        new ServicePersistenceError(
          'reativação de serviço',
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Busca um serviço por ID
   */
  async getServiceById(serviceId: string): Promise<Result<PartnerService | null>> {
    try {
      // Criar chave de cache
      const cacheKey = CACHE_KEYS.service(serviceId);

      // Verificar cache primeiro
      const cachedService = this.cache.get<PartnerService | null>(cacheKey);
      if (cachedService !== null) {
        return createSuccess(cachedService);
      }

      const service = await this.repository.findById(serviceId);

      // Armazenar no cache (TTL de 10 minutos para itens individuais)
      this.cache.set(cacheKey, service, 600000);

      return createSuccess(service);
    } catch (error) {
      this.logger.error('Erro ao buscar serviço por ID', { error, serviceId });
      return createError(
        new ServicePersistenceError(
          'busca de serviço por ID',
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Lista serviços de um parceiro com filtros e paginação
   */
  async getServicesByPartner(
    partnerId: string,
    filters?: Omit<PartnerServiceFilters, 'partnerId'>,
    page: number = 1,
    limit: number = 10
  ): Promise<Result<PaginatedPartnerServices>> {
    try {
      // Criar chave de cache
      const cacheKey = CACHE_KEYS.partnerServices(partnerId, page, limit, filters?.nameFilter);

      // Verificar cache primeiro
      const cachedResult = this.cache.get<PaginatedPartnerServices>(cacheKey);
      if (cachedResult) {
        return createSuccess(cachedResult);
      }

      const paginationOptions = {
        page,
        limit,
        partnerId,
        ...filters,
      };

      const result = await this.repository.findWithPagination(paginationOptions);

      // Armazenar no cache (TTL de 5 minutos para listagens)
      this.cache.set(cacheKey, result, 300000);

      return createSuccess(result);
    } catch (error) {
      this.logger.error('Erro ao listar serviços do parceiro', { error, partnerId });
      return createError(
        new ServicePersistenceError(
          'listagem de serviços do parceiro',
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Lista todos os serviços com filtros avançados e paginação
   */
  async getAllServices(
    filters?: PartnerServiceFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<Result<PaginatedPartnerServices>> {
    try {
      const paginationOptions = {
        page,
        limit,
        ...filters,
      };

      const result = await this.repository.findWithPagination(paginationOptions);

      return createSuccess(result);
    } catch (error) {
      this.logger.error('Erro ao listar todos os serviços', { error });
      return createError(
        new ServicePersistenceError(
          'listagem de todos os serviços',
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Busca serviços por nome (pesquisa parcial)
   */
  async searchServicesByName(name: string, partnerId?: string): Promise<Result<PartnerService[]>> {
    try {
      this.logger.debug('Pesquisando serviços por nome', { name, partnerId });

      // Criar chave de cache
      const cacheKey = CACHE_KEYS.searchServices(name, partnerId);

      // Verificar cache primeiro
      const cachedServices = this.cache.get<PartnerService[]>(cacheKey);
      if (cachedServices) {
        this.logger.debug('Serviços retornados do cache', { name, partnerId, cacheKey });
        return createSuccess(cachedServices);
      }

      let services: PartnerService[];

      if (partnerId) {
        // Buscar apenas serviços do parceiro específico
        const allPartnerServices = await this.repository.findByPartnerId(partnerId);
        services = allPartnerServices.filter(service =>
          service.name.value.toLowerCase().includes(name.toLowerCase())
        );
      } else {
        // Buscar em todos os serviços
        services = await this.repository.findByName(name);
      }

      // Armazenar no cache (TTL de 3 minutos para pesquisas)
      this.cache.set(cacheKey, services, 180000);

      this.logger.debug('Serviços encontrados por nome', {
        name,
        partnerId,
        count: services.length,
        cached: false,
      });

      return createSuccess(services);
    } catch (error) {
      this.logger.error('Erro ao pesquisar serviços por nome', { error, name, partnerId });
      return createError(
        new ServicePersistenceError(
          'pesquisa de serviços por nome',
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Busca serviços por faixa de preço
   */
  async getServicesByPriceRange(
    minPrice: number,
    maxPrice: number,
    partnerId?: string
  ): Promise<Result<PartnerService[]>> {
    try {
      this.logger.debug('Buscando serviços por faixa de preço', { minPrice, maxPrice, partnerId });

      // Criar chave de cache
      const cacheKey = CACHE_KEYS.priceRangeServices(minPrice, maxPrice, partnerId);

      // Verificar cache primeiro
      const cachedServices = this.cache.get<PartnerService[]>(cacheKey);
      if (cachedServices) {
        this.logger.debug('Serviços retornados do cache', {
          minPrice,
          maxPrice,
          partnerId,
          cacheKey,
        });
        return createSuccess(cachedServices);
      }

      let services = await this.repository.findByPriceRange(minPrice, maxPrice);

      // Filtrar por parceiro se especificado
      if (partnerId) {
        services = services.filter(service => service.partnerId === partnerId);
      }

      // Armazenar no cache (TTL de 3 minutos para pesquisas)
      this.cache.set(cacheKey, services, 180000);

      this.logger.debug('Serviços encontrados por faixa de preço', {
        minPrice,
        maxPrice,
        partnerId,
        count: services.length,
        cached: false,
      });

      return createSuccess(services);
    } catch (error) {
      this.logger.error('Erro ao buscar serviços por faixa de preço', {
        error,
        minPrice,
        maxPrice,
        partnerId,
      });
      return createError(
        new ServicePersistenceError(
          'busca de serviços por faixa de preço',
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Conta serviços ativos de um parceiro
   */
  async countActiveServices(partnerId: string): Promise<Result<number>> {
    try {
      this.logger.debug('Contando serviços ativos do parceiro', { partnerId });

      // Criar chave de cache
      const cacheKey = CACHE_KEYS.activeServicesCount(partnerId);

      // Verificar cache primeiro
      const cachedCount = this.cache.get<number>(cacheKey);
      if (cachedCount !== null) {
        this.logger.debug('Contagem retornada do cache', { partnerId, count: cachedCount });
        return createSuccess(cachedCount);
      }

      const activeServices = await this.repository.findActiveByPartnerId(partnerId);
      const count = activeServices.length;

      // Armazenar no cache (TTL de 2 minutos para contagens)
      this.cache.set(cacheKey, count, 120000);

      this.logger.debug('Contagem de serviços ativos concluída', {
        partnerId,
        count,
        cached: false,
      });

      return createSuccess(count);
    } catch (error) {
      this.logger.error('Erro ao contar serviços ativos', { error, partnerId });
      return createError(
        new ServicePersistenceError(
          'contagem de serviços ativos',
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Desativa todos os serviços de um parceiro
   */
  async deactivateAllServices(partnerId: string): Promise<Result<number>> {
    try {
      this.logger.debug('Desativando todos os serviços do parceiro', { partnerId });

      const count = await this.repository.deactivateAllByPartnerId(partnerId);

      // Invalidar cache do parceiro
      this.cache.invalidatePartnerServices(partnerId);
      // Invalidar contagem de serviços ativos
      this.cache.invalidateActiveServicesCount(partnerId);

      this.logger.info('Todos os serviços do parceiro desativados', { partnerId, count });

      return createSuccess(count);
    } catch (error) {
      this.logger.error('Erro ao desativar todos os serviços', { error, partnerId });
      return createError(
        new ServicePersistenceError(
          'desativação de todos os serviços',
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Valida se um nome de serviço é único para um parceiro
   */
  async validateServiceNameUniqueness(
    partnerId: string,
    name: string,
    excludeServiceId?: string
  ): Promise<Result<boolean>> {
    try {
      this.logger.debug('Validando unicidade do nome do serviço', {
        partnerId,
        name,
        excludeServiceId,
      });

      const exists = await this.repository.existsByNameForPartner(
        partnerId,
        name,
        excludeServiceId
      );

      const isUnique = !exists;

      this.logger.debug('Validação de unicidade concluída', {
        partnerId,
        name,
        isUnique,
      });

      return createSuccess(isUnique);
    } catch (error) {
      this.logger.error('Erro ao validar unicidade do nome', { error, partnerId, name });
      return createError(
        new ServicePersistenceError(
          'validação de unicidade do nome',
          error instanceof Error ? error : undefined
        )
      );
    }
  }
}
