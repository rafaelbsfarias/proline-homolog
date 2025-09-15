/**
 * Testes unitários para ServicePrice Value Object
 */

import { describe, it, expect } from 'vitest';
import { ServicePrice } from '../../value-objects/ServicePrice';

describe('ServicePrice', () => {
  describe('create', () => {
    it('deve criar ServicePrice com preço válido (número)', () => {
      const result = ServicePrice.create(150.5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(ServicePrice);
        expect(result.data.value).toBe(150.5);
        expect(result.data.formatted).toBe('R$ 150,50');
      }
    });

    it('deve criar ServicePrice com preço válido (string)', () => {
      const result = ServicePrice.create('250.75');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe(250.75);
        expect(result.data.formatted).toBe('R$ 250,75');
      }
    });

    it('deve falhar com preço negativo', () => {
      const result = ServicePrice.create(-50);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Preço não pode ser negativo');
      }
    });

    it('deve falhar com preço muito alto', () => {
      const result = ServicePrice.create(1000000);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Preço não pode ser maior que R$ 999.999,99');
      }
    });

    it('deve falhar com string inválida', () => {
      const result = ServicePrice.create('abc');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Preço deve ser um número válido');
      }
    });

    it('deve falhar com NaN', () => {
      const result = ServicePrice.create(NaN);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Preço deve ser um número finito');
      }
    });

    it('deve falhar com Infinity', () => {
      const result = ServicePrice.create(Infinity);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Preço deve ser um número finito');
      }
    });

    it('deve aceitar preço zero', () => {
      const result = ServicePrice.create(0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe(0);
        expect(result.data.formatted).toBe('R$ 0,00');
      }
    });

    it('deve aceitar preço com 2 casas decimais', () => {
      const result = ServicePrice.create(123.45);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe(123.45);
        expect(result.data.formatted).toBe('R$ 123,45');
      }
    });

    it('deve falhar com mais de 2 casas decimais', () => {
      const result = ServicePrice.create(123.4567);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Preço deve ter no máximo 2 casas decimais');
      }
    });
  });

  describe('formatted', () => {
    it('deve formatar corretamente valores inteiros', () => {
      const result = ServicePrice.create(1000);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formatted).toBe('R$ 1.000,00');
      }
    });

    it('deve formatar corretamente valores decimais', () => {
      const result = ServicePrice.create(123.45);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formatted).toBe('R$ 123,45');
      }
    });
  });

  describe('equals', () => {
    it('deve retornar true para preços iguais', () => {
      const result1 = ServicePrice.create(150.5);
      const result2 = ServicePrice.create(150.5);

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.equals(result2.data)).toBe(true);
      }
    });

    it('deve retornar false para preços diferentes', () => {
      const result1 = ServicePrice.create(150.5);
      const result2 = ServicePrice.create(200.0);

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.equals(result2.data)).toBe(false);
      }
    });

    it('deve comparar corretamente preços próximos', () => {
      const result1 = ServicePrice.create(150.5);
      const result2 = ServicePrice.create(150.51);

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.equals(result2.data)).toBe(false); // Diferença de 0.01 deve ser considerada diferente
      }
    });
  });

  describe('comparisons', () => {
    it('isGreaterThan deve funcionar corretamente', () => {
      const result1 = ServicePrice.create(200);
      const result2 = ServicePrice.create(150);

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.isGreaterThan(result2.data)).toBe(true);
        expect(result2.data.isGreaterThan(result1.data)).toBe(false);
      }
    });

    it('isLessThan deve funcionar corretamente', () => {
      const result1 = ServicePrice.create(100);
      const result2 = ServicePrice.create(200);

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.isLessThan(result2.data)).toBe(true);
        expect(result2.data.isLessThan(result1.data)).toBe(false);
      }
    });
  });

  describe('toString', () => {
    it('deve retornar o preço formatado', () => {
      const result = ServicePrice.create(250.75);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toString()).toBe('R$ 250,75');
      }
    });
  });

  describe('toJSON', () => {
    it('deve retornar o valor numérico para JSON', () => {
      const result = ServicePrice.create(150.5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toJSON()).toBe(150.5);
      }
    });
  });

  describe('value getter', () => {
    it('deve retornar o valor numérico interno', () => {
      const result = ServicePrice.create(300.25);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe(300.25);
      }
    });
  });

  describe('imutabilidade', () => {
    it('deve ser imutável após criação', () => {
      const result = ServicePrice.create(150.5);

      expect(result.success).toBe(true);
      if (result.success) {
        const price = result.data;
        const originalValue = price.value;

        // Tentar modificar o valor interno (não deve ser possível)
        expect(() => {
          (price as any)._value = 200;
        }).toThrow();

        expect(price.value).toBe(originalValue);
      }
    });
  });
});
