import React, { useEffect, useState } from 'react';
import styles from './AddUserModal.module.css'; // Reutilizando estilos do modal de usuário
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import { maskCNPJ, maskPhone } from '@/modules/common/utils/maskers';
import CurrencyInput from '@/modules/common/components/CurrencyInput'; // Import CurrencyInput

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
  const [categories, setCategories] = useState<{ id: string; key: string; name: string }[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [contractValue, setContractValue] = useState<number | undefined>(undefined); // Change state type to number | undefined
  const { post, get } = useAuthenticatedFetch();

  const handleCloseErrorModal = () => {
    setError(null);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setCatLoading(true);
      try {
        const res = await get<{
          success: boolean;
          categories: { id: string; key: string; name: string }[];
        }>('/api/admin/service-categories');
        if (mounted && res.ok && res.data?.success) {
          setCategories(res.data.categories || []);
        }
      } finally {
        if (mounted) setCatLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [get]);

  if (!isOpen) return null;

  // Máscaras reutilizadas de utils/maskers

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
        contractValue: contractValue, // Use contractValue directly (it's already a number)
        categoryKey:
          selectedCategoryKey && selectedCategoryKey !== '__new__'
            ? selectedCategoryKey
            : undefined,
        newCategoryName: selectedCategoryKey === '__new__' ? newCategoryName : undefined,
      };
      // Chamada para o endpoint unificado
      const res = await post('/api/admin/add-partner', payload);

      if (!res.ok) {
        throw new Error(res.error || 'Erro ao cadastrar parceiro');
      }
      setSuccess(true);
      setForm({ name: '', email: '', cnpj: '', companyName: '', phone: '' });
      setContractValue(undefined); // Reset contractValue
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
          <label>
            Valor do contrato (R$)
            <CurrencyInput
              name="contractValue"
              value={contractValue}
              onChange={setContractValue}
              placeholder="0,00"
              disabled={loading}
            />
          </label>
          <label>
            Categoria de serviço
            <select
              value={selectedCategoryKey}
              onChange={e => setSelectedCategoryKey(e.target.value)}
              disabled={catLoading}
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map(c => (
                <option key={c.id} value={c.key}>
                  {c.name}
                </option>
              ))}
              <option value="__new__">Adicionar nova categoria...</option>
            </select>
          </label>
          {selectedCategoryKey === '__new__' && (
            <label>
              Nova categoria
              <input
                name="newCategoryName"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Ex.: Funilaria Premium"
              />
            </label>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar Parceiro'}
          </button>
          {/* Mensagens de sucesso movidas para modal dedicado */}
        </form>
        {error && <MessageModal message={error} onClose={handleCloseErrorModal} variant="error" />}
        {success && (
          <MessageModal
            title="Sucesso"
            message={'Parceiro cadastrado com sucesso!\nUm convite foi enviado por email.'}
            variant="success"
            onClose={() => {
              setSuccess(false);
              if (onSuccess) onSuccess();
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AddPartnerModal;
