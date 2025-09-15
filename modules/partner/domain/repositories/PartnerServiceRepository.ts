/**
 * PartnerService Repository Interface
 * Define as operações de persistência para PartnerService Aggregate Root
 */

import { Repository } from '@/modules/common/types/domain';
import { PartnerService } from '../entities/PartnerService';

export interface PartnerServiceRepository extends Repository<PartnerService> {
  /**
   * Busca serviços por ID do parceiro
   * @param partnerId - ID do parceiro
   * @returns Promise<PartnerService[]> - Lista de serviços do parceiro
   */
  findByPartnerId(partnerId: string): Promise<PartnerService[]>;

  /**
   * Busca serviços ativos por ID do parceiro
   * @param partnerId - ID do parceiro
   * @returns Promise<PartnerService[]> - Lista de serviços ativos do parceiro
   */
  findActiveByPartnerId(partnerId: string): Promise<PartnerService[]>;

  /**
   * Busca serviços por nome (busca parcial, case insensitive)
   * @param name - Nome ou parte do nome para buscar
   * @returns Promise<PartnerService[]> - Lista de serviços encontrados
   */
  findByName(name: string): Promise<PartnerService[]>;

  /**
   * Busca serviços por faixa de preço
   * @param minPrice - Preço mínimo
   * @param maxPrice - Preço máximo
   * @returns Promise<PartnerService[]> - Lista de serviços na faixa de preço
   */
  findByPriceRange(minPrice: number, maxPrice: number): Promise<PartnerService[]>;

  /**
   * Busca serviços por palavra-chave na descrição
   * @param keyword - Palavra-chave para buscar
   * @returns Promise<PartnerService[]> - Lista de serviços encontrados
   */
  findByDescriptionKeyword(keyword: string): Promise<PartnerService[]>;

  /**
   * Conta serviços por parceiro
   * @param partnerId - ID do parceiro
   * @returns Promise<number> - Número de serviços do parceiro
   */
  countByPartnerId(partnerId: string): Promise<number>;

  /**
   * Verifica se existe serviço com nome específico para um parceiro
   * @param partnerId - ID do parceiro
   * @param name - Nome do serviço
   * @param excludeServiceId - ID do serviço a excluir da verificação (opcional, para updates)
   * @returns Promise<boolean> - true se existe serviço com mesmo nome
   */
  existsByNameForPartner(
    partnerId: string,
    name: string,
    excludeServiceId?: string
  ): Promise<boolean>;

  /**
   * Desativa todos os serviços de um parceiro
   * @param partnerId - ID do parceiro
   * @returns Promise<number> - Número de serviços desativados
   */
  deactivateAllByPartnerId(partnerId: string): Promise<number>;

  /**
   * Busca serviços com paginação
   * @param options - Opções de paginação e filtros
   * @returns Promise<{ services: PartnerService[]; total: number; page: number; limit: number }>
   */
  findWithPagination(options: {
    page: number;
    limit: number;
    partnerId?: string;
    isActive?: boolean;
    nameFilter?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{
    services: PartnerService[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}
