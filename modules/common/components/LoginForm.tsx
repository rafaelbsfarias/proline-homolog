/**
 * Componente para formulário de login
 * Implementa Single Responsibility Principle
 * Responsabilidade única: gerenciar o formulário de login
 */

import React from 'react';
import styles from '../components/Login/LoginPage.module.css';

interface LoginFormProps {
  email: string;
  password: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isLoading,
  hasError,
  errorMessage,
}) => {
  return (
    <form onSubmit={onSubmit}>
      <div className={styles.inputGroup}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={onEmailChange}
          className={hasError ? styles.error : ''}
          required
          disabled={isLoading}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="password">Senha</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Sua senha"
          value={password}
          onChange={onPasswordChange}
          className={hasError ? styles.error : ''}
          required
          disabled={isLoading}
        />
      </div>

      {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

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
  );
};
