import React, { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from './AddUserModal.module.css';
import Modal from '@/modules/common/components/Modal/Modal';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import Input from '@/modules/common/components/Input/Input';
import CurrencyInput from '@/modules/common/components/CurrencyInput';
import { maskCPF, maskCNPJ, maskPhone } from '@/modules/common/utils/maskers';
import Select from '@/modules/common/components/Select/Select';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import { z } from 'zod';
import ErrorMessage from '@/modules/common/components/ErroMessage/ErrorMessage';

const clientSchema = z.object({
  name: z.string().min(3, 'O nome precisa ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  documentType: z.enum(['CPF', 'CNPJ']),
  document: z.string().min(11, 'Documento inválido'),
  parqueamento: z
    .number({ required_error: 'Parqueamento é obrigatório' })
    .nonnegative('Parqueamento deve ser positivo'),
  taxaOperacao: z
    .number({ required_error: 'Taxa de Operação é obrigatória' })
    .nonnegative('Taxa de Operação deve ser positiva'),
});

type ClientForm = z.infer<typeof clientSchema>;

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { post } = useAuthenticatedFetch();

  const [form, setForm] = useState<ClientForm>({
    name: '',
    email: '',
    phone: '',
    documentType: 'CPF',
    document: '',
    parqueamento: undefined,
    taxaOperacao: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setError(null);
      setSuccess(false);
      setFieldErrors({});
    }
  }, [isOpen]);

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      documentType: 'CPF',
      document: '',
      parqueamento: undefined,
      taxaOperacao: undefined,
    });
    setFieldErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'documentType') {
      setForm(prev => ({ ...prev, documentType: value as 'CPF' | 'CNPJ', document: '' }));
    } else if (name === 'document') {
      setForm(prev => ({
        ...prev,
        document: form.documentType === 'CPF' ? maskCPF(value) : maskCNPJ(value),
      }));
    } else if (name === 'phone') {
      setForm(prev => ({ ...prev, phone: maskPhone(value) }));
    } else if (['percentualFipe', 'quilometragem', 'parqueamento', 'taxaOperacao'].includes(name)) {
      setForm(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCurrencyChange = (name: keyof ClientForm, value: number | undefined) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    try {
      const validatedData = clientSchema.parse(form);

      const res = await post('/api/admin/add-client', validatedData);
      if (!res.ok) throw new Error(res.error || 'Erro ao cadastrar cliente');

      setSuccess(true);
      resetForm();
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) errors[e.path[0] as string] = e.message;
        });
        setFieldErrors(errors);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro desconhecido');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseErrorModal = () => setError(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Cliente" size="lg">
      <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
        {/* Nome e Email */}
        <div className={styles.formRow}>
          <div>
            <Input
              id="name"
              name="name"
              label="Nome completo"
              value={form.name}
              onChange={handleChange}
            />
            <ErrorMessage message={fieldErrors.name} />
          </div>
          <div>
            <Input
              id="email"
              name="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
            <ErrorMessage message={fieldErrors.email} />
          </div>
        </div>

        {/* Telefone e Tipo de Documento */}
        <div className={styles.formRow}>
          <div>
            <Input
              id="phone"
              name="phone"
              label="Telefone"
              value={form.phone}
              onChange={handleChange}
              mask="(00) 00000-0000"
            />
            <ErrorMessage message={fieldErrors.phone} />
          </div>
          <div>
            <Select
              id="documentType"
              name="documentType"
              label="Tipo de Documento"
              value={form.documentType}
              onChange={handleChange}
              options={[
                { value: 'CPF', label: 'CPF' },
                { value: 'CNPJ', label: 'CNPJ' },
              ]}
              placeholder="Selecione o tipo"
            />
          </div>
        </div>

        {/* Documento e Parqueamento */}
        <div className={styles.formRow}>
          <div>
            <Input
              id="document"
              name="document"
              label={form.documentType}
              value={form.document}
              onChange={handleChange}
              mask={form.documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
            />
            <ErrorMessage message={fieldErrors.document} />
          </div>
          <div>
            <CurrencyInput
              name="parqueamento"
              label="Parqueamento"
              value={form.parqueamento}
              onChange={value => handleCurrencyChange('parqueamento', value)}
            />
            <ErrorMessage message={fieldErrors.parqueamento} />
          </div>
        </div>

        {/* Taxa de Operação */}
        <div className={styles.formRow}>
          <div>
            <CurrencyInput
              name="taxaOperacao"
              label="Taxa de Operação"
              value={form.taxaOperacao}
              onChange={value => handleCurrencyChange('taxaOperacao', value)}
            />
            <ErrorMessage message={fieldErrors.taxaOperacao} />
          </div>
        </div>

        {/* Ações */}
        <div className={styles.formActions}>
          <OutlineButton onClick={onClose} disabled={loading}>
            Cancelar
          </OutlineButton>
          <SolidButton type="submit" disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar Cliente'}
          </SolidButton>
        </div>
      </form>

      {success && (
        <MessageModal
          title="Sucesso"
          message="Cliente cadastrado com sucesso!"
          variant="success"
          onClose={() => {
            setSuccess(false);
            onClose();
          }}
        />
      )}

      {error && <MessageModal message={error} onClose={handleCloseErrorModal} variant="error" />}
    </Modal>
  );
};

export default AddClientModal;
