import { ChecklistForm } from '../checklist/types';
import { VehicleInfo } from '../checklist/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ChecklistValidation {
  validateForm: (form: ChecklistForm, vehicle: VehicleInfo | null) => ValidationResult;
  validateDate: (date: string) => ValidationResult;
  validateOdometer: (odometer: string) => ValidationResult;
  validateVehicle: (vehicle: VehicleInfo | null) => ValidationResult;
  validateSession: () => Promise<ValidationResult>;
}

/**
 * Hook personalizado para validação de formulários de checklist
 * Centraliza todas as regras de validação seguindo o princípio da responsabilidade única
 */
export const useChecklistValidation = (): ChecklistValidation => {
  /**
   * Valida a data da inspeção
   * - Deve estar no formato YYYY-MM-DD
   * - Não pode estar vazia
   */
  const validateDate = (date: string): ValidationResult => {
    const errors: string[] = [];

    if (!date || !date.trim()) {
      errors.push('Data da inspeção é obrigatória.');
    } else if (!/\d{4}-\d{2}-\d{2}/.test(date)) {
      errors.push('Data da inspeção inválida.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Valida a quilometragem
   * - Deve ser um número positivo
   * - Não pode estar vazia
   */
  const validateOdometer = (odometer: string): ValidationResult => {
    const errors: string[] = [];

    if (!odometer || !odometer.trim()) {
      errors.push('Quilometragem atual é obrigatória.');
    } else {
      const numValue = Number(odometer);
      if (isNaN(numValue) || numValue < 0) {
        errors.push('Informe a quilometragem atual válida.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Valida se o veículo foi fornecido
   */
  const validateVehicle = (vehicle: VehicleInfo | null): ValidationResult => {
    const errors: string[] = [];

    if (!vehicle) {
      errors.push('Veículo inválido.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Valida se existe uma sessão de usuário ativa
   */
  const validateSession = async (): Promise<ValidationResult> => {
    const errors: string[] = [];

    try {
      const { supabase } = await import('@/modules/common/services/supabaseClient');
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();

      if (sessErr || !session?.user) {
        errors.push('Sessão inválida. Faça login novamente.');
      }
    } catch {
      errors.push('Erro ao validar sessão.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Validação completa do formulário de checklist
   * Agrega todas as validações individuais
   */
  const validateForm = (form: ChecklistForm, vehicle: VehicleInfo | null): ValidationResult => {
    const allErrors: string[] = [];

    // Validar data
    const dateValidation = validateDate(form.date);
    allErrors.push(...dateValidation.errors);

    // Validar quilometragem
    const odometerValidation = validateOdometer(form.odometer);
    allErrors.push(...odometerValidation.errors);

    // Validar veículo
    const vehicleValidation = validateVehicle(vehicle);
    allErrors.push(...vehicleValidation.errors);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  };

  return {
    validateForm,
    validateDate,
    validateOdometer,
    validateVehicle,
    validateSession,
  };
};
