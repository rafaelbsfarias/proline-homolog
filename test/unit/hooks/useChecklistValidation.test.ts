import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChecklistValidation } from '@/modules/specialist/hooks/useChecklistValidation';
import type { ChecklistForm, VehicleInfo } from '@/modules/specialist/checklist/types';

describe('useChecklistValidation', () => {
  let mockForm: ChecklistForm;
  let mockVehicle: VehicleInfo;

  beforeEach(() => {
    mockForm = {
      date: '2024-01-15',
      odometer: '50000',
      fuelLevel: 'full',
      observations: 'Veículo em bom estado',
      services: {
        oilChange: { checked: true, notes: 'Óleo trocado' },
        brakeCheck: { checked: false, notes: '' },
        tireCheck: { checked: true, notes: 'Pneus ok' },
      },
    };

    mockVehicle = {
      id: '1',
      plate: 'ABC-1234',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Branco',
    };
  });

  describe('validateDate', () => {
    it('deve validar data válida', () => {
      const { result } = renderHook(() => useChecklistValidation());

      const validation = result.current.validateDate('2024-01-15');

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve rejeitar data vazia', () => {
      const { result } = renderHook(() => useChecklistValidation());

      const validation = result.current.validateDate('');

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Data da inspeção é obrigatória.');
    });

    it('deve rejeitar data em formato inválido', () => {
      const { result } = renderHook(() => useChecklistValidation());

      const validation = result.current.validateDate('15/01/2024');

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Data da inspeção inválida.');
    });
  });

  describe('validateOdometer', () => {
    it('deve validar quilometragem válida', () => {
      const { result } = renderHook(() => useChecklistValidation());

      const validation = result.current.validateOdometer('50000');

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve rejeitar quilometragem vazia', () => {
      const { result } = renderHook(() => useChecklistValidation());

      const validation = result.current.validateOdometer('');

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Quilometragem atual é obrigatória.');
    });

    it('deve rejeitar quilometragem negativa', () => {
      const { result } = renderHook(() => useChecklistValidation());

      const validation = result.current.validateOdometer('-1000');

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Informe a quilometragem atual válida.');
    });

    it('deve rejeitar quilometragem não numérica', () => {
      const { result } = renderHook(() => useChecklistValidation());

      const validation = result.current.validateOdometer('abc');

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Informe a quilometragem atual válida.');
    });
  });

  describe('validateVehicle', () => {
    it('deve validar veículo válido', () => {
      const { result } = renderHook(() => useChecklistValidation());

      const validation = result.current.validateVehicle(mockVehicle);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve rejeitar veículo nulo', () => {
      const { result } = renderHook(() => useChecklistValidation());

      const validation = result.current.validateVehicle(null);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Veículo inválido.');
    });
  });

  describe('validateForm', () => {
    it('deve validar formulário completo válido', () => {
      const { result } = renderHook(() => useChecklistValidation());

      const validation = result.current.validateForm(mockForm, mockVehicle);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve agregar erros de múltiplas validações', () => {
      const { result } = renderHook(() => useChecklistValidation());

      const invalidForm: ChecklistForm = {
        ...mockForm,
        date: '',
        odometer: '-100',
      };

      const validation = result.current.validateForm(invalidForm, null);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(3);
      expect(validation.errors).toContain('Data da inspeção é obrigatória.');
      expect(validation.errors).toContain('Informe a quilometragem atual válida.');
      expect(validation.errors).toContain('Veículo inválido.');
    });
  });

  describe('validateSession', () => {
    it('deve existir o método validateSession', () => {
      const { result } = renderHook(() => useChecklistValidation());

      expect(typeof result.current.validateSession).toBe('function');
    });
  });
});
