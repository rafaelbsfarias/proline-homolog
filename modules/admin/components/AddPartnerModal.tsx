import React, { useState } from 'react';
import styles from './AddUserModal.module.css'; // Reutilizando estilos do modal de usuário
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import ErrorModal from '@/modules/common/components/ErrorModal'; // Importar o novo modal de erro

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddPartnerModal: React.FC<AddPartnerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    cnpj: '',
    companyName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { post } = useAuthenticatedFetch();

  if (!isOpen) return null;

  const handleCloseErrorModal = () => {
    setError(null);
  };

  // Função para aplicar máscara de CNPJ
  function maskCNPJ(value: string) {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .slice(0, 18);
  }

  // Função para aplicar máscara de telefone
  function maskPhone(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      // (99) 9999-9999
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').slice(0, 15);
    } else {
      // (99) 9 9999-9999
      return digits.replace(/(\d{2})(\d{1})(\d{4})(\d{0,4})/, '($1) $2 $3-$4').slice(0, 16);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'cnpj') {
      setForm({ ...form, cnpj: maskCNPJ(e.target.value) });
    } else if (e.target.name === 'phone') {
      setForm({ ...form, phone: maskPhone(e.target.value) });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
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
        role: 'partner', // Definindo o papel explicitamente
        phone: form.phone,
        documentType: 'CNPJ', // Assumindo CNPJ para parceiros
        document: form.cnpj,
        companyName: form.companyName,
      };
      // Chamada para o endpoint unificado
      const res = await post('/api/admin/add-partner', payload);

      if (!res.ok) {
        throw new Error(res.error || 'Erro ao cadastrar parceiro');
      }
      setSuccess(true);
      setForm({ name: '', email: '', cnpj: '', companyName: '', phone: '' });
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
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
        <h2>Adicionar Parceiro</h2>
        <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
          <label>
            Representante da Empresa
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            E-mail
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            CNPJ
            <input name="cnpj" value={form.cnpj} onChange={handleChange} required maxLength={18} />
          </label>
          <label>
            Razão Social
            <input name="companyName" value={form.companyName} onChange={handleChange} required />
          </label>
          <label>
            Telefone
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar Parceiro'}
          </button>
          {success && (
            <div className={styles.success}>
              <p>Parceiro cadastrado com sucesso!</p>
              <p>Um convite foi enviado por email.</p>
            </div>
          )}
        </form>
        {error && <ErrorModal message={error} onClose={handleCloseErrorModal} />}
      </div>
    </div>
  );
};

export default AddPartnerModal;
