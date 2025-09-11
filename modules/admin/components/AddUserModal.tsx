import React, { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from './AddUserModal.module.css';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', role: 'admin' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { post } = useAuthenticatedFetch();

  if (!isOpen) return null;

  const handleCloseErrorModal = () => {
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Payload para o endpoint unificado /api/admin/create-user
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role, // O papel já vem do formulário (admin ou especialista)
      };
      const res = await post('/api/admin/create-user', payload);
      if (!res.ok) throw new Error(res.error || 'Erro ao criar usuário');
      // Mostrar modal de sucesso ao invés de mensagem no rodapé
      setSuccess(true);
      setForm({ name: '', email: '', role: 'admin' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <h2>Adicionar Usuário</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Nome
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            E-mail
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            {/* Campo de senha removido: senha será definida pelo usuário via convite Supabase */}
          </label>
          <label>
            Perfil
            <select name="role" value={form.role} onChange={handleChange} required>
              <option value="admin">Administrador</option>
              <option value="specialist">Especialista</option>
            </select>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar Usuário'}
          </button>
          {/* Mensagem de sucesso movida para modal dedicado */}
        </form>
        {error && <MessageModal message={error} onClose={handleCloseErrorModal} variant="error" />}
        {success && (
          <MessageModal
            title="Sucesso"
            message="Usuário criado com sucesso!"
            variant="success"
            onClose={() => {
              setSuccess(false);
              // Notificar e fechar após confirmação
              if (onSuccess) onSuccess();
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AddUserModal;
