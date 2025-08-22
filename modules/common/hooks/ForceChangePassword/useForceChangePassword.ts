import { useState } from 'react';
import { z } from 'zod';
import { changeUserPassword } from '@/modules/common/services/passwordService';

const passwordSchema = z
  .object({
    password: z
      .string()
      .nonempty('Senha é obrigatória')
      .min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z
      .string()
      .nonempty('Confirmação é obrigatória')
      .min(6, 'A confirmação deve ter no mínimo 6 caracteres'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export function useForceChangePassword(onSuccess: () => void, onError: (msg: string) => void) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const handleSubmit = async (password: string, confirmPassword: string) => {
    const validation = passwordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const fieldErrors: any = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    } else {
      setErrors({});
    }

    setLoading(true);
    try {
      await changeUserPassword(password);
      onSuccess();
    } catch (err: any) {
      setErrors({ password: err.message });
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading, errors, setErrors };
}
