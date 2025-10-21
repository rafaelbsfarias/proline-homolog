import { useState } from 'react';
import { ChecklistForm, VehicleInfo } from '../checklist/types';
import { ChecklistService } from '../services/ChecklistService';
import { ImageService } from '../services/ImageService';
import { sanitizeString } from '@/modules/common/utils/inputSanitization';

export interface FinalizationState {
  isFinalizing: boolean;
  error: string | null;
  success: string | null;
}

export interface ChecklistFinalizationHook {
  state: FinalizationState;
  finalizeChecklist: (
    form: ChecklistForm,
    vehicle: VehicleInfo,
    files: File[],
    existingImagePaths: string[],
    onSuccess?: () => void
  ) => Promise<void>;
  resetState: () => void;
}

/**
 * Hook personalizado para gerenciar finalização de checklist
 * Coordena validação, salvamento e finalização em sequência
 * Implementa responsabilidade única para operações de finalização
 */
export const useChecklistFinalization = (): ChecklistFinalizationHook => {
  const [state, setState] = useState<FinalizationState>({
    isFinalizing: false,
    error: null,
    success: null,
  });

  const checklistService = new ChecklistService();
  const imageService = new ImageService();

  /**
   * Reseta o estado de finalização
   */
  const resetState = () => {
    setState({
      isFinalizing: false,
      error: null,
      success: null,
    });
  };

  /**
   * Finaliza o checklist (torna read-only)
   * Sequência: validar → salvar → finalizar
   */
  const finalizeChecklist = async (
    form: ChecklistForm,
    vehicle: VehicleInfo,
    files: File[],
    existingImagePaths: string[],
    onSuccess?: () => void
  ): Promise<void> => {
    setState(prev => ({ ...prev, isFinalizing: true, error: null, success: null }));

    try {
      // 1. Validação básica
      if (!form.date || !/\d{4}-\d{2}-\d{2}/.test(form.date)) {
        throw new Error('Data da inspeção inválida.');
      }
      if (!form.odometer || Number(form.odometer) < 0) {
        throw new Error('Informe a quilometragem atual válida.');
      }

      // 2. Verificar autenticação
      const { supabase } = await import('@/modules/common/services/supabaseClient');
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      if (sessErr || !session?.user) {
        throw new Error('Sessão inválida. Faça login novamente.');
      }
      const userId = session.user.id;

      // 3. Upload de imagens (se houver novas)
      let uploadedPaths: string[] = [];
      if (files.length > 0) {
        uploadedPaths = await imageService.uploadImages(files, userId, vehicle.id);
      }

      // 4. Preparar payload para salvamento
      const payload = {
        vehicleId: vehicle.id,
        date: form.date,
        odometer: Number(form.odometer),
        fuelLevel: form.fuelLevel,
        observations: sanitizeString(form.observations),
        services: {
          mechanics: {
            required: form.services.mechanics.required,
            notes: sanitizeString(form.services.mechanics.notes),
          },
          bodyPaint: {
            required: form.services.bodyPaint.required,
            notes: sanitizeString(form.services.bodyPaint.notes),
          },
          washing: {
            required: form.services.washing.required,
            notes: sanitizeString(form.services.washing.notes),
          },
          tires: {
            required: form.services.tires.required,
            notes: sanitizeString(form.services.tires.notes),
          },
          loja: {
            required: form.services.loja.required,
            notes: sanitizeString(form.services.loja.notes),
          },
          patioAtacado: {
            required: form.services.patioAtacado.required,
            notes: sanitizeString(form.services.patioAtacado.notes),
          },
        },
        mediaPaths: [...existingImagePaths, ...uploadedPaths],
      };

      // 5. Salvar checklist primeiro
      await checklistService.saveChecklist(payload);

      // 6. Finalizar checklist
      await checklistService.finalizeChecklist(vehicle.id);

      // 7. Sucesso
      setState(prev => ({
        ...prev,
        isFinalizing: false,
        success: 'Checklist salvo e finalizado com sucesso.',
      }));

      // 8. Callback de sucesso (opcional)
      if (onSuccess) {
        try {
          onSuccess();
        } catch {
          // Ignorar erros no callback
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao finalizar checklist.';
      setState(prev => ({
        ...prev,
        isFinalizing: false,
        error: message,
      }));
      throw error; // Re-throw para que o componente possa lidar com toasts
    }
  };

  return {
    state,
    finalizeChecklist,
    resetState,
  };
};
