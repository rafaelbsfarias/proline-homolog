/**
 * Componente para opções de formulário de login
 * Implementa Single Responsibility Principle
 * Responsabilidade única: gerenciar opções do formulário (salvar usuário, esqueci senha)
 */

import React from 'react';
import styles from '@/modules/common/components/LoginPage.module.css';

interface LoginOptionsProps {
  saveUser: boolean;
  onSaveUserChange: (checked: boolean) => void;
  onForgotPassword: () => void;
}

export const LoginOptions: React.FC<LoginOptionsProps> = ({
  saveUser,
  onSaveUserChange,
  onForgotPassword,
}) => {
  return (
    <div className={styles.formOptions}>
      <div className={styles.saveUserOption}>
        <input
          type="checkbox"
          id="saveUser"
          checked={saveUser}
          onChange={e => onSaveUserChange(e.target.checked)}
        />
        <label htmlFor="saveUser">Salvar usuário</label>
      </div>

      <div className={styles.forgotPasswordOption}>
        <a
          href="#"
          onClick={e => {
            e.preventDefault();
            onForgotPassword();
          }}
        >
          Esqueci minha senha
        </a>
      </div>
    </div>
  );
};
