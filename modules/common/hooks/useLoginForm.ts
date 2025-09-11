import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Email } from '@/modules/common/domain/Email';
import { Password } from '@/modules/common/domain/Password';
import { useAuthentication } from '@/modules/common/hooks/useAuthentication';
import { useFormValidation } from '@/modules/common/hooks/useFormValidation';
import { NavigationService } from '@/modules/common/services/NavigationService';

export function useLoginForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [saveUser, setSaveUser] = useState<boolean>(false);
  const [emailObj, setEmailObj] = useState<Email | null>(null);
  const [passwordObj, setPasswordObj] = useState<Password | null>(null);

  const router = useRouter();
  const { login, isLoading, error: authError, setError: setAuthError } = useAuthentication();
  const { error: validationError, setError: setValidationError } = useFormValidation();
  const navigationService = NavigationService.getInstance();

  useEffect(() => {
    const saved = localStorage.getItem('savedUserEmail');
    if (saved) {
      setEmail(saved);
      setSaveUser(true);
    }
  }, []);

  useEffect(() => {
    setEmailObj(Email.createSafe(email));
  }, [email]);

  useEffect(() => {
    setPasswordObj(Password.createSafe(password));
  }, [password]);

  const clearErrors = (): void => {
    setValidationError('');
    setAuthError('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    clearErrors();

    if (saveUser) {
      localStorage.setItem('savedUserEmail', newEmail);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
    clearErrors();
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    clearErrors();

    if (!isFormValid()) {
      setValidationError('Preencha todos os campos corretamente');
      return;
    }

    try {
      const { email: emailValue, password: passwordValue } = getFormData();
      await login(emailValue.getValue(), passwordValue.getValue());
    } catch (error) {
      setValidationError('Erro ao processar formulário');
    }
  };

  const handleForgotPassword = (): void => {
    navigationService.navigateToDashboard('guest', router);
    router.push('/recuperar-senha');
  };

  const hasError = Boolean(validationError || authError);
  const errorMessage = validationError || authError;

  return {
    email,
    password,
    saveUser,
    isLoading,
    hasError,
    errorMessage,
    handleEmailChange,
    handlePasswordChange,
    handleSaveUserChange,
    handleSubmit,
    handleForgotPassword,
  };
}
