/**
 * Hook para gerenciar o estado do formulário de login
 * Implementa o padrão Extract Method
 * Reduz a complexidade do componente principal
 */

import { useState, useEffect } from 'react';
import { Email } from '@/modules/common/domain/Email';
import { Password } from '@/modules/common/domain/Password';

interface UseLoginFormState {
  email: string;
  password: string;
  saveUser: boolean;
  emailObj: Email | null;
  passwordObj: Password | null;
}

interface UseLoginFormActions {
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setSaveUser: (save: boolean) => void;
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveUserChange: (checked: boolean) => void;
  isFormValid: () => boolean;
  getFormData: () => { email: Email; password: Password };
}

type UseLoginFormReturn = UseLoginFormState & UseLoginFormActions;

export function useLoginForm(): UseLoginFormReturn {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [saveUser, setSaveUser] = useState<boolean>(false);
  const [emailObj, setEmailObj] = useState<Email | null>(null);
  const [passwordObj, setPasswordObj] = useState<Password | null>(null);

  // Carrega email salvo do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedUserEmail');
    if (saved) {
      setEmail(saved);
      setSaveUser(true);
    }
  }, []);

  // Atualiza value objects quando os valores mudam
  useEffect(() => {
    setEmailObj(Email.createSafe(email));
  }, [email]);

  useEffect(() => {
    setPasswordObj(Password.createSafe(password));
  }, [password]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (saveUser) {
      localStorage.setItem('savedUserEmail', newEmail);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
  };

  const handleSaveUserChange = (checked: boolean): void => {
    setSaveUser(checked);

    if (checked) {
      localStorage.setItem('savedUserEmail', email);
    } else {
      localStorage.removeItem('savedUserEmail');
    }
  };

  const isFormValid = (): boolean => {
    return emailObj !== null && passwordObj !== null;
  };

  const getFormData = (): { email: Email; password: Password } => {
    if (!emailObj || !passwordObj) {
      throw new Error('Formulário inválido');
    }

    return {
      email: emailObj,
      password: passwordObj,
    };
  };

  return {
    email,
    password,
    saveUser,
    emailObj,
    passwordObj,
    setEmail,
    setPassword,
    setSaveUser,
    handleEmailChange,
    handlePasswordChange,
    handleSaveUserChange,
    isFormValid,
    getFormData,
  };
}
