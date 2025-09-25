/**
 * ServiceName Value Object
 * Representa o nome de um serviço seguindo princípios DDD
 * Value Objects são imutáveis e comparáveis por valor
 */

import { Result, createSuccess, createError } from '@/modules/common/types/domain';

export class ServiceName {
  private constructor(private readonly _value: string) {
    // Garante imutabilidade
    Object.freeze(this);
  }

  /**
   * Cria uma nova instância de ServiceName com validações
   * @param name - O nome do serviço como string
   * @returns Result<ServiceName> - Sucesso ou erro de validação
   */
  static create(name: string): Result<ServiceName> {
    // Validação: nome não pode ser vazio
    if (!name || name.trim().length === 0) {
      return createError(new ValidationError('Nome do serviço não pode ser vazio'));
    }

    // Validação: nome deve ter pelo menos 3 caracteres
    if (name.trim().length < 3) {
      return createError(new ValidationError('Nome do serviço deve ter pelo menos 3 caracteres'));
    }

    // Validação: nome não pode ter mais de 100 caracteres
    if (name.trim().length > 100) {
      return createError(
        new ValidationError('Nome do serviço não pode ter mais de 100 caracteres')
      );
    }

    // Validação: nome não pode conter apenas espaços
    if (name.trim() !== name) {
      return createError(
        new ValidationError('Nome do serviço não pode começar ou terminar com espaços')
      );
    }

    // Validação: nome não pode conter caracteres especiais perigosos
    const dangerousChars = /[<>"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(name)) {
      return createError(new ValidationError('Nome do serviço contém caracteres inválidos'));
    }

    return createSuccess(new ServiceName(name.trim()));
  }

  /**
   * Retorna o valor do nome do serviço
   */
  get value(): string {
    return this._value;
  }

  /**
   * Compara este ServiceName com outro para igualdade
   * @param other - Outro ServiceName para comparar
   * @returns boolean - true se forem iguais
   */
  equals(other: ServiceName): boolean {
    return this.value === other.value;
  }

  /**
   * Retorna representação string do ServiceName
   */
  toString(): string {
    return this.value;
  }

  /**
   * Retorna representação JSON do ServiceName
   */
  toJSON(): string {
    return this.value;
  }
}

/**
 * Erro de validação específico para ServiceName
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceNameValidationError';
  }
}
