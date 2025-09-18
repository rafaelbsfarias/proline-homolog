/**
 * PartnerService Aggregate Root
 * Representa um serviço oferecido por um parceiro seguindo princípios DDD
 * Aggregate Roots são responsáveis por manter a consistência das regras de negócio
 */

import { Result, createSuccess, createError } from '@/modules/common/types/domain';
import { ServiceName } from '../value-objects/ServiceName';
import { ServicePrice } from '../value-objects/ServicePrice';
import { ServiceDescription } from '../value-objects/ServiceDescription';

export class PartnerService {
  private constructor(
    private readonly _id: string,
    private _name: ServiceName,
    private _price: ServicePrice,
    private _description: ServiceDescription,
    private readonly _partnerId: string,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private _isActive: boolean = true
  ) {
    // Garante imutabilidade do Aggregate Root
    Object.freeze(this);
  }

  /**
   * Cria uma nova instância de PartnerService
   * @param id - ID único do serviço
   * @param name - Nome do serviço
   * @param price - Preço do serviço
   * @param description - Descrição do serviço
   * @param partnerId - ID do parceiro que oferece o serviço
   * @returns Result<PartnerService> - Sucesso ou erro de validação
   */
  static create(
    id: string,
    name: string,
    price: number | string,
    description: string,
    partnerId: string
  ): Result<PartnerService> {
    // Validação: ID não pode ser vazio
    if (!id || id.trim().length === 0) {
      return createError(new ValidationError('ID do serviço não pode ser vazio'));
    }

    // Validação: Partner ID não pode ser vazio
    if (!partnerId || partnerId.trim().length === 0) {
      return createError(new ValidationError('ID do parceiro não pode ser vazio'));
    }

    // Criação dos Value Objects
    const nameResult = ServiceName.create(name);
    if (!nameResult.success) {
      const failureResult = nameResult as { readonly success: false; readonly error: Error };
      return createError(failureResult.error);
    }

    const priceResult = ServicePrice.create(price);
    if (!priceResult.success) {
      const failureResult = priceResult as { readonly success: false; readonly error: Error };
      return createError(failureResult.error);
    }

    const descriptionResult = ServiceDescription.create(description);
    if (!descriptionResult.success) {
      const failureResult = descriptionResult as { readonly success: false; readonly error: Error };
      return createError(failureResult.error);
    }

    const now = new Date();
    return createSuccess(
      new PartnerService(
        id,
        nameResult.data,
        priceResult.data,
        descriptionResult.data,
        partnerId,
        now,
        now,
        true
      )
    );
  }

  /**
   * Reconstrói um PartnerService a partir de dados persistidos
   * @param data - Dados para reconstruir a entidade
   * @returns Result<PartnerService> - Sucesso ou erro de validação
   */
  static reconstruct(data: {
    id: string;
    name: string;
    price: number;
    description: string;
    partnerId: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
  }): Result<PartnerService> {
    const nameResult = ServiceName.create(data.name);
    if (!nameResult.success) {
      const failureResult = nameResult as { readonly success: false; readonly error: Error };
      return createError(failureResult.error);
    }

    const priceResult = ServicePrice.create(data.price);
    if (!priceResult.success) {
      const failureResult = priceResult as { readonly success: false; readonly error: Error };
      return createError(failureResult.error);
    }

    const descriptionResult = ServiceDescription.create(data.description);
    if (!descriptionResult.success) {
      const failureResult = descriptionResult as { readonly success: false; readonly error: Error };
      return createError(failureResult.error);
    }

    return createSuccess(
      new PartnerService(
        data.id,
        nameResult.data,
        priceResult.data,
        descriptionResult.data,
        data.partnerId,
        data.createdAt,
        data.updatedAt,
        data.isActive
      )
    );
  }

  // Getters para propriedades imutáveis
  get id(): string {
    return this._id;
  }

