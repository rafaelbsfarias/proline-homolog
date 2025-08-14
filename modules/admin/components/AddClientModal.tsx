import React, { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from './AddUserModal.module.css'; // Reutilizando estilos do modal de usuário
import ErrorModal from '@/modules/common/components/ErrorModal'; // Importar o novo modal de erro

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { post } = useAuthenticatedFetch();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    documentType: 'CPF',
    document: '',
    parqueamento: '',
    quilometragem: '',
    percentualFipe: '',
    taxaOperacao: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Estado para a mensagem de erro
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCloseErrorModal = () => {
    setError(null);
  };

  // Máscara de CPF
  function maskCPF(value: string) {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  }
  // Máscara de CNPJ
  function maskCNPJ(value: string) {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .slice(0, 18);
  }

  // Máscara de telefone (99) 9 9999-9999 ou (99) 9999-9999
  function maskPhone(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').slice(0, 15);
    } else {
      return digits.replace(/(\d{2})(\d{1})(\d{4})(\d{0,4})/, '($1) $2 $3-$4').slice(0, 16);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'documentType') {
      setForm({ ...form, documentType: e.target.value, document: '' });
    } else if (e.target.name === 'document') {
      setForm({
        ...form,
        document: form.documentType === 'CPF' ? maskCPF(e.target.value) : maskCNPJ(e.target.value),
      });
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
        role: 'client', // Definindo o papel explicitamente
        phone: form.phone,
        documentType: form.documentType,
        document: form.document,
        parqueamento: form.parqueamento,
        quilometragem: form.quilometragem,
        percentualFipe: parseFloat(form.percentualFipe),
        taxaOperacao: parseFloat(form.taxaOperacao),
      };
      // Chamada para o endpoint unificado
      const res = await post('/api/admin/add-client', payload);
      if (!res.ok) throw new Error(res.error || 'Erro ao cadastrar cliente');
      setSuccess(true);
      setForm({
        name: '',
        email: '',
        phone: '',
        documentType: 'CPF',
        document: '',
        parqueamento: '',
        quilometragem: '',
        percentualFipe: '',
        taxaOperacao: '',
      });
      if (onSuccess) onSuccess();
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
        <h2>Adicionar Cliente</h2>
        <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
          <div className={styles.formRow}>
            <label>
              Nome completo
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label>
              Telefone
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </label>
            <label>
              Tipo de Documento
              <select
                name="documentType"
                value={form.documentType}
                onChange={handleChange}
                required
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </label>
          </div>
          <div className={styles.formRow}>
            <label>
              {form.documentType}
              <input
                name="document"
                value={form.document}
                onChange={handleChange}
                required
                maxLength={form.documentType === 'CPF' ? 14 : 18}
              />
            </label>
            <label>
              Parqueamento
              <input name="parqueamento" value={form.parqueamento} onChange={handleChange} />
            </label>
          </div>
          <div className={styles.formRow}>
            <label>
              Quilometragem
              <input name="quilometragem" value={form.quilometragem} onChange={handleChange} />
            </label>
            <label>
              Percentual FIPE
              <input name="percentualFipe" value={form.percentualFipe} onChange={handleChange} />
            </label>
          </div>
          <div className={styles.formRow}>
            <label>
              Taxa de Operação
              <input name="taxaOperacao" value={form.taxaOperacao} onChange={handleChange} />
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
          {success && <div className={styles.success}>Cliente cadastrado com sucesso!</div>}
        </form>
        {error && <ErrorModal message={error} onClose={handleCloseErrorModal} />}
      </div>
    </div>
  );
};

export default AddClientModal;
