/**
 * Testes unitários para SupabasePartnerServiceRepository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabasePartnerServiceRepository } from '../../repositories/SupabasePartnerServiceRepository';
import { PartnerService } from '../../entities/PartnerService';

// Mock do Supabase
const mockSupabaseClient = {
  from: vi.fn(),
};

// Mock do SupabaseService
const mockSupabaseService: any = {
  getClient: vi.fn().mockReturnValue(mockSupabaseClient),
};

describe('SupabasePartnerServiceRepository', () => {
  let repository: SupabasePartnerServiceRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks to their initial state
    mockSupabaseClient.from.mockReset();
    mockSupabaseService.getClient.mockReset();
    mockSupabaseService.getClient.mockReturnValue(mockSupabaseClient);
    repository = new SupabasePartnerServiceRepository(mockSupabaseService);
  });

  describe('findById', () => {
    it('deve retornar serviço quando encontrado', async () => {
      const mockData = {
        id: 'service-123',
        name: 'Troca de Óleo',
        price: 150.5,
        description: 'Serviço completo de troca de óleo',
        partner_id: 'partner-456',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_active: true,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      const result = await repository.findById('service-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('service-123');
      expect(result?.name.value).toBe('Troca de Óleo');
    });

    it('deve retornar null quando serviço não encontrado', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('deve retornar null quando ocorre erro', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'SOME_ERROR', message: 'Database error' },
            }),
          }),
        }),
      });

      const result = await repository.findById('service-123');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de serviços', async () => {
      const mockData = [
        {
          id: 'service-1',
          name: 'Troca de Óleo',
          price: 150.5,
          description: 'Serviço completo',
          partner_id: 'partner-456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_active: true,
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('service-1');
    });

    it('deve retornar lista vazia quando ocorre erro', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
        }),
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('deve salvar serviço com sucesso', async () => {
      const reconstructResult = PartnerService.reconstruct({
        id: 'service-123',
        partnerId: 'partner-456',
        name: 'Troca de Óleo',
        description: 'Serviço completo de troca de óleo',
        price: 150.5,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        isActive: true,
      });

      const mockService = reconstructResult.success
        ? reconstructResult.data
        : (() => {
            const createResult = PartnerService.create(
              'service-123',
              'Troca de Óleo',
              150.5,
              'Serviço completo',
              'partner-456'
            );
            if (!createResult.success) {
              throw new Error('Falha ao criar PartnerService para teste');
            }
            return createResult.data;
          })();

      expect(mockService).not.toBeNull();

      const mockData = {
        id: 'service-123',
        name: 'Troca de Óleo',
        price: 150.5,
        description: 'Serviço completo de troca de óleo',
        partner_id: 'partner-456',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_active: true,
      };

      mockSupabaseClient.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      const result = await repository.save(mockService);

      expect(result).not.toBeNull();
      expect(result.id).toBe('service-123');
    });

    it('deve lançar erro quando falha ao salvar', async () => {
      const createResult = PartnerService.create(
        'service-123',
        'Troca de Óleo',
        150.5,
        'Serviço completo',
        'partner-456'
      );
      if (!createResult.success) {
        throw new Error('Falha ao criar PartnerService para teste');
      }
      const mockService = createResult.data;

      mockSupabaseClient.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      await expect(repository.save(mockService)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deve deletar serviço com sucesso', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(repository.delete('service-123')).resolves.toBeUndefined();
    });

    it('deve lançar erro quando falha ao deletar', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Delete error' } }),
        }),
      });

      await expect(repository.delete('service-123')).rejects.toThrow();
    });
  });

  describe('findByPartnerId', () => {
    it('deve retornar serviços do parceiro', async () => {
      const mockData = [
        {
          id: 'service-1',
          name: 'Troca de Óleo',
          price: 150.5,
          description: 'Serviço completo',
          partner_id: 'partner-456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_active: true,
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      const result = await repository.findByPartnerId('partner-456');

      expect(result).toHaveLength(1);
      expect(result[0].partnerId).toBe('partner-456');
    });
  });

  describe('findActiveByPartnerId', () => {
    it('deve retornar apenas serviços ativos do parceiro', async () => {
      const mockData = [
        {
          id: 'service-1',
          name: 'Troca de Óleo',
          price: 150.5,
          description: 'Serviço completo',
          partner_id: 'partner-456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_active: true,
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
            }),
          }),
        }),
      });

      const result = await repository.findActiveByPartnerId('partner-456');

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });
  });

  describe('findByName', () => {
    it('deve buscar serviços por nome', async () => {
      const mockData = [
        {
          id: 'service-1',
          name: 'Troca de Óleo',
          price: 150.5,
          description: 'Serviço completo',
          partner_id: 'partner-456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_active: true,
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      const result = await repository.findByName('Troca');

      expect(result).toHaveLength(1);
      expect(result[0].name.value).toContain('Troca');
    });
  });

  describe('countByPartnerId', () => {
    it('deve contar serviços do parceiro', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      });

      const result = await repository.countByPartnerId('partner-456');

      expect(result).toBe(5);
    });

    it('deve retornar 0 quando ocorre erro', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Database error' } }),
        }),
      });

      const result = await repository.countByPartnerId('partner-456');

      expect(result).toBe(0);
    });
  });

  describe('existsByNameForPartner', () => {
    it('deve retornar true quando serviço existe', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [{ id: 'service-1' }], error: null }),
            }),
            limit: vi.fn().mockResolvedValue({ data: [{ id: 'service-1' }], error: null }),
          }),
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const result = await repository.existsByNameForPartner('partner-456', 'Troca de Óleo');

      expect(result).toBe(true);
    });

    it('deve retornar false quando serviço não existe', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const result = await repository.existsByNameForPartner('partner-456', 'Serviço Inexistente');

      expect(result).toBe(false);
    });
  });

  describe('deactivateAllByPartnerId', () => {
    it('deve desativar serviços com sucesso', async () => {
      const mockData = [{ id: 'service-1' }, { id: 'service-2' }];
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      const result = await repository.deactivateAllByPartnerId('partner-456');

      expect(result).toBe(2);
    });

    it('deve retornar 0 quando ocorre erro', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
          }),
        }),
      });

      const result = await repository.deactivateAllByPartnerId('partner-456');

      expect(result).toBe(0);
    });
  });

  describe('findWithPagination', () => {
    it('deve retornar serviços paginados', async () => {
      const mockData = [
        {
          id: 'service-1',
          name: 'Troca de Óleo',
          price: 150.5,
          description: 'Serviço completo',
          partner_id: 'partner-456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_active: true,
        },
      ];

      const mockQuery = {
        range: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockData, error: null, count: 1 }),
        }),
        eq: vi.fn().mockReturnThis(),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const result = await repository.findWithPagination({
        page: 1,
        limit: 10,
        partnerId: 'partner-456',
      });

      expect(result.services).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('deve retornar resultado vazio quando ocorre erro', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi
              .fn()
              .mockResolvedValue({ data: null, error: { message: 'Database error' }, count: null }),
          }),
        }),
      });

      const result = await repository.findWithPagination({
        page: 1,
        limit: 10,
      });

      expect(result.services).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });
});
