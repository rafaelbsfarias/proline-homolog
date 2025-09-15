/**
 * Testes unitários para ServiceDescription Value Object
 */

import { describe, it, expect } from 'vitest';
import { ServiceDescription } from '../../value-objects/ServiceDescription';

describe('ServiceDescription', () => {
  describe('create', () => {
    it('deve criar ServiceDescription com descrição válida', () => {
      const description =
        'Este serviço inclui troca de óleo, filtros e verificação completa do sistema de lubrificação.';
      const result = ServiceDescription.create(description);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(ServiceDescription);
        expect(result.data.value).toBe(description);
        expect(result.data.length).toBe(description.length);
      }
    });

    it('deve falhar com descrição vazia', () => {
      const result = ServiceDescription.create('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Descrição do serviço não pode ser vazia');
      }
    });

    it('deve falhar com descrição apenas espaços', () => {
      const result = ServiceDescription.create('   ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Descrição do serviço não pode ser vazia');
      }
    });

    it('deve falhar com descrição muito curta', () => {
      const result = ServiceDescription.create('ABC');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Descrição do serviço deve ter pelo menos 10 caracteres');
      }
    });

    it('deve falhar com descrição muito longa', () => {
      const longDescription = 'A'.repeat(1001);
      const result = ServiceDescription.create(longDescription);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe(
          'Descrição do serviço não pode ter mais de 1000 caracteres'
        );
      }
    });

    it('deve aceitar descrição no limite máximo', () => {
      const maxDescription = 'A'.repeat(1000);
      const result = ServiceDescription.create(maxDescription);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(1000);
      }
    });

    it('deve aceitar descrição com espaços internos', () => {
      const result = ServiceDescription.create(
        'Esta é uma descrição completa do serviço oferecido pela oficina'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe(
          'Esta é uma descrição completa do serviço oferecido pela oficina'
        );
      }
    });

    it('deve falhar com espaços no início', () => {
      const result = ServiceDescription.create(' Descrição do serviço');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe(
          'Descrição do serviço não pode começar ou terminar com espaços'
        );
      }
    });

    it('deve falhar com espaços no fim', () => {
      const result = ServiceDescription.create('Descrição do serviço ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe(
          'Descrição do serviço não pode começar ou terminar com espaços'
        );
      }
    });

    it('deve falhar com caracteres de controle', () => {
      const result = ServiceDescription.create('Descrição com\x00caractere de controle');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe(
          'Descrição do serviço contém caracteres de controle inválidos'
        );
      }
    });
  });

  describe('summary', () => {
    it('deve retornar resumo para descrições longas', () => {
      const longDescription = 'A'.repeat(150);
      const result = ServiceDescription.create(longDescription);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary).toBe('A'.repeat(97) + '...');
        expect(result.data.summary.length).toBe(100);
      }
    });

    it('deve retornar descrição completa para textos curtos', () => {
      const shortDescription = 'Descrição curta do serviço';
      const result = ServiceDescription.create(shortDescription);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary).toBe(shortDescription);
      }
    });
  });

  describe('length', () => {
    it('deve retornar o comprimento correto da descrição', () => {
      const description = 'Descrição de teste';
      const result = ServiceDescription.create(description);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(description.length);
      }
    });
  });

  describe('equals', () => {
    it('deve retornar true para descrições iguais', () => {
      const description = 'Descrição de teste para comparação';
      const result1 = ServiceDescription.create(description);
      const result2 = ServiceDescription.create(description);

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.equals(result2.data)).toBe(true);
      }
    });

    it('deve retornar false para descrições diferentes', () => {
      const result1 = ServiceDescription.create('Primeira descrição');
      const result2 = ServiceDescription.create('Segunda descrição');

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.equals(result2.data)).toBe(false);
      }
    });

    it('deve ser case sensitive', () => {
      const result1 = ServiceDescription.create('Descrição de Teste');
      const result2 = ServiceDescription.create('descrição de teste');

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.equals(result2.data)).toBe(false);
      }
    });
  });

  describe('contains', () => {
    it('deve encontrar palavra-chave existente', () => {
      const description = 'Este serviço inclui manutenção preventiva completa';
      const result = ServiceDescription.create(description);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contains('manutenção')).toBe(true);
        expect(result.data.contains('preventiva')).toBe(true);
      }
    });

    it('deve retornar false para palavra-chave inexistente', () => {
      const description = 'Este serviço inclui manutenção preventiva completa';
      const result = ServiceDescription.create(description);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contains('inexistente')).toBe(false);
      }
    });

    it('deve ser case insensitive', () => {
      const description = 'Este serviço inclui Manutenção Preventiva completa';
      const result = ServiceDescription.create(description);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contains('manutenção')).toBe(true);
        expect(result.data.contains('MANUTENÇÃO')).toBe(true);
      }
    });
  });

  describe('toString', () => {
    it('deve retornar o valor como string', () => {
      const description = 'Descrição para teste de toString';
      const result = ServiceDescription.create(description);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toString()).toBe(description);
      }
    });
  });

  describe('toJSON', () => {
    it('deve retornar o valor para serialização JSON', () => {
      const description = 'Descrição para teste de JSON';
      const result = ServiceDescription.create(description);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toJSON()).toBe(description);
      }
    });
  });

  describe('value getter', () => {
    it('deve retornar o valor interno', () => {
      const description = 'Descrição para teste do getter';
      const result = ServiceDescription.create(description);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe(description);
      }
    });
  });

  describe('imutabilidade', () => {
    it('deve ser imutável após criação', () => {
      const description = 'Descrição original para teste de imutabilidade';
      const result = ServiceDescription.create(description);

      expect(result.success).toBe(true);
      if (result.success) {
        const desc = result.data;
        const originalValue = desc.value;

        // Tentar modificar o valor interno (não deve ser possível)
        expect(() => {
          (desc as any)._value = 'Nova descrição';
        }).toThrow();

        expect(desc.value).toBe(originalValue);
      }
    });
  });
});
