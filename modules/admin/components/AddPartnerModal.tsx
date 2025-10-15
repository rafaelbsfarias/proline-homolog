import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import styles from './AddUserModal.module.css';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { maskCNPJ, maskPhone } from '@/modules/common/utils/maskers';
import Radio from '@/modules/common/components/Radio/Radio';
import Input from '@/modules/common/components/Input/Input';
import Modal from '@/modules/common/components/Modal/Modal';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import Select from '@/modules/common/components/Select/Select';
import CurrencyInput from '@/modules/common/components/CurrencyInput';
import ErrorMessage from '@/modules/common/components/ErroMessage/ErrorMessage';

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const partnerSchema = z.object({
  name: z
    .string({
      required_error: 'O nome do representante é obrigatório',
      invalid_type_error: 'O nome do representante é obrigatório',
    })
    .regex(/^[A-Za-zÀ-ÿ\s]+$/, 'O nome não pode conter números ou caracteres especiais')
    .min(2, 'O nome do representante deve ter pelo menos 2 caracteres')
    .refine(val => val.trim() !== '', { message: 'O nome do representante é obrigatório' }),
  email: z
    .string({
      required_error: 'O e-mail é obrigatório',
    })
    .email('E-mail inválido'),
  cnpj: z
    .string({
      required_error: 'O CNPJ é obrigatório',
    })
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  companyName: z
    .string({
      required_error: 'A razão social é obrigatória',
    })
    .min(2, 'A razão social deve ter pelo menos 2 caracteres'),
  phone: z
    .string({
      required_error: 'O telefone é obrigatório',
    })
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido'),
  contractValue: z
    .number({
      required_error: 'O valor do contrato é obrigatório',
      invalid_type_error: 'O valor do contrato deve ser um número válido',
    })
    .min(1, 'O valor do contrato deve ser maior que zero'),
  categoryKey: z.string().optional(),
  newCategoryName: z.string().optional(),
  newCategoryType: z.enum(['comercializacao', 'preparacao']).optional(),
});

export const AddPartnerModal: React.FC<AddPartnerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    cnpj: '',
    companyName: '',
    phone: '',
  });
  const [contractValue, setContractValue] = useState<number>(0);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'comercializacao' | 'preparacao'>(
    'comercializacao'
  );

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; key: string; name: string }[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { post, get } = useAuthenticatedFetch();

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

  // Função para resetar o estado do formulário e erros
  const resetForm = () => {
    setForm({ name: '', email: '', cnpj: '', companyName: '', phone: '' });
    setContractValue(0);
    setSelectedCategoryKey('');
    setNewCategoryName('');
    setCategoryType('comercializacao');
    setErrors({});
  };

  // Função para fechar modal com limpeza do form
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cnpj') setForm(prev => ({ ...prev, cnpj: maskCNPJ(value) }));
    else if (name === 'phone') setForm(prev => ({ ...prev, phone: maskPhone(value) }));
    else setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const payloadToValidate = {
      ...form,
      contractValue,
      categoryKey:
        selectedCategoryKey && selectedCategoryKey !== '__new__' ? selectedCategoryKey : undefined,
      newCategoryName: selectedCategoryKey === '__new__' ? newCategoryName : undefined,
      newCategoryType: selectedCategoryKey === '__new__' ? categoryType : undefined,
    };

    try {
      partnerSchema.parse(payloadToValidate);

      const res = await post('/api/admin/add-partner', payloadToValidate);
      if (!res.ok) throw new Error(res.error || 'Erro ao cadastrar parceiro');

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: err instanceof Error ? err.message : 'Erro inesperado' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Parceiro" size="lg">
      <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
        {/* Linha 1 */}
        <div className={styles.formRow}>
          <div>
            <Input
              id="partnerName"
              name="name"
              label="Representante da Empresa"
              value={form.name}
              onChange={handleChange}
            />
            <ErrorMessage message={errors.name} />
          </div>
          <div>
            <Input
              id="partnerEmail"
              name="email"
              label="E-mail"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
            <ErrorMessage message={errors.email} />
          </div>
        </div>

        {/* Linha 2 */}
        <div className={styles.formRow}>
          <div>
            <Input
              id="partnerCnpj"
              name="cnpj"
              label="CNPJ"
              value={form.cnpj}
              onChange={handleChange}
            />
            <ErrorMessage message={errors.cnpj} />
          </div>
          <div>
            <Input
              id="companyName"
              name="companyName"
              label="Razão Social"
              value={form.companyName}
              onChange={handleChange}
            />
            <ErrorMessage message={errors.companyName} />
          </div>
        </div>

        {/* Linha 3 */}
        <div className={styles.formRow}>
          <div>
            <Input
              id="partnerPhone"
              name="phone"
              label="Telefone"
              value={form.phone}
              onChange={handleChange}
            />
            <ErrorMessage message={errors.phone} />
          </div>
          <div>
            <CurrencyInput
              id="contractValue"
              name="contractValue"
              label="Valor do contrato"
              value={contractValue}
              onChange={(val: number) => setContractValue(val)}
              placeholder="R$ 0,00"
            />
            <ErrorMessage message={errors.contractValue} />
          </div>
        </div>

        {/* Categoria */}
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
          />
          <ErrorMessage message={errors.categoryKey} />
        </div>

        {/* Nova categoria */}
        {selectedCategoryKey === '__new__' && (
          <>
            <div className={styles.formGroup}>
              <Input
                id="newCategoryName"
                name="newCategoryName"
                label="Nova categoria"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
              <ErrorMessage message={errors.newCategoryName} />
            </div>
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
              <ErrorMessage message={errors.newCategoryType} />
            </div>
          </>
        )}

        {/* Botões */}
        <div className={styles.formActions}>
          <OutlineButton onClick={handleClose} disabled={loading}>
            Cancelar
          </OutlineButton>
          <SolidButton type="submit" disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar Parceiro'}
          </SolidButton>
        </div>

        {/* Erro geral */}
        <ErrorMessage message={errors.general} />
      </form>
    </Modal>
  );
};

export default AddPartnerModal;
