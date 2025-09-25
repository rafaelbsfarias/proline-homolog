'use client';

import { useState, useCallback } from 'react';
import type { ChecklistFormWithInspections, InspectionStatus } from '../../common/types/checklist';
import { useVehicleData } from '../../common/hooks/useVehicleData';
import { useAuthenticatedFetch } from '../../common/hooks/useAuthenticatedFetch';
import { useErrorHandler, ErrorType } from '../../common/services/ErrorHandlerService';

interface PartnerChecklistState {
  form: ChecklistFormWithInspections | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

interface UsePartnerChecklistResult extends PartnerChecklistState {
  // Dados do veículo
  vehicle: ReturnType<typeof useVehicleData>['vehicle'];
  inspection: ReturnType<typeof useVehicleData>['inspection'];
  vehicleLoading: ReturnType<typeof useVehicleData>['loading'];
  vehicleError: ReturnType<typeof useVehicleData>['error'];

  // Ações
  loadChecklist: () => Promise<void>;
  updateChecklistItem: (
    field: keyof ChecklistFormWithInspections,
    value: string | InspectionStatus
  ) => void;
  saveChecklist: () => Promise<void>;
  submitChecklist: () => Promise<void>;

  // Estados derivados
  canSubmit: boolean;
  hasUnsavedChanges: boolean;
}

export function usePartnerChecklist(): UsePartnerChecklistResult {
  // Hooks de dependências
  const { vehicle, inspection, loading: vehicleLoading, error: vehicleError } = useVehicleData();
  const { post, put } = useAuthenticatedFetch();
  const { handleError } = useErrorHandler();

  // Estado do checklist
  const [state, setState] = useState<PartnerChecklistState>({
    form: null,
    loading: false,
    saving: false,
    error: null,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  /**
   * Carrega dados do checklist
   */
  const loadChecklist = useCallback(async () => {
    if (!inspection?.id) {
      setState(prev => ({ ...prev, error: 'Inspeção não encontrada' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await post<ChecklistFormWithInspections>(`/api/partner/checklist/load`, {
        inspectionId: inspection.id,
      });

      if (!response.ok || !response.data) {
        throw new Error(response.error || 'Erro ao carregar checklist');
      }

      setState(prev => ({
        ...prev,
        form: response.data!,
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar checklist';

      handleError(error as Error, ErrorType.SERVER, {
        showToUser: true,
        context: { inspectionId: inspection.id, action: 'loadChecklist' },
      });

      setState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [inspection?.id, post, handleError]);

  /**
   * Atualiza item do checklist
   */
  const updateChecklistItem = useCallback(
    (field: keyof ChecklistFormWithInspections, value: string | InspectionStatus) => {
      setState(prev => {
        if (!prev.form) return prev;

        return {
          ...prev,
          form: {
            ...prev.form,
            [field]: value,
          },
        };
      });

      setHasUnsavedChanges(true);
    },
    []
  );

  /**
   * Salva o checklist como rascunho
   */
  const saveChecklist = useCallback(async () => {
    if (!state.form || !inspection?.id) {
      return;
    }

    try {
      setState(prev => ({ ...prev, saving: true, error: null }));

      const payload = {
        ...state.form,
        inspection_id: inspection.id,
        status: 'draft',
      };

      const response = await put<{ success: boolean }>(`/api/partner/checklist/save`, payload);

      if (!response.ok) {
        throw new Error(response.error || 'Erro ao salvar checklist');
      }

      setHasUnsavedChanges(false);
      setState(prev => ({ ...prev, saving: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar checklist';

      handleError(error as Error, ErrorType.SERVER, {
        showToUser: true,
        context: { inspectionId: inspection.id, action: 'saveChecklist' },
      });

      setState(prev => ({
        ...prev,
        saving: false,
        error: message,
      }));
    }
  }, [state.form, inspection?.id, put, handleError]);

  /**
   * Submete o checklist para revisão
   */
  const submitChecklist = useCallback(async () => {
    if (!state.form || !inspection?.id) {
      return;
    }

    try {
      setState(prev => ({ ...prev, saving: true, error: null }));

      const payload = {
        ...state.form,
        inspection_id: inspection.id,
        status: 'submitted',
      };

      const response = await put<{ success: boolean }>(`/api/partner/checklist/submit`, payload);

      if (!response.ok) {
        throw new Error(response.error || 'Erro ao enviar checklist');
      }

      // Atualizar status local
      setState(prev => ({
        ...prev,
        form: prev.form ? { ...prev.form, status: 'submitted' } : null,
        saving: false,
      }));

      setHasUnsavedChanges(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar checklist';

      handleError(error as Error, ErrorType.SERVER, {
        showToUser: true,
        context: { inspectionId: inspection.id, action: 'submitChecklist' },
      });

      setState(prev => ({
        ...prev,
        saving: false,
        error: message,
      }));
    }
  }, [state.form, inspection?.id, put, handleError]);

  /**
   * Verifica se pode submeter o checklist
   */
  const canSubmit = Boolean(
    state.form && state.form.status === 'draft' && !state.saving
    // a fazer: Implementar validação de campos obrigatórios do checklist
  );

  return {
    // Estado do checklist
    form: state.form,
    loading: state.loading,
    saving: state.saving,
    error: state.error,

    // Dados do veículo
    vehicle,
    inspection,
    vehicleLoading,
    vehicleError,

    // Ações
    loadChecklist,
    updateChecklistItem,
    saveChecklist,
    submitChecklist,

    // Estados derivados
    canSubmit,
    hasUnsavedChanges,
  };
}
