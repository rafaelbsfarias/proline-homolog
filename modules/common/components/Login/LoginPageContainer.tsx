'use client';

import React from 'react';
import { useLoginForm } from '@/modules/common/hooks/useLoginForm';
import { LoginHeader } from '../LoginHeader';
import { LoginForm } from '../LoginForm';
import { LoginOptions } from '../LoginOptions';
import styles from '@/modules/common/components/Login/LoginPage.module.css';

export const LoginPageContainer: React.FC = () => {
  const {
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
  } = useLoginForm();

  return (
    <div className={styles.loginContainer}>
      <LoginHeader />

      <div className={styles.formWrapper}>
        <LoginForm
          email={email}
          password={password}
          onEmailChange={handleEmailChange}
          onPasswordChange={handlePasswordChange}
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
