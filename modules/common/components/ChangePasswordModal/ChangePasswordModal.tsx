'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import Input from '../Input/Input';
import ErrorMessage from '../ErroMessage/ErrorMessage';
import styles from './ChangePasswordModal.module.css';
import { OutlineButton } from '../OutlineButton/OutlineButton';
import { SolidButton } from '../SolidButton/SolidButton';
import MessageModal from '../MessageModal/MessageModal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPassword: string) => Promise<any>;
  onSuccess?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setError(null);
      setLoading(false);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setError(null);
    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (newPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(newPassword);
      setSuccess(true);
    } catch (e) {
      if (
        e instanceof Error &&
        e.message === 'New password should be different from the old password.'
      ) {
        setError('A nova senha deve ser diferente da senha anterior.');
      } else {
        setError(e instanceof Error ? e.message : 'Ocorreu um erro inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // State is reset by useEffect on open, so we can just call onClose
    onClose();
  };

  const handleSuccessClose = () => {
    setSuccess(false);
    onSuccess?.();
    handleClose();
  };

  return (
    <>
      {isOpen && !success && (
        <Modal isOpen={true} onClose={handleClose} title="Alterar Senha">
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

            <ErrorMessage message={error || undefined} />

            <div className={styles.buttonGroup}>
              <OutlineButton onClick={handleClose} disabled={loading}>
                Cancelar
              </OutlineButton>
              <SolidButton type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </SolidButton>
            </div>
          </form>
        </Modal>
      )}
      {isOpen && success && (
        <MessageModal
          title="Sucesso"
          message="Senha alterada com sucesso!"
          variant="success"
          onClose={handleSuccessClose}
        />
      )}
    </>
  );
};

export default ChangePasswordModal;
