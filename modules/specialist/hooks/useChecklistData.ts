import { useState, useCallback } from 'react';
import { VehicleInfo } from '../checklist/types';
import { ChecklistService, ServiceCategory, ChecklistData } from '../services/ChecklistService';
import { ImageService, SignedUrlResult } from '../services/ImageService';

export interface ChecklistDataState {
  checklistData: ChecklistData | null;
  serviceCategories: ServiceCategory[];
  existingImages: SignedUrlResult[];
  isLoading: boolean;
  error: string | null;
}

export interface ChecklistDataHook {
  state: ChecklistDataState;
  loadData: (vehicle: VehicleInfo) => Promise<void>;
  resetData: () => void;
}

/**
 * Hook personalizado para gerenciar carregamento de dados do checklist
 * Centraliza carregamento de checklist existente, categorias e imagens
 * Implementa responsabilidade única para operações de carregamento de dados
 */
export const useChecklistData = (): ChecklistDataHook => {
  const [state, setState] = useState<ChecklistDataState>({
    checklistData: null,
    serviceCategories: [],
    existingImages: [],
    isLoading: false,
    error: null,
  });

  const checklistService = new ChecklistService();
  const imageService = new ImageService();

  /**
   * Reseta todos os dados carregados
   */
  const resetData = useCallback(() => {
    setState({
      checklistData: null,
      serviceCategories: [],
      existingImages: [],
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * Carrega todos os dados necessários para o checklist
   * Inclui checklist existente, categorias de serviço e imagens
   */
  const loadData = useCallback(async (vehicle: VehicleInfo): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Carregar categorias de serviço e dados do checklist em paralelo
      const [categoriesResult, checklistResult] = await Promise.allSettled([
        checklistService.getServiceCategories(),
        checklistService.loadChecklist(vehicle.id),
      ]);

      // Processar categorias de serviço
      let serviceCategories: ServiceCategory[] = [];
      if (categoriesResult.status === 'fulfilled') {
        serviceCategories = categoriesResult.value;
      }

      // Processar dados do checklist
      let checklistData: ChecklistData | null = null;
      let existingImages: SignedUrlResult[] = [];

      if (checklistResult.status === 'fulfilled' && checklistResult.value) {
        checklistData = checklistResult.value;

        // Carregar imagens existentes se houver
        const mediaPaths = checklistData.inspection?.mediaPaths || [];
        if (mediaPaths.length > 0) {
          try {
            existingImages = await imageService.generateSignedUrls(mediaPaths);
          } catch {
            // Não falhar completamente se as imagens não carregarem
          }
        }
      }

      setState(prev => ({
        ...prev,
        checklistData,
        serviceCategories,
        existingImages,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar dados do checklist.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  return {
    state,
    loadData,
    resetData,
  };
};
