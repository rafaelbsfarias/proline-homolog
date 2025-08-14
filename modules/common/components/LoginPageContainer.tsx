/**
 * Container principal da página de login
 * Implementa Object Calisthenics - um nível de indentação
 * Centraliza a lógica de login em um container dedicado
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthentication } from '@/modules/common/hooks/useAuthentication';
import { useFormValidation } from '@/modules/common/hooks/useFormValidation';
import { useLoginForm } from '@/modules/common/hooks/useLoginForm';
import { NavigationService } from '@/modules/common/services/NavigationService';
import { LoginHeader } from './LoginHeader';
import { LoginForm } from './LoginForm';
import { LoginOptions } from './LoginOptions';
import styles from '@/modules/common/components/LoginPage.module.css';

export const LoginPageContainer: React.FC = () => {
  const router = useRouter();
  const { login, isLoading, error: authError, setError: setAuthError } = useAuthentication();
  const {
    error: validationError,
    setError: setValidationError,
    validateLoginForm,
  } = useFormValidation();
  const navigationService = NavigationService.getInstance();

  const {
    email,
    password,
    saveUser,
    handleEmailChange,
    handlePasswordChange,
    handleSaveUserChange,
    isFormValid,
    getFormData,
  } = useLoginForm();

  const clearErrors = (): void => {
    setValidationError('');
    setAuthError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    clearErrors();

    // Early return se form inválido
    if (!isFormValid()) {
      setValidationError('Preencha todos os campos corretamente');
      return;
    }

    try {
      const { email: emailObj, password: passwordObj } = getFormData();
      await login(emailObj.getValue(), passwordObj.getValue());
    } catch (error) {
      setValidationError('Erro ao processar formulário');
    }
  };

  const handleForgotPassword = (): void => {
    navigationService.navigateToDashboard('guest', router);
    router.push('/recuperar-senha');
  };

  const handleEmailChangeWithErrorClear = (e: React.ChangeEvent<HTMLInputElement>): void => {
    handleEmailChange(e);
    clearErrors();
  };

  const handlePasswordChangeWithErrorClear = (e: React.ChangeEvent<HTMLInputElement>): void => {
    handlePasswordChange(e);
    clearErrors();
  };

  const hasError = Boolean(validationError || authError);
  const errorMessage = validationError || authError;

  return (
    <div className={styles.loginContainer}>
      <LoginHeader />

      <div className={styles.formWrapper}>
        <LoginForm
          email={email}
          password={password}
          onEmailChange={handleEmailChangeWithErrorClear}
          onPasswordChange={handlePasswordChangeWithErrorClear}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          hasError={hasError}
          errorMessage={errorMessage}
        />

        <LoginOptions
          saveUser={saveUser}
          onSaveUserChange={handleSaveUserChange}
          onForgotPassword={handleForgotPassword}
        />
      </div>

      <div className={styles.signupLink}>
        <span>Não tem uma conta? </span>
        <a href="/cadastro">Cadastre-se</a>
      </div>
    </div>
  );
};
