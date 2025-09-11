import { useState } from 'react';
import { callSignupApi } from '../../services/signupApiService';
import { formatCNPJ, formatPhone } from '../../validators/signupValidators';
import { z } from 'zod';

export interface SignupFormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  cnpj: string;
  phone: string;
}

const signupSchema = z
  .object({
    fullName: z.string(),
    email: z.string(),
    password: z.string(),
    confirmPassword: z.string(),
    companyName: z.string(),
    cnpj: z.string(),
    phone: z.string(),
  })
  .superRefine((data, ctx) => {
    // fullName
    if (!data.fullName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O nome completo é obrigatório',
        path: ['fullName'],
      });
    } else if (data.fullName.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nome completo deve ter pelo menos 3 caracteres',
        path: ['fullName'],
      });
    }

    // email
    if (!data.email.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O e-mail é obrigatório',
        path: ['email'],
      });
    } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'E-mail inválido',
        path: ['email'],
      });
    }

    // password
    if (!data.password.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A senha é obrigatória',
        path: ['password'],
      });
    } else if (data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A senha deve ter no mínimo 8 caracteres',
        path: ['password'],
      });
    }

    // confirmPassword
    if (!data.confirmPassword.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A confirmação de senha é obrigatória',
        path: ['confirmPassword'],
      });
    } else if (data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'As senhas não coincidem',
        path: ['confirmPassword'],
      });
    }

    // companyName
    if (!data.companyName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A razão social é obrigatória',
        path: ['companyName'],
      });
    } else if (data.companyName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Razão social inválida',
        path: ['companyName'],
      });
    }

    // CNPJ
    if (!data.cnpj.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O CNPJ é obrigatório',
        path: ['cnpj'],
      });
    } else if (!/^\d{14}$/.test(data.cnpj.replace(/\D/g, ''))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CNPJ inválido',
        path: ['cnpj'],
      });
    }

    // phone
    if (!data.phone.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O telefone é obrigatório',
        path: ['phone'],
      });
    } else if (!/^\d{10,11}$/.test(data.phone.replace(/\D/g, ''))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefone inválido',
        path: ['phone'],
      });
    }
  });

export const useSignupForm = () => {
  const [form, setForm] = useState<SignupFormState>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    cnpj: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignupFormState, string>>>(
    {}
  );
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: undefined })); // limpa erro ao digitar
  };

  const validateForm = (): boolean => {
    const result = signupSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupFormState, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof SignupFormState;
        fieldErrors[field] = err.message;
      });
      setFieldErrors(fieldErrors);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setSuccess(false);

    try {
      const { confirmPassword, ...apiData } = form;
      await callSignupApi(apiData);
      setSuccess(true);
      // Limpar o formulário em caso de sucesso
      setForm({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        cnpj: '',
        phone: '',
      });
    } catch (err: any) {
      setGlobalError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    fieldErrors,
    globalError,
    success,
    handleChange,
    handleSubmit,
    setSuccess,
    setFieldErrors,
    setGlobalError,
  };
};
