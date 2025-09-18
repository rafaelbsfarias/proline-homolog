/**
 * Testes unitários para ServiceName Value Object
 */

import { describe, it, expect } from 'vitest';
import { ServiceName } from '../../value-objects/ServiceName';

describe('ServiceName', () => {
  describe('create', () => {
    it('deve criar ServiceName com nome válido', () => {
      const result = ServiceName.create('Troca de Óleo');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(ServiceName);
        expect(result.data.value).toBe('Troca de Óleo');
      }
    });

    it('deve falhar com nome vazio', () => {
      const result = ServiceName.create('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Nome do serviço não pode ser vazio');
      }
    });

    it('deve falhar com nome apenas espaços', () => {
      const result = ServiceName.create('   ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Nome do serviço não pode ser vazio');
      }
    });

    it('deve falhar com nome muito curto', () => {
      const result = ServiceName.create('AB');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Nome do serviço deve ter pelo menos 3 caracteres');
      }
    });

    it('deve falhar com nome muito longo', () => {
      const longName = 'A'.repeat(101);
      const result = ServiceName.create(longName);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Nome do serviço não pode ter mais de 100 caracteres');
      }
    });

    it('deve falhar com caracteres especiais perigosos', () => {
      const dangerousNames = ['Teste<script>', 'Teste"quote', 'Teste|pipe', 'Teste?question'];

      dangerousNames.forEach(name => {
        const result = ServiceName.create(name);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(Error);
          expect(result.error.message).toBe('Nome do serviço contém caracteres inválidos');
        }
      });
    });

    it('deve aceitar nome com espaços internos', () => {
      const result = ServiceName.create('Troca de Óleo Completa');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe('Troca de Óleo Completa');
      }
    });

    it('deve falhar com espaços no início', () => {
      const result = ServiceName.create(' Troca de Óleo');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe(
          'Nome do serviço não pode começar ou terminar com espaços'
        );
      }
    });

    it('deve falhar com espaços no fim', () => {
      const result = ServiceName.create('Troca de Óleo ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe(
          'Nome do serviço não pode começar ou terminar com espaços'
        );
      }
    });
  });

  describe('equals', () => {
    it('deve retornar true para nomes iguais', () => {
      const result1 = ServiceName.create('Troca de Óleo');
      const result2 = ServiceName.create('Troca de Óleo');

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.equals(result2.data)).toBe(true);
      }
    });

    it('deve retornar false para nomes diferentes', () => {
      const result1 = ServiceName.create('Troca de Óleo');
      const result2 = ServiceName.create('Revisão Completa');

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.equals(result2.data)).toBe(false);
      }
    });

    it('deve ser case sensitive', () => {
      const result1 = ServiceName.create('Troca de Óleo');
      const result2 = ServiceName.create('troca de óleo');

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.equals(result2.data)).toBe(false);
      }
    });
  });

  describe('toString', () => {
    it('deve retornar o valor como string', () => {
      const result = ServiceName.create('Troca de Óleo');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toString()).toBe('Troca de Óleo');
      }
    });
  });

  describe('toJSON', () => {
    it('deve retornar o valor para serialização JSON', () => {
      const result = ServiceName.create('Troca de Óleo');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toJSON()).toBe('Troca de Óleo');
      }
    });
  });

  describe('value getter', () => {
    it('deve retornar o valor interno', () => {
      const result = ServiceName.create('Troca de Óleo');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe('Troca de Óleo');
      }
    });
  });

  describe('imutabilidade', () => {
    it('deve ser imutável após criação', () => {
      const result = ServiceName.create('Troca de Óleo');

      expect(result.success).toBe(true);
      if (result.success) {
        const name = result.data;
        const originalValue = name.value;

        // Tentar modificar o valor interno (não deve ser possível)
        expect(() => {
          (name as any)._value = 'Novo Valor';
        }).toThrow();

        expect(name.value).toBe(originalValue);
      }
    });
  });
});
