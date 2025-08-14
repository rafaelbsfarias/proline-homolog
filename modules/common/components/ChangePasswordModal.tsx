'use client';

import React, { useState } from 'react';
import Modal from './Modal'; // Reutiliza o componente Modal existente
import FormInput from './FormInput'; // Reutiliza o componente FormInput existente
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import './ChangePasswordModal.css';

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
      <div className="change-password-modal-content">
        <div className="input-group">
          <FormInput
            label="Nova Senha"
            id="newPassword"
            name="newPassword"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <FormInput
            label="Confirmar Nova Senha"
            id="confirmNewPassword"
            name="confirmNewPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="password-toggle-section">
          <button
            type="button"
            className="toggle-password-visibility"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
          </button>
          <span>{showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}</span>
        </div>

        {(localError || error) && <div className="error-message">{localError || error}</div>}

        <div className="modal-actions">
          <button className="modal-button secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </button>
          <button className="modal-button primary" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
