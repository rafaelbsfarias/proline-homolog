import React, { useState } from 'react';
import styles from './ForceChangePasswordModal.module.css';
import { useForceChangePassword } from '@/modules/common/hooks/ForceChangePassword/useForceChangePassword';
import ErrorMessage from '../ErroMessage/ErrorMessage';

interface ForceChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { handleSubmit, loading, errors, setErrors } = useForceChangePassword(onSuccess, onError);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Redefinição de Senha</h2>
          <p>Você precisa alterar sua senha antes de continuar</p>
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(password, confirmPassword);
          }}
          className={styles.form}
        >
          <div className={styles.formGroup}>
            <label htmlFor="password">Nova senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setErrors((prev: { password?: string; confirmPassword?: string } | undefined) => ({
                  ...prev,
                  password: undefined,
                }));
              }}
            />
            <ErrorMessage message={errors.password} />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirme a nova senha</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                setErrors((prev: { password?: string; confirmPassword?: string } | undefined) => ({
                  ...prev,
                  confirmPassword: undefined,
                }));
              }}
            />
            <ErrorMessage message={errors.confirmPassword} />
          </div>

          <div className={styles.buttonGroup}>
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePasswordModal;
