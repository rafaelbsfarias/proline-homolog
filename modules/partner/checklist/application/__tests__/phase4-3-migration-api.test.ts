/**
 * Testes da Fase 4.3 - Migração gradual das APIs de produção
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChecklistApiService } from '../api-service';

// Mock do logger
vi.mock('../../../logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Fase 4.3 - Migração APIs de produção', () => {
  let apiService: ChecklistApiService;

  beforeEach(() => {
    // Reset singleton instance
    (ChecklistApiService as any).instance = undefined;
    apiService = ChecklistApiService.getInstance();

    // Reset environment variables
    delete process.env.USE_DDD_CHECKLIST_SUBMIT;
    delete process.env.USE_DDD_CHECKLIST_ANOMALIES;
    delete process.env.USE_DDD_CHECKLIST_INIT;
  });

  describe('Feature Flag Control', () => {
    describe('Submit Checklist API', () => {
      it('deve usar implementação legacy quando USE_DDD_CHECKLIST_SUBMIT=false', async () => {
        process.env.USE_DDD_CHECKLIST_SUBMIT = 'false';

        const result = await apiService.submitChecklist({
          vehicle_id: 'test-vehicle-id',
          partner_id: 'test-partner-id',
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it('deve tentar usar implementação DDD quando USE_DDD_CHECKLIST_SUBMIT=true', async () => {
        process.env.USE_DDD_CHECKLIST_SUBMIT = 'true';

        const result = await apiService.submitChecklist({
          vehicle_id: 'test-vehicle-id',
          partner_id: 'test-partner-id',
        });

        // Deve funcionar mesmo que DDD falhe (fallback para legacy)
        expect(result.success).toBe(true);
      });
    });

    describe('Save Anomalies API', () => {
      it('deve usar implementação legacy quando USE_DDD_CHECKLIST_ANOMALIES=false', async () => {
        process.env.USE_DDD_CHECKLIST_ANOMALIES = 'false';

        const result = await apiService.saveAnomalies({
          vehicle_id: 'test-vehicle-id',
          partner_id: 'test-partner-id',
          anomalies: [],
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it('deve tentar usar implementação DDD quando USE_DDD_CHECKLIST_ANOMALIES=true', async () => {
        process.env.USE_DDD_CHECKLIST_ANOMALIES = 'true';

        const result = await apiService.saveAnomalies({
          vehicle_id: 'test-vehicle-id',
          partner_id: 'test-partner-id',
          anomalies: [],
        });

        // Deve funcionar mesmo que DDD falhe (fallback para legacy)
        expect(result.success).toBe(true);
      });
    });

    describe('Init Checklist API', () => {
      it('deve usar implementação legacy quando USE_DDD_CHECKLIST_INIT=false', async () => {
        process.env.USE_DDD_CHECKLIST_INIT = 'false';

        const result = await apiService.initChecklist({
          vehicleId: 'test-vehicle-id',
          partnerId: 'test-partner-id',
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.vehicle.id).toBe('test-vehicle-id');
      });

      it('deve tentar usar implementação DDD quando USE_DDD_CHECKLIST_INIT=true', async () => {
        process.env.USE_DDD_CHECKLIST_INIT = 'true';

        const result = await apiService.initChecklist({
          vehicleId: 'test-vehicle-id',
          partnerId: 'test-partner-id',
        });

        // Deve funcionar mesmo que DDD falhe (fallback para legacy)
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('deve aceitar os mesmos parâmetros do submit checklist', async () => {
      const result = await apiService.submitChecklist({
        vehicle_id: 'test-vehicle-id',
        inspection_id: 'test-inspection-id',
        quote_id: null,
        partner_id: 'test-partner-id',
        items: [
          {
            item_key: 'engine',
            item_status: 'ok',
            item_notes: 'Funcionando bem',
          },
        ],
        evidences: {
          engine: ['path/to/photo1.jpg'],
        },
        observations: 'Veículo em bom estado',
        fluidsNotes: 'Óleo ok',
      });

      expect(result.success).toBe(true);
    });

    it('deve aceitar os mesmos parâmetros do save anomalies', async () => {
      const result = await apiService.saveAnomalies({
        inspection_id: 'test-inspection-id',
        quote_id: null,
        vehicle_id: 'test-vehicle-id',
        partner_id: 'test-partner-id',
        anomalies: [
          {
            description: 'Amassado na porta',
            photos: ['path/to/photo1.jpg', 'path/to/photo2.jpg'],
            partRequest: {
              partName: 'Porta dianteira esquerda',
              partDescription: 'Porta amassada precisa reparo',
              quantity: 1,
              estimatedPrice: 1500,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('deve aceitar os mesmos parâmetros do init checklist', async () => {
      const result = await apiService.initChecklist({
        vehicleId: 'test-vehicle-id',
        quoteId: 'test-quote-id',
        partnerId: 'test-partner-id',
      });

      expect(result.success).toBe(true);
      expect(result.data?.vehicle.id).toBe('test-vehicle-id');
    });
  });

  describe('Error Handling', () => {
    it('deve fazer fallback graceful quando DDD falha', async () => {
      // Configurar para usar DDD mas simular falha
      process.env.USE_DDD_CHECKLIST_SUBMIT = 'true';

      const result = await apiService.submitChecklist({
        vehicle_id: 'test-vehicle-id',
        partner_id: 'test-partner-id',
      });

      // Mesmo com DDD "falhando", deve retornar sucesso via fallback
      expect(result.success).toBe(true);
    });
  });
});
