/**
 * Testes unitários para PartnerServiceApplicationServiceImpl
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PartnerServiceApplicationServiceImpl } from '../../services/PartnerServiceApplicationServiceImpl';
import type { PartnerService } from '../../../entities/PartnerService';

// Mock do PartnerService
vi.mock('../../../entities/PartnerService', () => ({
  PartnerService: {
    create: vi.fn(),
  },
}));

// Mock do repositório
const mockRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  delete: vi.fn(),
  findByPartnerId: vi.fn(),
  findActiveByPartnerId: vi.fn(),
  findByName: vi.fn(),
  findByPriceRange: vi.fn(),
  findByDescriptionKeyword: vi.fn(),
  countByPartnerId: vi.fn(),
  existsByNameForPartner: vi.fn(),
  deactivateAllByPartnerId: vi.fn(),
  findWithPagination: vi.fn(),
};

// Mock do logger
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock do getLogger
vi.mock('@/modules/logger', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

describe('PartnerServiceApplicationServiceImpl', () => {
  let service: PartnerServiceApplicationServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PartnerServiceApplicationServiceImpl(mockRepository);
  });

  describe('createService', () => {
    it('deve criar serviço com sucesso', async () => {
      const command = {
        partnerId: 'partner-123',
        name: 'Troca de Óleo',
        price: 150.5,
        description: 'Serviço completo de troca de óleo',
      };

      const mockService = {
        id: 'service-456',
        partnerId: 'partner-123',
        name: { value: 'Troca de Óleo' },
        price: { value: 150.5 },
        description: { value: 'Serviço completo de troca de óleo' },
        isActive: true,
      } as PartnerService;

      // Mock do PartnerService.create
      const { PartnerService } = await import('../../../entities/PartnerService');
      const mockCreate = vi.mocked(PartnerService.create);
      mockCreate.mockReturnValue({
        success: true,
        data: mockService,
      });

      mockRepository.existsByNameForPartner.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(mockService);

      const result = await service.createService(command);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockService);
      }
      expect(mockRepository.existsByNameForPartner).toHaveBeenCalledWith(
        'partner-123',
        'Troca de Óleo'
      );
      expect(mockRepository.save).toHaveBeenCalledWith(mockService);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Serviço criado com sucesso',
        expect.objectContaining({
          serviceId: 'service-456',
          partnerId: 'partner-123',
          name: 'Troca de Óleo',
        })
      );
    });

    it('deve falhar ao tentar criar serviço com nome duplicado', async () => {
      const command = {
        partnerId: 'partner-123',
        name: 'Troca de Óleo',
        price: 150.5,
      };

      mockRepository.existsByNameForPartner.mockResolvedValue(true);

      const result = await service.createService(command);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Já existe um serviço com o nome');
      }
      expect(mockRepository.existsByNameForPartner).toHaveBeenCalledWith(
        'partner-123',
        'Troca de Óleo'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('deve falhar quando validação do serviço falha', async () => {
      const command = {
        partnerId: 'partner-123',
        name: '',
        price: 150.5,
      };

      // Mock do PartnerService.create
      const { PartnerService } = await import('../../../entities/PartnerService');
      const mockCreate = vi.mocked(PartnerService.create);
      mockCreate.mockReturnValue({
        success: false,
        error: new Error('Nome do serviço não pode ser vazio'),
      });
      mockRepository.existsByNameForPartner.mockResolvedValue(false);

      const result = await service.createService(command);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Nome do serviço não pode ser vazio');
      }
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateService', () => {
    it('deve atualizar serviço com sucesso', async () => {
      const command = {
        id: 'service-123',
        name: 'Troca de Óleo Premium',
        price: 200.0,
      };

      const existingService = {
        id: 'service-123',
        partnerId: 'partner-456',
        name: { value: 'Troca de Óleo' },
        price: { value: 150.5 },
        isActive: true,
        updateMultiple: vi.fn().mockReturnValue({
          success: true,
          data: {
            id: 'service-123',
            partnerId: 'partner-456',
            name: { value: 'Troca de Óleo Premium' },
            price: { value: 200.0 },
            isActive: true,
          },
        }),
      } as any;

      mockRepository.findById.mockResolvedValue(existingService);
      mockRepository.existsByNameForPartner.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(existingService);

      const result = await service.updateService(command);

      expect(result.success).toBe(true);
      expect(existingService.updateMultiple).toHaveBeenCalledWith({
        name: 'Troca de Óleo Premium',
        price: 200.0,
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('deve falhar quando serviço não existe', async () => {
      const command = {
        id: 'non-existent',
        name: 'Novo Nome',
      };

      mockRepository.findById.mockResolvedValue(null);

      const result = await service.updateService(command);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Serviço com ID "non-existent" não foi encontrado');
      }
    });

    it('deve falhar quando nome já existe para outro serviço do mesmo parceiro', async () => {
      const command = {
        id: 'service-123',
        name: 'Nome Existente',
      };

      const existingService = {
        id: 'service-123',
        partnerId: 'partner-456',
        name: { value: 'Nome Antigo' },
        isActive: true,
      } as any;

      mockRepository.findById.mockResolvedValue(existingService);
      mockRepository.existsByNameForPartner.mockResolvedValue(true);

      const result = await service.updateService(command);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Já existe um serviço com o nome');
      }
    });
  });

  describe('deactivateService', () => {
    it('deve desativar serviço com sucesso', async () => {
      const existingService = {
        id: 'service-123',
        partnerId: 'partner-456',
        isActive: true,
        deactivate: vi.fn().mockReturnValue({
          id: 'service-123',
          partnerId: 'partner-456',
          isActive: false,
        }),
      } as any;

      mockRepository.findById.mockResolvedValue(existingService);
      mockRepository.save.mockResolvedValue(existingService);

      const result = await service.deactivateService('service-123');

      expect(result.success).toBe(true);
      expect(existingService.deactivate).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('deve falhar quando serviço já está desativado', async () => {
      const existingService = {
        id: 'service-123',
        partnerId: 'partner-456',
        isActive: false,
      } as any;

      mockRepository.findById.mockResolvedValue(existingService);

      const result = await service.deactivateService('service-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Serviço com ID "service-123" já está desativado');
      }
    });
  });

  describe('activateService', () => {
    it('deve reativar serviço com sucesso', async () => {
      const existingService = {
        id: 'service-123',
        partnerId: 'partner-456',
        isActive: false,
        reactivate: vi.fn().mockReturnValue({
          id: 'service-123',
          partnerId: 'partner-456',
          isActive: true,
        }),
      } as any;

      mockRepository.findById.mockResolvedValue(existingService);
      mockRepository.save.mockResolvedValue(existingService);

      const result = await service.activateService('service-123');

      expect(result.success).toBe(true);
      expect(existingService.reactivate).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('deve falhar quando serviço já está ativo', async () => {
      const existingService = {
        id: 'service-123',
        partnerId: 'partner-456',
        isActive: true,
      } as any;

      mockRepository.findById.mockResolvedValue(existingService);

      const result = await service.activateService('service-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Serviço com ID "service-123" já está ativo');
      }
    });
  });

  describe('getServiceById', () => {
    it('deve retornar serviço quando encontrado', async () => {
      const mockService = {
        id: 'service-123',
        partnerId: 'partner-456',
      } as PartnerService;

      mockRepository.findById.mockResolvedValue(mockService);

      const result = await service.getServiceById('service-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockService);
      }
    });

    it('deve retornar null quando serviço não encontrado', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.getServiceById('non-existent');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('getServicesByPartner', () => {
    it('deve retornar serviços paginados do parceiro', async () => {
      const mockResult = {
        services: [
          { id: 'service-1', partnerId: 'partner-123' },
          { id: 'service-2', partnerId: 'partner-123' },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockRepository.findWithPagination.mockResolvedValue(mockResult);

      const result = await service.getServicesByPartner('partner-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockResult);
      }
      expect(mockRepository.findWithPagination).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        partnerId: 'partner-123',
      });
    });
  });

  describe('searchServicesByName', () => {
    it('deve buscar serviços por nome sem filtro de parceiro', async () => {
      const mockServices = [
        { id: 'service-1', name: { value: 'Troca de Óleo' } },
        { id: 'service-2', name: { value: 'Troca de Pneus' } },
      ] as PartnerService[];

      mockRepository.findByName.mockResolvedValue(mockServices);

      const result = await service.searchServicesByName('Troca');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockServices);
      }
      expect(mockRepository.findByName).toHaveBeenCalledWith('Troca');
    });

    it('deve buscar serviços por nome com filtro de parceiro', async () => {
      const mockServices = [
        { id: 'service-1', name: { value: 'Troca de Óleo' }, partnerId: 'partner-123' },
      ] as PartnerService[];

      mockRepository.findByPartnerId.mockResolvedValue(mockServices);

      const result = await service.searchServicesByName('Troca', 'partner-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
      expect(mockRepository.findByPartnerId).toHaveBeenCalledWith('partner-123');
    });
  });

  describe('validateServiceNameUniqueness', () => {
    it('deve retornar true quando nome é único', async () => {
      mockRepository.existsByNameForPartner.mockResolvedValue(false);

      const result = await service.validateServiceNameUniqueness('partner-123', 'Nome Único');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('deve retornar false quando nome já existe', async () => {
      mockRepository.existsByNameForPartner.mockResolvedValue(true);

      const result = await service.validateServiceNameUniqueness('partner-123', 'Nome Existente');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('deve excluir serviço específico da validação quando informado', async () => {
      mockRepository.existsByNameForPartner.mockResolvedValue(false);

      await service.validateServiceNameUniqueness('partner-123', 'Nome do Serviço', 'service-456');

      expect(mockRepository.existsByNameForPartner).toHaveBeenCalledWith(
        'partner-123',
        'Nome do Serviço',
        'service-456'
      );
    });
  });

  describe('deactivateAllServices', () => {
    it('deve desativar todos os serviços do parceiro', async () => {
      mockRepository.deactivateAllByPartnerId.mockResolvedValue(5);

      const result = await service.deactivateAllServices('partner-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(5);
      }
      expect(mockRepository.deactivateAllByPartnerId).toHaveBeenCalledWith('partner-123');
    });
  });

  describe('countActiveServices', () => {
    it('deve contar serviços ativos do parceiro', async () => {
      const mockServices = [
        { id: 'service-1', isActive: true },
        { id: 'service-2', isActive: true },
        { id: 'service-3', isActive: false },
      ] as PartnerService[];

      mockRepository.findActiveByPartnerId.mockResolvedValue([mockServices[0], mockServices[1]]); // Apenas os 2 ativos

      const result = await service.countActiveServices('partner-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(2);
      }
    });
  });
});
