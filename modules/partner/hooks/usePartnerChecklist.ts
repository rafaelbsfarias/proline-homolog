'use client';

import { useState } from 'react';
import { useToast } from '@/modules/common/components/ToastProvider';

export interface PartnerChecklistForm {
  date: string;
  odometer: string;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  observations: string;
  services: {
    mechanics: { required: boolean; notes: string };
    bodyPaint: { required: boolean; notes: string };
    washing: { required: boolean; notes: string };
    tires: { required: boolean; notes: string };
    loja: { required: boolean; notes: string };
    patioAtacado: { required: boolean; notes: string };
  };
}

export interface VehicleInfo {
  id: string;
  brand: string;
  model: string;
  year?: number;
  plate: string;
  color?: string;
}

const initialForm: PartnerChecklistForm = {
  date: new Date().toISOString().split('T')[0],
  odometer: '',
  fuelLevel: 'half',
  observations: '',
  services: {
    mechanics: { required: false, notes: '' },
    bodyPaint: { required: false, notes: '' },
    washing: { required: false, notes: '' },
    tires: { required: false, notes: '' },
    loja: { required: false, notes: '' },
    patioAtacado: { required: false, notes: '' },
  },
};

export function usePartnerChecklist() {
  const { showToast } = useToast();

  // Dados mockados para desenvolvimento
  const mockVehicle: VehicleInfo = {
    id: 'mock-vehicle-id',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    plate: 'ABC-1234',
    color: 'Prata',
  };

  const [form, setForm] = useState<PartnerChecklistForm>(initialForm);
  const [vehicle] = useState<VehicleInfo | null>(mockVehicle);
  const [loading] = useState(false); // Começar com false para evitar loading
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Remover busca automática por enquanto
  // useEffect(() => {
  //   const fetchVehicleData = async () => {
  //     if (!quoteId) {
  //       setLoading(false);
  //       return;
  //     }
  //     // ... código removido temporariamente
  //   };
  //   fetchVehicleData();
  // }, [quoteId, showToast]);

  const setField = (
    field: keyof PartnerChecklistForm,
    value: string | PartnerChecklistForm['services']
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const setServiceFlag = (service: keyof PartnerChecklistForm['services'], required: boolean) => {
    setForm(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [service]: {
          ...prev.services[service],
          required,
        },
      },
    }));
  };

  const setServiceNotes = (service: keyof PartnerChecklistForm['services'], notes: string) => {
    setForm(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [service]: {
          ...prev.services[service],
          notes,
        },
      },
    }));
  };

  const saveChecklist = async () => {
    if (!vehicle) {
      throw new Error('Veículo não encontrado');
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulação de salvamento - apenas delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validações básicas
      if (!form.date || !/\d{4}-\d{2}-\d{2}/.test(form.date)) {
        throw new Error('Data da inspeção inválida.');
      }
      if (!form.odometer || Number(form.odometer) < 0) {
        throw new Error('Informe a quilometragem atual válida.');
      }

      // Simular sucesso
      setSuccess('Checklist salvo com sucesso (simulado).');
      showToast('success', 'Checklist salvo com sucesso (simulado).');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar checklist.';
      setError(message);
      showToast('error', message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setError(null);
    setSuccess(null);
  };

  return {
    form,
    vehicle,
    loading,
    saving,
    error,
    success,
    setField,
    setServiceFlag,
    setServiceNotes,
    saveChecklist,
    resetForm,
  };
}
