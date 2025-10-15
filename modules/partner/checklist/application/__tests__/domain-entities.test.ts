/**
 * Testes unitários para PartnerService Aggregate Root
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PartnerService } from '../../../domain/entities/PartnerService';

describe('PartnerService', () => {
  const validServiceData = {
    id: 'service-123',
    name: 'Troca de Óleo',
    price: 150.5,
    description: 'Serviço completo de troca de óleo do motor com filtros e verificação de níveis',
    partnerId: 'partner-456',
  };

  describe('create', () => {
    it('deve criar PartnerService com dados válidos', () => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validServiceData.id);
        expect(result.data.partnerId).toBe(validServiceData.partnerId);
        expect(result.data.name.value).toBe(validServiceData.name);
        expect(result.data.price.value).toBe(validServiceData.price);
        expect(result.data.description.value).toBe(validServiceData.description);
        expect(result.data.isActive).toBe(true);
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('deve falhar com ID vazio', () => {
      const result = PartnerService.create(
        '',
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('ID do serviço não pode ser vazio');
      }
    });

    it('deve falhar com partner ID vazio', () => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        ''
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('ID do parceiro não pode ser vazio');
      }
    });

    it('deve falhar com nome inválido', () => {
      const result = PartnerService.create(
        validServiceData.id,
        '', // nome vazio
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Nome do serviço não pode ser vazio');
      }
    });

    it('deve falhar com preço inválido', () => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        -50, // preço negativo
        validServiceData.description,
        validServiceData.partnerId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Preço não pode ser negativo');
      }
    });

    it('deve falhar com descrição inválida', () => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        'ABC', // descrição muito curta
        validServiceData.partnerId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Descrição do serviço deve ter pelo menos 10 caracteres');
      }
    });
  });

  describe('reconstruct', () => {
    it('deve reconstruir PartnerService a partir de dados persistidos', () => {
      const persistedData = {
        id: validServiceData.id,
        name: validServiceData.name,
        price: validServiceData.price,
        description: validServiceData.description,
        partnerId: validServiceData.partnerId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        isActive: false,
      };

      const result = PartnerService.reconstruct(persistedData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(persistedData.id);
        expect(result.data.isActive).toBe(false);
        expect(result.data.createdAt).toEqual(persistedData.createdAt);
        expect(result.data.updatedAt).toEqual(persistedData.updatedAt);
      }
    });
  });

  describe('updateName', () => {
    let service: PartnerService;

    beforeEach(() => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );
      service = result.success ? result.data : null!;
    });

    it('deve atualizar nome com sucesso', () => {
      const newName = 'Troca de Óleo Premium';
      const result = service.updateName(newName);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name.value).toBe(newName);
        expect(result.data.id).toBe(service.id); // ID permanece o mesmo
        expect(result.data.updatedAt.getTime()).toBeGreaterThan(service.updatedAt.getTime());
      }
    });

    it('deve falhar com nome inválido', () => {
      const result = service.updateName('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Nome do serviço não pode ser vazio');
      }
    });
  });

  describe('updatePrice', () => {
    let service: PartnerService;

    beforeEach(() => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );
      service = result.success ? result.data : null!;
    });

    it('deve atualizar preço com sucesso', () => {
      const newPrice = 200.75;
      const result = service.updatePrice(newPrice);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price.value).toBe(newPrice);
        expect(result.data.updatedAt.getTime()).toBeGreaterThan(service.updatedAt.getTime());
      }
    });

    it('deve falhar com preço inválido', () => {
      const result = service.updatePrice(-100);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Preço não pode ser negativo');
      }
    });
  });

  describe('updateDescription', () => {
    let service: PartnerService;

    beforeEach(() => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );
      service = result.success ? result.data : null!;
    });

    it('deve atualizar descrição com sucesso', () => {
      const newDescription = 'Serviço premium de troca de óleo com produtos de alta qualidade';
      const result = service.updateDescription(newDescription);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description.value).toBe(newDescription);
        expect(result.data.updatedAt.getTime()).toBeGreaterThan(service.updatedAt.getTime());
      }
    });
  });

  describe('updateMultiple', () => {
    let service: PartnerService;

    beforeEach(() => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );
      service = result.success ? result.data : null!;
    });

    it('deve atualizar múltiplas propriedades com sucesso', () => {
      const updates = {
        name: 'Troca de Óleo Premium',
        price: 250.0,
        description: 'Serviço completo e premium de troca de óleo',
      };

      const result = service.updateMultiple(updates);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name.value).toBe(updates.name);
        expect(result.data.price.value).toBe(updates.price);
        expect(result.data.description.value).toBe(updates.description);
      }
    });

    it('deve atualizar apenas propriedades fornecidas', () => {
      const updates = {
        name: 'Novo Nome',
      };

      const result = service.updateMultiple(updates);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name.value).toBe(updates.name);
        expect(result.data.price.value).toBe(service.price.value); // permanece igual
        expect(result.data.description.value).toBe(service.description.value); // permanece igual
      }
    });

    it('deve falhar se alguma propriedade for inválida', () => {
      const updates = {
        name: 'Novo Nome',
        price: -100, // preço inválido
      };

      const result = service.updateMultiple(updates);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Preço não pode ser negativo');
      }
    });
  });

  describe('deactivate/reactivate', () => {
    let service: PartnerService;

    beforeEach(() => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );
      service = result.success ? result.data : null!;
    });

    it('deve desativar serviço', () => {
      const deactivated = service.deactivate();

      expect(deactivated.isActive).toBe(false);
      expect(deactivated.id).toBe(service.id);
    });

    it('deve reativar serviço', () => {
      const deactivated = service.deactivate();
      const reactivated = deactivated.reactivate();

      expect(reactivated.isActive).toBe(true);
      expect(reactivated.id).toBe(service.id);
    });
  });

  describe('business logic methods', () => {
    let service: PartnerService;

    beforeEach(() => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );
      service = result.success ? result.data : null!;
    });

    it('canBeOffered deve retornar true para serviço ativo', () => {
      expect(service.canBeOffered()).toBe(true);
    });

    it('canBeOffered deve retornar false para serviço inativo', () => {
      const deactivated = service.deactivate();
      expect(deactivated.canBeOffered()).toBe(false);
    });

    it('belongsToPartner deve funcionar corretamente', () => {
      expect(service.belongsToPartner(validServiceData.partnerId)).toBe(true);
      expect(service.belongsToPartner('different-partner')).toBe(false);
    });

    it('nameContains deve funcionar corretamente', () => {
      expect(service.nameContains('óleo')).toBe(true);
      expect(service.nameContains('ÓLEO')).toBe(true); // case insensitive
      expect(service.nameContains('freio')).toBe(false);
    });

    it('descriptionContains deve funcionar corretamente', () => {
      expect(service.descriptionContains('motor')).toBe(true);
      expect(service.descriptionContains('MOTOR')).toBe(true); // case insensitive
      expect(service.descriptionContains('pneu')).toBe(false);
    });

    it('isPriceInRange deve funcionar corretamente', () => {
      expect(service.isPriceInRange(100, 200)).toBe(true);
      expect(service.isPriceInRange(200, 300)).toBe(false);
      expect(service.isPriceInRange(50, 100)).toBe(false);
    });

    it('calculateDiscountedPrice deve calcular desconto corretamente', () => {
      const result = service.calculateDiscountedPrice(20); // 20% desconto

      expect(result.success).toBe(true);
      if (result.success) {
        const expectedPrice = validServiceData.price * 0.8; // 150.50 * 0.8 = 120.40
        expect(result.data.value).toBe(expectedPrice);
      }
    });

    it('calculateDiscountedPrice deve falhar com percentual inválido', () => {
      const result = service.calculateDiscountedPrice(150); // desconto > 100%

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Percentual de desconto deve estar entre 0 e 100');
      }
    });
  });

  describe('toJSON', () => {
    let service: PartnerService;

    beforeEach(() => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );
      service = result.success ? result.data : null!;
    });

    it('deve retornar representação JSON correta', () => {
      const json = service.toJSON();

      expect(json).toEqual({
        id: validServiceData.id,
        name: validServiceData.name,
        price: validServiceData.price,
        formattedPrice: 'R$ 150,50',
        description: validServiceData.description,
        descriptionSummary: validServiceData.description,
        partnerId: validServiceData.partnerId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        isActive: true,
      });
    });
  });

  describe('equals', () => {
    it('deve retornar true para serviços com mesmo ID', () => {
      const result1 = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );

      const result2 = PartnerService.create(
        validServiceData.id,
        'Outro Nome',
        200,
        'Outra descrição válida com pelo menos 10 caracteres',
        validServiceData.partnerId
      );

      if (result1.success && result2.success) {
        expect(result1.data.equals(result2.data)).toBe(true);
      }
    });

    it('deve retornar false para serviços com IDs diferentes', () => {
      const result1 = PartnerService.create(
        'service-1',
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );

      const result2 = PartnerService.create(
        'service-2',
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );

      if (result1.success && result2.success) {
        expect(result1.data.equals(result2.data)).toBe(false);
      }
    });
  });

  describe('imutabilidade', () => {
    let service: PartnerService;

    beforeEach(() => {
      const result = PartnerService.create(
        validServiceData.id,
        validServiceData.name,
        validServiceData.price,
        validServiceData.description,
        validServiceData.partnerId
      );
      service = result.success ? result.data : null!;
    });

    it('deve ser imutável após criação', () => {
      const originalId = service.id;
      const originalPartnerId = service.partnerId;
      const originalCreatedAt = service.createdAt.getTime();

      // Tentar modificar propriedades (não deve ser possível)
      expect(() => {
        (service as any)._id = 'new-id';
      }).toThrow();

      expect(() => {
        (service as any)._partnerId = 'new-partner';
      }).toThrow();

      expect(service.id).toBe(originalId);
      expect(service.partnerId).toBe(originalPartnerId);
      expect(service.createdAt.getTime()).toBe(originalCreatedAt);
    });
  });
});
