'use client';

import { useState } from 'react';
import { useToast } from '@/modules/common/components/ToastProvider';

export interface PartnerChecklistForm {
  date: string;
  odometer: string;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  // Grupos de Inspeção baseados no CHECK LIST.xlsx
  clutch: 'ok' | 'attention' | 'critical'; // Embreagem - Conjunto
  clutchNotes: string;
  sparkPlugs: 'ok' | 'attention' | 'critical'; // Vela de Ignição
  sparkPlugsNotes: string;
  belts: 'ok' | 'attention' | 'critical'; // Correia Dentada/Auxiliar
  beltsNotes: string;
  radiator: 'ok' | 'attention' | 'critical'; // Radiador (Arrefecimento) - Verificar vazamentos inferiores
  radiatorNotes: string;
  frontShocks: 'ok' | 'attention' | 'critical'; // Amortecedor Dianteiro
  frontShocksNotes: string;
  rearShocks: 'ok' | 'attention' | 'critical'; // Amortecedor Traseiro
  rearShocksNotes: string;
  suspension: 'ok' | 'attention' | 'critical'; // Suspensão
  suspensionNotes: string;
  tires: 'ok' | 'attention' | 'critical'; // Pneus
  tiresNotes: string;
  brakePads: 'ok' | 'attention' | 'critical'; // Pastilha de Freio
  brakePadsNotes: string;
  brakeDiscs: 'ok' | 'attention' | 'critical'; // Disco de Freio
  brakeDiscsNotes: string;
  engine: 'ok' | 'attention' | 'critical'; // Motor
  engineNotes: string;
  steeringBox: 'ok' | 'attention' | 'critical'; // Caixa de Direção
  steeringBoxNotes: string;
  electricSteeringBox: 'ok' | 'attention' | 'critical'; // Caixa Direção Elétrica - Verificar folga
  electricSteeringBoxNotes: string;
  exhaust: 'ok' | 'attention' | 'critical'; // Sistema de Escape - Checar vazamento/sinistros/alinhamento
  exhaustNotes: string;
  fluids: 'ok' | 'attention' | 'critical'; // Fluidos - Checar níveis
  fluidsNotes: string;
  airConditioning: 'ok' | 'attention' | 'critical'; // Ar Condicionado - Checar se está congelando
  airConditioningNotes: string;
  airConditioningCompressor: 'ok' | 'attention' | 'critical'; // Compressor Ar Condicionado - Checar se está atracando
  airConditioningCompressorNotes: string;
  airConditioningCleaning: 'ok' | 'attention' | 'critical'; // Limpeza Ar Condicionado - Checar fluxo de ar (filtro de cabine)
  airConditioningCleaningNotes: string;
  electrical: 'ok' | 'attention' | 'critical'; // Sistema Elétrico
  electricalNotes: string;
  battery: 'ok' | 'attention' | 'critical'; // Bateria
  batteryNotes: string;
  observations: string;
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
  // Grupos de Inspeção baseados no CHECK LIST.xlsx
  clutch: 'ok',
  clutchNotes: '',
  sparkPlugs: 'ok',
  sparkPlugsNotes: '',
  belts: 'ok',
  beltsNotes: '',
  radiator: 'ok',
  radiatorNotes: '',
  frontShocks: 'ok',
  frontShocksNotes: '',
  rearShocks: 'ok',
  rearShocksNotes: '',
  suspension: 'ok',
  suspensionNotes: '',
  tires: 'ok',
  tiresNotes: '',
  brakePads: 'ok',
  brakePadsNotes: '',
  brakeDiscs: 'ok',
  brakeDiscsNotes: '',
  engine: 'ok',
  engineNotes: '',
  steeringBox: 'ok',
  steeringBoxNotes: '',
  electricSteeringBox: 'ok',
  electricSteeringBoxNotes: '',
  exhaust: 'ok',
  exhaustNotes: '',
  fluids: 'ok',
  fluidsNotes: '',
  airConditioning: 'ok',
  airConditioningNotes: '',
  airConditioningCompressor: 'ok',
  airConditioningCompressorNotes: '',
  airConditioningCleaning: 'ok',
  airConditioningCleaningNotes: '',
  electrical: 'ok',
  electricalNotes: '',
  battery: 'ok',
  batteryNotes: '',
  observations: '',
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
    value: string | 'ok' | 'attention' | 'critical'
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
    saveChecklist,
    resetForm,
  };
}
