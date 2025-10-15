/**
 * Teste da Fase 3 - Infraestrutura Real
 * Valida que as implementações reais estão estruturadas corretamente
 */

import { describe, it, expect, vi } from 'vitest';

// Mock das dependências do Supabase para evitar problemas de import
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({})),
}));

describe('Fase 3 - Infraestrutura Real', () => {
  describe('Estrutura dos arquivos', () => {
    it('deve ter os arquivos de infraestrutura criados', async () => {
      // Testa que os arquivos existem e podem ser importados
      const { realInfrastructure } = await import('../../infrastructure/real-config');
      const { checklistApplicationService } = await import('../real-services');

      expect(realInfrastructure).toBeDefined();
      expect(checklistApplicationService).toBeDefined();
    });

    it('deve ter as classes de repositório exportadas', async () => {
      const {
        SupabaseChecklistRepository,
        SupabaseChecklistItemRepository,
        SupabaseEvidenceRepository,
      } = await import('../../infrastructure/real-repositories');

      expect(SupabaseChecklistRepository).toBeDefined();
      expect(SupabaseChecklistItemRepository).toBeDefined();
      expect(SupabaseEvidenceRepository).toBeDefined();

      // Verifica que são construtores
      expect(typeof SupabaseChecklistRepository).toBe('function');
      expect(typeof SupabaseChecklistItemRepository).toBe('function');
      expect(typeof SupabaseEvidenceRepository).toBe('function');
    });

    it('deve ter as classes de serviço exportadas', async () => {
      const {
        SupabaseStorageSigner,
        SupabaseStorageUploader,
        SupabaseTimelinePublisher,
        SupabaseVehicleStatusWriter,
      } = await import('../../infrastructure/real-services');

      expect(SupabaseStorageSigner).toBeDefined();
      expect(SupabaseStorageUploader).toBeDefined();
      expect(SupabaseTimelinePublisher).toBeDefined();
      expect(SupabaseVehicleStatusWriter).toBeDefined();

      // Verifica que são construtores
      expect(typeof SupabaseStorageSigner).toBe('function');
      expect(typeof SupabaseStorageUploader).toBe('function');
      expect(typeof SupabaseTimelinePublisher).toBe('function');
      expect(typeof SupabaseVehicleStatusWriter).toBe('function');
    });
  });

  describe('Configuração da infraestrutura', () => {
    it('deve exportar a configuração completa', async () => {
      const { realInfrastructure } = await import('../../infrastructure/real-config');

      expect(realInfrastructure.repositories).toBeDefined();
      expect(realInfrastructure.services).toBeDefined();

      expect(realInfrastructure.repositories.checklist).toBeDefined();
      expect(realInfrastructure.repositories.checklistItem).toBeDefined();
      expect(realInfrastructure.repositories.evidence).toBeDefined();

      expect(realInfrastructure.services.storageSigner).toBeDefined();
      expect(realInfrastructure.services.storageUploader).toBeDefined();
      expect(realInfrastructure.services.timelinePublisher).toBeDefined();
      expect(realInfrastructure.services.vehicleStatusWriter).toBeDefined();
    });
  });
});
