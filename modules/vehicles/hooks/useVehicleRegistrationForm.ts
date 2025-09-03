import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { registerVehicle } from '../services/vehicleRegistrationService';

// Shared types
type UserRole = 'admin' | 'client';
type Client = { id: string; full_name: string; email: string };
export type VehicleFormData = {
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  initialKm: string;
  fipe_value: string;
  observations: string;
  estimated_arrival_date: string;
  preparacao: boolean;
  comercializacao: boolean;
};

// Zod schema
const vehicleSchema = z.object({
  plate: z.string().trim().min(1, { message: 'Placa é obrigatória' }),
  brand: z.string().trim().min(1, { message: 'Marca é obrigatória' }),
  model: z.string().trim().min(1, { message: 'Modelo é obrigatório' }),
  color: z.string().trim().min(1, { message: 'Cor é obrigatória' }),
  year: z.string().regex(/^\d{4}$/, { message: 'Ano inválido' }),
  clientId: z.string(),
  fipe_value: z.string().optional(),
  initialKm: z.string().optional(),
  observations: z.string().optional(),
  estimated_arrival_date: z.string().optional(),
  preparacao: z.boolean(),
  comercializacao: z.boolean(),
});

interface UseVehicleRegistrationFormProps {
  isOpen: boolean;
  userRole: UserRole;
  hiddenFields?: (keyof VehicleFormData)[];
  onSuccess?: () => void;
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
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setError(null);
      setSuccess(false);
      if (userRole !== 'admin') {
        setSelectedClient(null);
      }
    }
  }, [isOpen, userRole]);

  const isHidden = (k: keyof VehicleFormData) => !!hiddenFields?.includes(k);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target as { name: keyof VehicleFormData; value: string };
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value || '';
    const next = raw.toUpperCase().replace(/\s+/g, '').slice(0, 8);
    setFormData(prev => ({ ...prev, plate: next }));
    if (errors.plate) setErrors(prev => ({ ...prev, plate: undefined }));
  };

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, clientId: client?.id || '' }));
    if (errors.clientId) setErrors(prev => ({ ...prev, clientId: undefined }));
  };

  const validate = () => {
    const finalSchema = vehicleSchema.superRefine((data, ctx) => {
      if (userRole === 'admin' && !data.clientId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cliente é obrigatório',
          path: ['clientId'],
        });
      }
    });

    const result = finalSchema.safeParse(formData);
    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: Partial<Record<keyof VehicleFormData, string>> = {};
    result.error.errors.forEach(err => {
      const field = err.path[0] as keyof VehicleFormData;
      if (!isHidden(field)) {
        newErrors[field] = err.message;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    try {
      await registerVehicle(post, userRole, formData);
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Erro ao cadastrar veículo.');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    errors,
    loading,
    selectedClient,
    isHidden,
    handleInputChange,
    handlePlateChange,
    handleClientSelect,
    handleSubmit,
    error,
    success,
    setError,
    setSuccess,
  } as const;
}
