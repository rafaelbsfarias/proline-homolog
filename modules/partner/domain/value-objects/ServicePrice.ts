/**
 * ServicePrice Value Object
 * Representa o preço de um serviço seguindo princípios DDD
 * Value Objects são imutáveis e comparáveis por valor
 */

import { Result, createSuccess, createError } from '@/modules/common/types/domain';

export class ServicePrice {
  private constructor(private readonly _value: number) {
    // Garante imutabilidade
    Object.freeze(this);
  }

  /**
   * Cria uma nova instância de ServicePrice com validações
   * @param price - O preço do serviço como número ou string
   * @returns Result<ServicePrice> - Sucesso ou erro de validação
   */
  static create(price: number | string): Result<ServicePrice> {
    let numericPrice: number;

    // Converte string para número se necessário
    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      if (isNaN(parsed)) {
        return createError(new ValidationError('Preço deve ser um número válido'));
      }
      numericPrice = parsed;
    } else {
      numericPrice = price;
    }

    // Validação: preço deve ser um número finito
    if (!isFinite(numericPrice)) {
      return createError(new ValidationError('Preço deve ser um número finito'));
    }

    // Validação: preço deve ser maior ou igual a zero
    if (numericPrice < 0) {
      return createError(new ValidationError('Preço não pode ser negativo'));
    }

    // Validação: preço não pode ser maior que 999.999,99 (1 milhão - 1 centavo)
    if (numericPrice > 999999.99) {
      return createError(new ValidationError('Preço não pode ser maior que R$ 999.999,99'));
    }

    // Validação: preço deve ter no máximo 2 casas decimais
    const decimalPlaces = (numericPrice.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return createError(new ValidationError('Preço deve ter no máximo 2 casas decimais'));
    }

    return createSuccess(new ServicePrice(numericPrice));
  }

  /**
   * Retorna o valor do preço do serviço
   */
  get value(): number {
    return this._value;
  }

  /**
   * Retorna o preço formatado como moeda brasileira
   */
  get formatted(): string {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this._value);

    // Substitui espaço não quebrável por espaço normal
    return formatted.replace(/\u00A0/g, ' ');
  }

  /**
   * Compara este ServicePrice com outro para igualdade
   * @param other - Outro ServicePrice para comparar
   * @returns boolean - true se forem iguais
   */
  equals(other: ServicePrice): boolean {
    // Comparação com tolerância para evitar problemas de precisão floating point
    return Math.abs(this._value - other._value) < 0.005;
  }

  /**
   * Verifica se este preço é maior que outro
   * @param other - Outro ServicePrice para comparar
   * @returns boolean - true se este for maior
   */
  isGreaterThan(other: ServicePrice): boolean {
    return this._value > other._value;
  }

  /**
   * Verifica se este preço é menor que outro
   * @param other - Outro ServicePrice para comparar
   * @returns boolean - true se este for menor
   */
  isLessThan(other: ServicePrice): boolean {
    return this._value < other._value;
  }

  /**
   * Retorna representação string do ServicePrice
   */
  toString(): string {
    return this.formatted;
  }

  /**
   * Retorna representação JSON do ServicePrice
   */
  toJSON(): number {
    return this._value;
  }
}

/**
 * Erro de validação específico para ServicePrice
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServicePriceValidationError';
  }
}
