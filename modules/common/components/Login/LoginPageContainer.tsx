'use client';

import React from 'react';
import { useLoginForm } from '@/modules/common/hooks/useLoginForm';
import styles from '@/modules/common/components/Login/LoginPage.module.css';
import Input from '../Input/Input';
import ErrorMessage from '../ErroMessage/ErrorMessage';

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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';

    const fallback = document.createElement('div');
    fallback.textContent = 'ProLine';
    fallback.style.fontSize = '2rem';
    fallback.style.fontWeight = 'bold';
    fallback.style.marginBottom = '1rem';

    target.parentElement?.insertBefore(fallback, target.nextSibling);
  };

  return (
    <div className={styles.loginContainer}>
      {/* LoginHeader */}
      <>
        <img
          src={'/assets/images/logo-proline.png'}
          alt={'Proline Auto Logo'}
          className={styles.logo}
          onError={handleImageError}
        />
        <h2 className={styles.loginTitle}>{'Bem-vindo'}</h2>
        <span className={styles.loginSubtitle}>{'Acesse sua conta para continuar'}</span>
      </>

      <div className={styles.formWrapper}>
        {/* LoginForm */}
        <form onSubmit={handleSubmit}>
          <Input
            id="email"
            name="email"
            label="Email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            disabled={isLoading}
            placeholder="seuemail@exemplo.com"
          />

          <Input
            id="password"
            name="password"
            label="Senha"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            disabled={isLoading}
            placeholder="Sua senha"
          />
          {/* 
          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>} */}
          <ErrorMessage message={errorMessage} />

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
            aria-label={isLoading ? 'Fazendo login...' : 'Fazer login'}
            style={{ minWidth: 'auto', width: '100%' }}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* LoginOptions */}
        <div className={styles.formOptions}>
          <div className={styles.saveUserOption}>
            <input
              type="checkbox"
              id="saveUser"
              checked={saveUser}
              onChange={e => handleSaveUserChange(e.target.checked)}
            />
            <label htmlFor="saveUser">Salvar usuário</label>
          </div>

          <div className={styles.forgotPasswordOption}>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                handleForgotPassword();
              }}
            >
              Esqueci minha senha
            </a>
          </div>
        </div>
      </div>

      <div className={styles.signupLink}>
        <span>Não tem uma conta? </span>
        <a href="/cadastro">Cadastre-se</a>
      </div>
    </div>
  );
};
