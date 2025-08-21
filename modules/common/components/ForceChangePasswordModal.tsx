import React, { useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import styles from './ForceChangePasswordModal.module.css';

interface ForceChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Troca a senha do usuário logado
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // 2️⃣ Pega o ID do usuário logado
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error('Usuário não encontrado.');

      // 3️⃣ Atualiza must_change_password
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', userId);

      if (profileError) {
        setError('Senha alterada, mas falha ao atualizar perfil.');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Alterar Senha</h2>
        <p>Você precisa alterar sua senha antes de continuar.</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="password">Nova senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirme a nova senha</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
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