  get partnerId(): string {
    return this._partnerId;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get isActive(): boolean {
    return this._isActive;
  }

  // Getters para Value Objects
  get name(): ServiceName {
    return this._name;
  }

  get price(): ServicePrice {
    return this._price;
  }

  get description(): ServiceDescription {
    return this._description;
  }

  /**
   * Atualiza o nome do serviço
   * @param newName - Novo nome do serviço
   * @returns Result<PartnerService> - Nova instância com nome atualizado
   */
  updateName(newName: string): Result<PartnerService> {
    const nameResult = ServiceName.create(newName);
    if (!nameResult.success) {
      const failureResult = nameResult as { readonly success: false; readonly error: Error };
      return createError(failureResult.error);
    }

    // Garante que updatedAt seja sempre maior que o atual
    const newUpdatedAt = new Date(Math.max(Date.now(), this._updatedAt.getTime() + 1));

    return createSuccess(
      new PartnerService(
        this._id,
        nameResult.data,
        this._price,
        this._description,
        this._partnerId,
        this._createdAt,
        newUpdatedAt,
        this._isActive
      )
    );
  }

  /**
   * Atualiza o preço do serviço
   * @param newPrice - Novo preço do serviço
   * @returns Result<PartnerService> - Nova instância com preço atualizado
   */
  updatePrice(newPrice: number | string): Result<PartnerService> {
    const priceResult = ServicePrice.create(newPrice);
    if (!priceResult.success) {
      const failureResult = priceResult as { readonly success: false; readonly error: Error };
      return createError(failureResult.error);
    }

    // Garante que updatedAt seja sempre maior que o atual
    const newUpdatedAt = new Date(Math.max(Date.now(), this._updatedAt.getTime() + 1));

    return createSuccess(
      new PartnerService(
        this._id,
        this._name,
        priceResult.data,
        this._description,
        this._partnerId,
        this._createdAt,
        newUpdatedAt,
        this._isActive
      )
    );
  }

  /**
   * Atualiza a descrição do serviço
   * @param newDescription - Nova descrição do serviço
   * @returns Result<PartnerService> - Nova instância com descrição atualizada
   */
  updateDescription(newDescription: string): Result<PartnerService> {
    const descriptionResult = ServiceDescription.create(newDescription);
    if (!descriptionResult.success) {
      const failureResult = descriptionResult as { readonly success: false; readonly error: Error };
      return createError(failureResult.error);
    }

    // Garante que updatedAt seja sempre maior que o atual
    const newUpdatedAt = new Date(Math.max(Date.now(), this._updatedAt.getTime() + 1));

    return createSuccess(
      new PartnerService(
        this._id,
        this._name,
        this._price,
        descriptionResult.data,
        this._partnerId,
        this._createdAt,
        newUpdatedAt,
        this._isActive
      )
    );
  }

  /**
   * Atualiza múltiplas propriedades do serviço
   * @param updates - Propriedades a serem atualizadas
   * @returns Result<PartnerService> - Nova instância com propriedades atualizadas
   */
  updateMultiple(updates: {
    name?: string;
    price?: number | string;
    description?: string;
  }): Result<PartnerService> {
    let currentName = this._name;
    let currentPrice = this._price;
    let currentDescription = this._description;

    // Valida e atualiza nome se fornecido
    if (updates.name !== undefined) {
      const nameResult = ServiceName.create(updates.name);
      if (!nameResult.success) {
        const failureResult = nameResult as { readonly success: false; readonly error: Error };
        return createError(failureResult.error);
      }
      currentName = nameResult.data;
    }

    // Valida e atualiza preço se fornecido
    if (updates.price !== undefined) {
      const priceResult = ServicePrice.create(updates.price);
      if (!priceResult.success) {
        const failureResult = priceResult as { readonly success: false; readonly error: Error };
        return createError(failureResult.error);
      }
      currentPrice = priceResult.data;
    }

    // Valida e atualiza descrição se fornecida
    if (updates.description !== undefined) {
      const descriptionResult = ServiceDescription.create(updates.description);
      if (!descriptionResult.success) {
        const failureResult = descriptionResult as {
          readonly success: false;
          readonly error: Error;
        };
        return createError(failureResult.error);
      }
      currentDescription = descriptionResult.data;
    }

    return createSuccess(
      new PartnerService(
        this._id,
        currentName,
        currentPrice,
        currentDescription,
        this._partnerId,
        this._createdAt,
        new Date(Math.max(Date.now(), this._updatedAt.getTime() + 1)),
        this._isActive
      )
    );
  }

  /**
   * Desativa o serviço
   * @returns PartnerService - Nova instância desativada
   */
  deactivate(): PartnerService {
    return new PartnerService(
      this._id,
      this._name,
      this._price,
      this._description,
      this._partnerId,
      this._createdAt,
      new Date(Math.max(Date.now(), this._updatedAt.getTime() + 1)),
      false
    );
  }

  /**
   * Reativa o serviço
   * @returns PartnerService - Nova instância reativada
   */
  reactivate(): PartnerService {
    return new PartnerService(
      this._id,
      this._name,
      this._price,
      this._description,
      this._partnerId,
      this._createdAt,
      new Date(Math.max(Date.now(), this._updatedAt.getTime() + 1)),
      true
    );
  }

  /**
   * Verifica se o serviço pode ser oferecido (está ativo)
   * @returns boolean - true se o serviço está ativo
   */
  canBeOffered(): boolean {
    return this._isActive;
  }

  /**
   * Verifica se o serviço pertence a um parceiro específico
   * @param partnerId - ID do parceiro
   * @returns boolean - true se pertence ao parceiro
   */
  belongsToPartner(partnerId: string): boolean {
    return this._partnerId === partnerId;
  }

  /**
   * Verifica se o nome do serviço contém uma palavra-chave
   * @param keyword - Palavra-chave para buscar
   * @returns boolean - true se contém a palavra-chave
   */
  nameContains(keyword: string): boolean {
    return this._name.value.toLowerCase().includes(keyword.toLowerCase());
  }

  /**
   * Verifica se a descrição do serviço contém uma palavra-chave
   * @param keyword - Palavra-chave para buscar
   * @returns boolean - true se contém a palavra-chave
   */
  descriptionContains(keyword: string): boolean {
    return this._description.contains(keyword);
  }

  /**
   * Calcula o preço com desconto
   * @param discountPercentage - Percentual de desconto (0-100)
   * @returns Result<ServicePrice> - Preço com desconto
   */
  calculateDiscountedPrice(discountPercentage: number): Result<ServicePrice> {
    if (discountPercentage < 0 || discountPercentage > 100) {
      return createError(new ValidationError('Percentual de desconto deve estar entre 0 e 100'));
    }

    const discountAmount = this._price.value * (discountPercentage / 100);
    const discountedValue = this._price.value - discountAmount;

    return ServicePrice.create(discountedValue);
  }

  /**
   * Verifica se o preço está dentro de uma faixa
   * @param minPrice - Preço mínimo
   * @param maxPrice - Preço máximo
   * @returns boolean - true se está dentro da faixa
   */
  isPriceInRange(minPrice: number | string, maxPrice: number | string): boolean {
    const minResult = ServicePrice.create(minPrice);
    const maxResult = ServicePrice.create(maxPrice);

    if (!minResult.success || !maxResult.success) {
      return false;
    }

    return this._price.value >= minResult.data.value && this._price.value <= maxResult.data.value;
  }

  /**
   * Retorna representação JSON do PartnerService
   */
  toJSON(): object {
    return {
      id: this._id,
      name: this._name.value,
      price: this._price.value,
      formattedPrice: this._price.formatted,
      description: this._description.value,
      descriptionSummary: this._description.summary,
      partnerId: this._partnerId,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      isActive: this._isActive,
    };
  }

  /**
   * Compara este PartnerService com outro para igualdade
   * @param other - Outro PartnerService para comparar
   * @returns boolean - true se são iguais (mesmo ID)
   */
  equals(other: PartnerService): boolean {
    return this._id === other._id;
  }
}

/**
 * Erro de validação específico para PartnerService
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PartnerServiceValidationError';
  }
}
