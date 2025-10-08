'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/modules/common/components/ToastProvider';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import {
  ChecklistForm,
  VehicleInfo,
  buildDefaultForm,
  formatDateYYYYMMDD,
} from '../checklist/types';

export function useSpecialistChecklist() {
  const { showToast } = useToast();
  const { get, post } = useAuthenticatedFetch();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<ChecklistForm>(buildDefaultForm(formatDateYYYYMMDD()));
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Buscar dados do veículo
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obter vehicleId dos parâmetros da URL
        const vehicleId = searchParams.get('vehicleId');

        if (!vehicleId) {
          throw new Error('ID do veículo não fornecido na URL');
        }

        // Buscar dados do veículo
        const response = await get<{
          vehicle: VehicleInfo;
        }>(`/api/specialist/vehicles/${vehicleId}`);

        if (!response.ok || !response.data) {
          throw new Error('Erro ao buscar dados do veículo');
        }

        setVehicle(response.data.vehicle);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar dados do veículo';
        setError(message);
        showToast('error', message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [searchParams, get, showToast]);

  const setField = (
    field:
      | keyof ChecklistForm
      | `services.${keyof ChecklistForm['services']}.${keyof ChecklistForm['services'][keyof ChecklistForm['services']]}`,
    value:
      | string
      | 'empty'
      | 'quarter'
      | 'half'
      | 'three_quarters'
      | 'full'
      | ChecklistForm['services']
      | boolean
  ) => {
    setForm(prev => {
      if (field.startsWith('services.')) {
        const [, service, serviceField] = field.split('.');
        return {
          ...prev,
          services: {
            ...prev.services,
            [service]: {
              ...prev.services[service as keyof ChecklistForm['services']],
              [serviceField]: value,
            },
          },
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const saveChecklist = async () => {
    if (!vehicle) {
      throw new Error('Veículo não encontrado');
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validações básicas
      if (!form.date || !/\d{4}-\d{2}-\d{2}/.test(form.date)) {
        throw new Error('Data da inspeção inválida.');
      }
      if (!form.odometer || Number(form.odometer) < 0) {
        throw new Error('Informe a quilometragem atual válida.');
      }

      const payload = {
        ...form,
        vehicle_id: vehicle.id,
      };

      const response = await post('/api/specialist/save-checklist', payload, {
        requireAuth: true,
      });

      if (!response.ok) {
        throw new Error(response.error || 'Erro ao salvar checklist');
      }

      setSuccess('Checklist salvo com sucesso!');
      showToast('success', 'Checklist salvo com sucesso!');
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
    setForm(buildDefaultForm(formatDateYYYYMMDD()));
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
