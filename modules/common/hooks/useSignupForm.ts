import { useState } from 'react';
import { formatCNPJ, formatPhone } from '../validators/signupValidators';

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (name === 'cnpj') {
      setForm({ ...form, [name]: formatCNPJ(value) });
    } else if (name === 'phone') {
      setForm({ ...form, [name]: formatPhone(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  return { form, setForm, isLoading, setIsLoading, handleChange };
};
