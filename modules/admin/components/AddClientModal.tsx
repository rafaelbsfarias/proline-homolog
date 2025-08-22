import React, { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from './AddUserModal.module.css'; // Reutilizando estilos do modal de usuário
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import { maskCPF, maskCNPJ, maskPhone } from '@/modules/common/utils/maskers';
import CurrencyInput from '@/modules/common/components/CurrencyInput'; // Import CurrencyInput

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
    parqueamento: undefined as number | undefined, // Change type to number | undefined
    quilometragem: undefined as number | undefined, // Change type to number | undefined
    percentualFipe: '', // Keep as string for now
    taxaOperacao: undefined as number | undefined, // Change type to number | undefined
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Estado para a mensagem de erro
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCloseErrorModal = () => {
    setError(null);
  };

  // Máscaras reutilizadas de utils/maskers

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

  const handleCurrencyChange = (name: string, value: number | undefined) => {
    setForm(prev => ({ ...prev, [name]: value }));
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
        taxaOperacao: form.taxaOperacao,
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
        parqueamento: undefined,
        quilometragem: undefined,
        percentualFipe: '',
        taxaOperacao: undefined,
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
              <CurrencyInput
                name="parqueamento"
                value={form.parqueamento}
                onChange={value => handleCurrencyChange('parqueamento', value)}
              />
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
              <CurrencyInput
                name="taxaOperacao"
                value={form.taxaOperacao}
                onChange={value => handleCurrencyChange('taxaOperacao', value)}
              />
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
          {success && (
            <MessageModal
              title="Sucesso"
              message="Cliente cadastrado com sucesso!"
              variant="success"
              onClose={() => {
                setSuccess(false);
                if (onSuccess) onSuccess();
                onClose();
              }}
            />
          )}
        </form>
        {error && <MessageModal message={error} onClose={handleCloseErrorModal} variant="error" />}
      </div>
    </div>
  );
};

export default AddClientModal;
