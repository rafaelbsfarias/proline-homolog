import React, { useEffect, useState } from 'react';
import styles from './AddUserModal.module.css'; // Reutilizando estilos do modal de usuário
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import { maskCNPJ, maskPhone } from '@/modules/common/utils/maskers';
import Radio from '@/modules/common/components/Radio/Radio'; // Import Radio component
import Input from '@/modules/common/components/Input/Input'; // Import Input componen
import Modal from '@/modules/common/components/Modal/Modal'; // Import Modal component
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import Select from '@/modules/common/components/Select/Select'; // Import Select component

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
  const [categoryType, setCategoryType] = useState<'comercializacao' | 'preparacao'>(
    'comercializacao'
  ); // New state for category type
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
        newCategoryType: selectedCategoryKey === '__new__' ? categoryType : undefined,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Parceiro" size="lg">
      <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
        <div className={styles.formRow}>
          <Input
            id="partnerName"
            name="name"
            label="Representante da Empresa"
            value={form.name}
            onChange={handleChange}
            required
          />
          <Input
            id="partnerEmail"
            name="email"
            label="E-mail"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.formRow}>
          <Input
            id="partnerCnpj"
            name="cnpj"
            label="CNPJ"
            value={form.cnpj}
            onChange={handleChange}
            required
            mask="00.000.000/0000-00"
          />
          <Input
            id="companyName"
            name="companyName"
            label="Razão Social"
            value={form.companyName}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.formRow}>
          <Input
            id="partnerPhone"
            name="phone"
            label="Telefone"
            value={form.phone}
            onChange={handleChange}
            required
            mask="(00) 00000-0000"
          />
          <Input
            id="contractValue"
            name="contractValue"
            label="Valor do contrato"
            value={contractValue}
            onChange={handleChange}
            onAccept={(value: number) => setContractValue(value)}
            mask={Number}
            placeholder="R$ 0,00"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <Select
            id="serviceCategory"
            name="serviceCategory"
            label="Categoria de serviço"
            value={selectedCategoryKey}
            onChange={e => setSelectedCategoryKey(e.target.value)}
            disabled={catLoading}
            options={[
              { value: '', label: 'Selecione uma categoria...' },
              ...categories.map(c => ({ value: c.key, label: c.name })),
              { value: '__new__', label: 'Adicionar nova categoria...' },
            ]}
            placeholder="Selecione uma categoria..."
          />
          {/*  <ErrorMessage message={errors.categoryKey} /> */}
        </div>
        {selectedCategoryKey === '__new__' && (
          <>
            <Input
              id="newCategoryName"
              name="newCategoryName"
              label="Nova categoria"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="Ex.: Funilaria Premium"
            />
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tipo de Categoria:</label>
              <div className={styles.radioGroupContainer}>
                <div>
                  <Radio
                    name="categoryType"
                    label="Comercialização"
                    value="comercializacao"
                    checked={categoryType === 'comercializacao'}
                    onChange={() => setCategoryType('comercializacao')}
                  />
                  <Radio
                    name="categoryType"
                    label="Preparação"
                    value="preparacao"
                    checked={categoryType === 'preparacao'}
                    onChange={() => setCategoryType('preparacao')}
                  />
                </div>
              </div>
            </div>
          </>
        )}
        <div className={styles.formActions}>
          <OutlineButton onClick={onClose} disabled={loading}>
            Cancelar
          </OutlineButton>
          <SolidButton type="submit" disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar Parceiro'}
          </SolidButton>
        </div>
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
    </Modal>
  );
};

export default AddPartnerModal;
