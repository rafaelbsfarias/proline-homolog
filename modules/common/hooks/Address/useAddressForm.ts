import { useState, useEffect } from 'react';
import { z } from 'zod';
import { sanitizeString } from '@/modules/common/utils/inputSanitization';

export interface AddressFormValues {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  complement?: string;
}

const addressSchema = z.object({
  street: z.string().trim().min(1, { message: 'Rua é obrigatória' }),
  number: z.string().trim().min(1, { message: 'Número é obrigatório' }),
  neighborhood: z.string().trim().min(1, { message: 'Bairro é obrigatório' }),
  city: z.string().trim().min(1, { message: 'Cidade é obrigatória' }),
  state: z.string().trim().min(1, { message: 'Estado é obrigatório' }),
  zip_code: z
    .string()
    .trim()
    .min(1, { message: 'CEP é obrigatório' })
    .regex(/^\d{5}-?\d{3}$/, { message: 'CEP inválido' }),
  complement: z.string().optional(),
});

export const useAddressForm = (
  isOpen: boolean,
  initialValues?: Partial<AddressFormValues>,
  onSubmit?: (values: AddressFormValues) => Promise<{ success: boolean; message?: string } | void>
) => {
  const [form, setForm] = useState<AddressFormValues>({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    complement: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormValues, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        street: initialValues?.street ?? '',
        number: initialValues?.number ?? '',
        neighborhood: initialValues?.neighborhood ?? '',
        city: initialValues?.city ?? '',
        state: initialValues?.state ?? '',
        zip_code: initialValues?.zip_code ?? '',
        complement: initialValues?.complement ?? '',
      });
      setErrors({});
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, initialValues]);

  const validate = () => {
    const result = addressSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const newErrors: Partial<Record<keyof AddressFormValues, string>> = {};
    result.error.errors.forEach(err => {
      const field = err.path[0] as keyof AddressFormValues;
      newErrors[field] = err.message;
    });
    setErrors(newErrors);
    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof AddressFormValues]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !onSubmit) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const sanitized: AddressFormValues = {
        street: sanitizeString(form.street),
        number: sanitizeString(form.number),
        neighborhood: sanitizeString(form.neighborhood),
        city: sanitizeString(form.city),
        state: sanitizeString(form.state),
        zip_code: sanitizeString(form.zip_code),
        complement: form.complement ? sanitizeString(form.complement) : undefined,
      };
      const res = await onSubmit(sanitized);
      if (!res || res.success) {
        const message = res && 'message' in res ? res.message : undefined;
        setSuccess(message || 'Endereço salvo com sucesso!');
      } else {
        setError(res.message || 'Falha ao salvar endereço');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar endereço');
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    errors,
    loading,
    error,
    success,
    handleChange,
    handleSubmit,
    setError,
    setSuccess,
  };
};
