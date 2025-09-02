'use client';

import React, { useState } from 'react';
import Modal from '../Modal/Modal'; // Reutiliza o componente Modal existente
import Input from '../Input/Input'; // Reutiliza o componente Input existente
import ErrorMessage from '../ErroMessage/ErrorMessage';
import styles from './ChangePasswordModal.module.css';
import { OutlineButton } from '../OutlineButton/OutlineButton';
import { SolidButton } from '../SolidButton/SolidButton';
interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPassword: string) => void;
  loading: boolean;
  error: string | null;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  error,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConfirm = () => {
    setLocalError(null);
    if (!newPassword || !confirmPassword) {
      setLocalError('Por favor, preencha todos os campos.');
      return;
    }
    if (newPassword.length < 8) {
      setLocalError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('As senhas não coincidem.');
      return;
    }
    onConfirm(newPassword);
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setLocalError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Alterar Senha">
      <form
        onSubmit={e => {
          e.preventDefault();
          handleConfirm();
        }}
        className={styles.form}
      >
        <Input
          label="Nova Senha"
          id="newPassword"
          name="newPassword"
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          disabled={loading}
        />

        <Input
          label="Confirmar Nova Senha"
          id="confirmNewPassword"
          name="confirmNewPassword"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={loading}
        />

        <ErrorMessage message={localError || error || undefined} />

        <div className={styles.buttonGroup}>
          <OutlineButton onClick={onClose} disabled={loading}>
            Cancelar
          </OutlineButton>
          <SolidButton type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </SolidButton>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
