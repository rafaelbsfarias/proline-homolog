import { useState } from 'react';
import { ChecklistForm, VehicleInfo } from '../checklist/types';
import { ChecklistService } from '../services/ChecklistService';
import { ImageService } from '../services/ImageService';
import { sanitizeString } from '@/modules/common/utils/inputSanitization';

export interface SubmissionState {
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
}

export interface ChecklistSubmissionHook {
  state: SubmissionState;
  submitChecklist: (
    form: ChecklistForm,
    vehicle: VehicleInfo,
    files: File[],
    existingImagePaths: string[]
  ) => Promise<void>;
  resetState: () => void;
}

/**
 * Hook personalizado para gerenciar submissão de checklist
 * Coordena validação, upload de imagens e persistência de dados
 * Implementa responsabilidade única para operações de submissão
 */
export const useChecklistSubmission = (): ChecklistSubmissionHook => {
  const [state, setState] = useState<SubmissionState>({
    isSubmitting: false,
    error: null,
    success: null,
  });

  const checklistService = new ChecklistService();
  const imageService = new ImageService();

  /**
   * Reseta o estado de submissão
   */
  const resetState = () => {
    setState({
      isSubmitting: false,
      error: null,
      success: null,
    });
  };

  /**
   * Submete o checklist para salvamento (modo draft)
   * Coordena validação, upload de imagens e chamada da API
   */
  const submitChecklist = async (
    form: ChecklistForm,
    vehicle: VehicleInfo,
    files: File[],
    existingImagePaths: string[]
  ): Promise<void> => {
    setState(prev => ({ ...prev, isSubmitting: true, error: null, success: null }));

    try {
      // 1. Validação básica (usando o hook de validação)
      if (!form.date || !/\d{4}-\d{2}-\d{2}/.test(form.date)) {
        throw new Error('Data da inspeção inválida.');
      }
      if (!form.odometer || Number(form.odometer) < 0) {
        throw new Error('Informe a quilometragem atual válida.');
      }
      if (!vehicle) {
        throw new Error('Veículo inválido.');
      }

      // 2. Verificar autenticação (para RLS do storage)
      const { supabase } = await import('@/modules/common/services/supabaseClient');
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      if (sessErr || !session?.user) {
        throw new Error('Sessão inválida. Faça login novamente.');
      }
      const userId = session.user.id;

      // 3. Upload de imagens (se houver)
      let uploadedPaths: string[] = [];
      if (files.length > 0) {
        uploadedPaths = await imageService.uploadImages(files, userId, vehicle.id);
      }

      // 4. Preparar payload para API
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

      // 5. Salvar checklist via serviço
      await checklistService.saveChecklist(payload);

      // 6. Sucesso
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        success: 'Checklist salvo com sucesso.',
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar checklist.';
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: message,
      }));
      throw error; // Re-throw para que o componente possa lidar com toasts
    }
  };

  return {
    state,
    submitChecklist,
    resetState,
  };
};
