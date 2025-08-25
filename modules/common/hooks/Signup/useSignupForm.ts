import { useState } from 'react';
import { callSignupApi } from '../../services/signupApiService';
import {
  formatCNPJ,
  formatPhone,
  validateCompanyName,
  validateFullName,
  validatePassword,
} from '../../validators/signupValidators';
import { validateCNPJ, validateEmail, validatePhone } from '../../utils/inputSanitization';

export interface SignupFormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  cnpj: string;
  phone: string;
}

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cnpj') {
      formattedValue = formatCNPJ(value);
    } else if (name === 'phone') {
      formattedValue = formatPhone(value);
    }

    setForm(prev => ({ ...prev, [name]: formattedValue }));
    setError(null); // Limpa o erro ao digitar
  };

  const validateForm = (): boolean => {
    const validations = [
      validateFullName(form.fullName),
      validateCompanyName(form.companyName),
      validateCNPJ(form.cnpj),
      validateEmail(form.email),
      validatePhone(form.phone),
      validatePassword(form.password),
    ];

    const firstError = validations.find(v => v !== null);
    if (firstError && typeof firstError === 'string') {
      setError(firstError);
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validateForm()) {
      return;
    }

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
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    error,
    success,
    handleChange,
    handleSubmit,
    setSuccess, // Para controlar o modal de sucesso externamente
    setError, // Para limpar o erro externamente
  };
};
