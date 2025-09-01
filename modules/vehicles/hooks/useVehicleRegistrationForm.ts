// modules/vehicles/hooks/useVehicleRegistrationForm.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import {
  validatePlate,
  formatPlateInput,
  PLATE_ERROR_MESSAGES,
} from '@/modules/common/utils/plateValidation';
import type { FieldKey } from '../components/types';
import type { Vehicle } from '../components/VehicleRegistrationModalBase';
import type { UserRole } from '../../client/types/index';

interface VehicleFormData {
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number | '';
  initialKm: number | '';
  fipe_value: number | '';
  observations: string;
  estimated_arrival_date: string;
  preparacao: boolean;
  comercializacao: boolean;
}

interface FormErrors {
  clientId?: string;
  plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: string;
  initialKm?: string;
  fipe_value?: string;
  estimated_arrival_date?: string;
}

interface Client {
  id: string;
  full_name: string;
  email: string;
}

interface UseVehicleRegistrationFormProps {
  isOpen: boolean;
  userRole: UserRole;
  hiddenFields?: FieldKey[];
  onSuccess?: (vehicle?: Vehicle) => void;
}

export function useVehicleRegistrationForm({
  isOpen,
  userRole,
  hiddenFields,
  onSuccess,
}: UseVehicleRegistrationFormProps) {
  const { post } = useAuthenticatedFetch();

  const [formData, setFormData] = useState<VehicleFormData>({
    clientId: '',
    plate: '',
    brand: '',
    model: '',
    color: '',
    year: '',
    initialKm: '',
    fipe_value: '',
    observations: '',
    estimated_arrival_date: '',
    preparacao: false,
    comercializacao: false,
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isHidden = useCallback(
    (key: FieldKey) => (hiddenFields ?? []).includes(key),
    [hiddenFields]
  );

  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientId: '',
        plate: '',
        brand: '',
        model: '',
        color: '',
        year: '',
        initialKm: '',
        fipe_value: '',
        observations: '',
        estimated_arrival_date: '',
        preparacao: false,
        comercializacao: false,
      });
      setSelectedClient(null);
      setErrors({});
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (userRole === 'admin' && !selectedClient) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.plate.trim()) {
      newErrors.plate = PLATE_ERROR_MESSAGES.REQUIRED;
    } else if (!validatePlate(formData.plate)) {
      newErrors.plate = PLATE_ERROR_MESSAGES.INVALID_FORMAT;
    }

    if (!formData.brand.trim()) newErrors.brand = 'Marca é obrigatória';
    if (!formData.model.trim()) newErrors.model = 'Modelo é obrigatório';
    if (!formData.color.trim()) newErrors.color = 'Cor é obrigatória';

    if (!formData.year) {
      newErrors.year = 'Ano é obrigatório';
    } else {
      const currentYear = new Date().getFullYear();
      const y = Number(formData.year);
      if (y < 1900 || y > currentYear + 1) {
        newErrors.year = `Ano deve estar entre 1900 e ${currentYear + 1}`;
      }
    }

    if (!isHidden('initialKm') && formData.initialKm !== '' && Number(formData.initialKm) < 0) {
      newErrors.initialKm = 'Quilometragem deve ser positiva';
    }
    if (!isHidden('fipe_value') && formData.fipe_value !== '' && Number(formData.fipe_value) < 0) {
      newErrors.fipe_value = 'Valor FIPE deve ser positivo';
    }

    if (userRole === 'admin' && formData.estimated_arrival_date) {
      const d = new Date(formData.estimated_arrival_date);
      if (isNaN(d.getTime())) newErrors.estimated_arrival_date = 'Data inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedClient, userRole, isHidden]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      setLoading(true);
      setError(null);
      setSuccess(false);

      const endpoint =
        userRole === 'admin' ? '/api/admin/create-vehicle' : '/api/client/create-vehicle';
      const payload = {
        ...(userRole === 'admin' && { clientId: selectedClient!.id }),
        plate: formData.plate.trim().toUpperCase(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        color: formData.color.trim(),
        year: Number(formData.year),
        ...(isHidden('initialKm')
          ? {}
          : { initialKm: formData.initialKm ? Number(formData.initialKm) : undefined }),
        ...(isHidden('fipe_value')
          ? {}
          : { fipe_value: formData.fipe_value ? Number(formData.fipe_value) : undefined }),
        observations: formData.observations.trim() || undefined,
        ...(userRole === 'admin' && {
          estimated_arrival_date: formData.estimated_arrival_date || undefined,
        }),
        preparacao: formData.preparacao,
        comercializacao: formData.comercializacao,
      };

      try {
        const response = await post<{
          success: boolean;
          message: string;
          vehicle?: Vehicle;
          error?: string;
        }>(endpoint, payload);

        if (response.ok && response.data?.success) {
          setSuccess(true);
          onSuccess?.(response.data.vehicle);
        } else {
          throw new Error(response.data?.error || response.error || 'Erro ao cadastrar veículo');
        }
      } catch (err: any) {
        setError(err instanceof Error ? err.message : 'Erro ao cadastrar veículo');
      } finally {
        setLoading(false);
      }
    },
    [formData, selectedClient, userRole, isHidden, post, validateForm, onSuccess]
  );

  const handleClientSelect = useCallback(
    (client: Client | null) => {
      setSelectedClient(client);
      setFormData(prev => ({ ...prev, clientId: client?.id || '' }));
      if (client && errors.clientId) {
        setErrors(prev => ({ ...prev, clientId: undefined }));
      }
    },
    [errors.clientId]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name as keyof FormErrors]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
      }
    },
    [errors, formData]
  );

  const handlePlateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPlateInput(e.target.value);
      setFormData(prev => ({ ...prev, plate: formatted }));
      if (errors.plate) setErrors(prev => ({ ...prev, plate: undefined }));
    },
    [errors.plate]
  );

  const handleCheckboxChange = useCallback((name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  }, []);

  return {
    formData,
    errors,
    loading,
    selectedClient,
    isHidden,
    handleInputChange,
    handlePlateChange,
    handleClientSelect,
    handleCheckboxChange,
    handleSubmit,
    error,
    success,
    setError,
    setSuccess,
  };
}
