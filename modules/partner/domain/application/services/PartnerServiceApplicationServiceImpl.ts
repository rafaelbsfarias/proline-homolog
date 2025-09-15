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

/**
 * Implementação do Application Service para PartnerService
 * Responsável por coordenar casos de uso e aplicar regras de negócio transversais
 */
export class PartnerServiceApplicationServiceImpl implements PartnerServiceApplicationService {
  private readonly logger = getLogger('PartnerServiceApplicationService');

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
        return createError(
          new Error(`Já existe um serviço com o nome "${command.name}" para este parceiro`)
        );
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
        this.logger.error('Falha na validação do serviço', {
          error: createResult.error.message,
          partnerId: command.partnerId,
        });
        return createError(createResult.error);
      }

      // Salvar no repositório
      const savedService = await this.repository.save(createResult.data);

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
        error instanceof Error ? error : new Error('Erro desconhecido ao criar serviço')
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
        return createError(new Error('Serviço não encontrado'));
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
          return createError(
            new Error(`Já existe um serviço com o nome "${command.name}" para este parceiro`)
          );
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
        this.logger.error('Falha na validação da atualização', {
          error: updateResult.error.message,
          serviceId: command.id,
        });
        return createError(updateResult.error);
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
        error instanceof Error ? error : new Error('Erro desconhecido ao atualizar serviço')
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
        return createError(new Error('Serviço não encontrado'));
      }

      // Verificar se já está desativado
      if (!existingService.isActive) {
        this.logger.warn('Tentativa de desativar serviço já desativado', { serviceId });
        return createError(new Error('Serviço já está desativado'));
      }

      // Desativar serviço
      const deactivatedService = existingService.deactivate();

      // Salvar no repositório
      await this.repository.save(deactivatedService);

      this.logger.info('Serviço desativado com sucesso', {
        serviceId,
        partnerId: existingService.partnerId,
      });

      return createSuccess(undefined);
    } catch (error) {
      this.logger.error('Erro inesperado ao desativar serviço', { error, serviceId });
      return createError(
        error instanceof Error ? error : new Error('Erro desconhecido ao desativar serviço')
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
        return createError(new Error('Serviço não encontrado'));
      }

      // Verificar se já está ativo
      if (existingService.isActive) {
        this.logger.warn('Tentativa de reativar serviço já ativo', { serviceId });
        return createError(new Error('Serviço já está ativo'));
      }

      // Reativar serviço
      const reactivatedService = existingService.reactivate();

      // Salvar no repositório
      const savedService = await this.repository.save(reactivatedService);

      this.logger.info('Serviço reativado com sucesso', {
        serviceId,
        partnerId: existingService.partnerId,
      });

      return createSuccess(savedService);
    } catch (error) {
      this.logger.error('Erro inesperado ao reativar serviço', { error, serviceId });
      return createError(
        error instanceof Error ? error : new Error('Erro desconhecido ao reativar serviço')
      );
    }
  }

  /**
   * Busca um serviço por ID
   */
  async getServiceById(serviceId: string): Promise<Result<PartnerService | null>> {
    try {
      this.logger.debug('Buscando serviço por ID', { serviceId });

      const service = await this.repository.findById(serviceId);

      this.logger.debug('Serviço encontrado', { serviceId, found: service !== null });

      return createSuccess(service);
    } catch (error) {
      this.logger.error('Erro ao buscar serviço por ID', { error, serviceId });
      return createError(
        error instanceof Error ? error : new Error('Erro ao buscar serviço por ID')
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
      this.logger.debug('Listando serviços do parceiro', { partnerId, page, limit, filters });

      const paginationOptions = {
        page,
        limit,
        partnerId,
        ...filters,
      };

      const result = await this.repository.findWithPagination(paginationOptions);

      this.logger.debug('Serviços do parceiro listados', {
        partnerId,
        count: result.services.length,
        total: result.total,
        page,
        limit,
      });

      return createSuccess(result);
    } catch (error) {
      this.logger.error('Erro ao listar serviços do parceiro', { error, partnerId });
      return createError(
        error instanceof Error ? error : new Error('Erro ao listar serviços do parceiro')
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
      this.logger.debug('Listando todos os serviços', { page, limit, filters });

      const paginationOptions = {
        page,
        limit,
        ...filters,
      };

      const result = await this.repository.findWithPagination(paginationOptions);

      this.logger.debug('Todos os serviços listados', {
        count: result.services.length,
        total: result.total,
        page,
        limit,
      });

      return createSuccess(result);
    } catch (error) {
      this.logger.error('Erro ao listar todos os serviços', { error });
      return createError(
        error instanceof Error ? error : new Error('Erro ao listar todos os serviços')
      );
    }
  }

  /**
   * Busca serviços por nome (pesquisa parcial)
   */
  async searchServicesByName(name: string, partnerId?: string): Promise<Result<PartnerService[]>> {
    try {
      this.logger.debug('Pesquisando serviços por nome', { name, partnerId });

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

      this.logger.debug('Serviços encontrados por nome', {
        name,
        partnerId,
        count: services.length,
      });

      return createSuccess(services);
    } catch (error) {
      this.logger.error('Erro ao pesquisar serviços por nome', { error, name, partnerId });
      return createError(
        error instanceof Error ? error : new Error('Erro ao pesquisar serviços por nome')
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

      let services = await this.repository.findByPriceRange(minPrice, maxPrice);

      // Filtrar por parceiro se especificado
      if (partnerId) {
        services = services.filter(service => service.partnerId === partnerId);
      }

      this.logger.debug('Serviços encontrados por faixa de preço', {
        minPrice,
        maxPrice,
        partnerId,
        count: services.length,
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
        error instanceof Error ? error : new Error('Erro ao buscar serviços por faixa de preço')
      );
    }
  }

  /**
   * Conta serviços ativos de um parceiro
   */
  async countActiveServices(partnerId: string): Promise<Result<number>> {
    try {
      this.logger.debug('Contando serviços ativos do parceiro', { partnerId });

      const activeServices = await this.repository.findActiveByPartnerId(partnerId);
      const count = activeServices.length;

      this.logger.debug('Contagem de serviços ativos concluída', { partnerId, count });

      return createSuccess(count);
    } catch (error) {
      this.logger.error('Erro ao contar serviços ativos', { error, partnerId });
      return createError(
        error instanceof Error ? error : new Error('Erro ao contar serviços ativos')
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

      this.logger.info('Todos os serviços do parceiro desativados', { partnerId, count });

      return createSuccess(count);
    } catch (error) {
      this.logger.error('Erro ao desativar todos os serviços', { error, partnerId });
      return createError(
        error instanceof Error ? error : new Error('Erro ao desativar todos os serviços')
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
        error instanceof Error ? error : new Error('Erro ao validar unicidade do nome')
      );
    }
  }
}
