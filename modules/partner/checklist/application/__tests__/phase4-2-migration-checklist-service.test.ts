/**
 * Fase 4.2 - Migração do ChecklistService.loadChecklistWithDetails()
 * Testa a migração gradual para infraestrutura DDD
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChecklistService } from '../../../services/checklist/ChecklistService';

describe('Fase 4.2 - Migração ChecklistService.loadChecklistWithDetails()', () => {
  let checklistService: ChecklistService;

  beforeEach(() => {
    // Limpar instance singleton
    // @ts-ignore - acesso a propriedade privada para teste
    ChecklistService.instance = undefined;

    // Resetar mocks
    vi.clearAllMocks();
  });

  describe('Feature Flag Control', () => {
    it('deve ter a propriedade USE_DDD_CHECKLIST configurável', async () => {
      // Given
      process.env.USE_DDD_CHECKLIST = 'false';
      checklistService = ChecklistService.getInstance();

      // Then
      // @ts-ignore - acesso a propriedade privada para teste
      expect(checklistService.USE_DDD_CHECKLIST).toBe(false);

      // Given
      process.env.USE_DDD_CHECKLIST = 'true';
      // Limpar instance para recriar com nova configuração
      // @ts-ignore
      ChecklistService.instance = undefined;
      checklistService = ChecklistService.getInstance();

      // Then
      // @ts-ignore
      expect(checklistService.USE_DDD_CHECKLIST).toBe(true);
    });

    it('deve ser capaz de chamar loadChecklistWithDetails sem erros', async () => {
      // Given
      process.env.USE_DDD_CHECKLIST = 'false';
      checklistService = ChecklistService.getInstance();

      // When & Then - deve ser capaz de chamar sem lançar erro
      await expect(
        checklistService.loadChecklistWithDetails('insp-123', 'quote-456', 'partner-789')
      ).resolves.toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('deve retornar um objeto com a estrutura esperada', async () => {
      // Given
      process.env.USE_DDD_CHECKLIST = 'false';
      checklistService = ChecklistService.getInstance();

      // When
      const result = await checklistService.loadChecklistWithDetails(
        'insp-123',
        undefined,
        undefined
      );

      // Then
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('deve aceitar os mesmos parâmetros', async () => {
      // Given
      process.env.USE_DDD_CHECKLIST = 'false';
      checklistService = ChecklistService.getInstance();

      // When & Then - deve aceitar todos os parâmetros sem erro
      await expect(
        checklistService.loadChecklistWithDetails('insp-123', 'quote-456', 'partner-789')
      ).resolves.toBeDefined();

      await expect(
        checklistService.loadChecklistWithDetails(undefined, 'quote-456', undefined)
      ).resolves.toBeDefined();

      await expect(
        checklistService.loadChecklistWithDetails('insp-123', undefined, undefined)
      ).resolves.toBeDefined();
    });
  });
});
