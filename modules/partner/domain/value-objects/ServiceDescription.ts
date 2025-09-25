/**
 * ServiceDescription Value Object
 * Representa a descrição de um serviço seguindo princípios DDD
 * Value Objects são imutáveis e comparáveis por valor
 */

import { Result, createSuccess, createError } from '@/modules/common/types/domain';

export class ServiceDescription {
  private constructor(private readonly _value: string) {
    // Garante imutabilidade
    Object.freeze(this);
  }

  /**
   * Cria uma nova instância de ServiceDescription com validações
   * @param description - A descrição do serviço como string
   * @returns Result<ServiceDescription> - Sucesso ou erro de validação
   */
  static create(description: string): Result<ServiceDescription> {
    // Validação: descrição não pode ser vazia
    if (!description || description.trim().length === 0) {
      return createError(new ValidationError('Descrição do serviço não pode ser vazia'));
    }

    // Validação: descrição deve ter pelo menos 10 caracteres
    if (description.trim().length < 10) {
      return createError(
        new ValidationError('Descrição do serviço deve ter pelo menos 10 caracteres')
      );
    }

    // Validação: descrição não pode ter mais de 1000 caracteres
    if (description.trim().length > 1000) {
      return createError(
        new ValidationError('Descrição do serviço não pode ter mais de 1000 caracteres')
      );
    }

    // Validação: descrição não pode conter apenas espaços
    if (description.trim() !== description) {
      return createError(
        new ValidationError('Descrição do serviço não pode começar ou terminar com espaços')
      );
    }

    // Validação: descrição não pode conter caracteres de controle
    const controlChars = /[\x00-\x1f\x7f]/;
    if (controlChars.test(description)) {
      return createError(
        new ValidationError('Descrição do serviço contém caracteres de controle inválidos')
      );
    }

    return createSuccess(new ServiceDescription(description.trim()));
  }

  /**
   * Retorna o valor da descrição do serviço
   */
  get value(): string {
    return this._value;
  }

  /**
   * Retorna um resumo da descrição (primeiros 100 caracteres)
   */
  get summary(): string {
    if (this._value.length <= 100) {
      return this._value;
    }
    return this._value.substring(0, 97) + '...';
  }

  /**
   * Retorna o comprimento da descrição
   */
  get length(): number {
    return this._value.length;
  }

  /**
   * Compara este ServiceDescription com outro para igualdade
   * @param other - Outro ServiceDescription para comparar
   * @returns boolean - true se forem iguais
   */
  equals(other: ServiceDescription): boolean {
    return this._value === other._value;
  }

  /**
   * Verifica se a descrição contém uma palavra-chave
   * @param keyword - Palavra-chave para buscar
   * @returns boolean - true se contém a palavra-chave
   */
  contains(keyword: string): boolean {
    return this._value.toLowerCase().includes(keyword.toLowerCase());
  }

  /**
   * Retorna representação string do ServiceDescription
   */
  toString(): string {
    return this._value;
  }

  /**
   * Retorna representação JSON do ServiceDescription
   */
  toJSON(): string {
    return this._value;
  }
}

/**
 * Erro de validação específico para ServiceDescription
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceDescriptionValidationError';
  }
}
