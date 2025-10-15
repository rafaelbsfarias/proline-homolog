import React, { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import Modal from '@/modules/common/components/Modal/Modal';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import Input from '@/modules/common/components/Input/Input';
import Select from '@/modules/common/components/Select/Select';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import { z } from 'zod';
import styles from './AddUserModal.module.css';
import ErrorMessage from '@/modules/common/components/ErroMessage/ErrorMessage';

// Schema Zod
const userSchema = z.object({
  name: z.string().min(3, 'O nome precisa ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'specialist'], { message: 'Selecione um perfil válido' }),
});

type UserForm = z.infer<typeof userSchema>;

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState<UserForm>({ name: '', email: '', role: 'admin' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { post } = useAuthenticatedFetch();

  const handleCloseErrorModal = () => setError(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' })); // limpa erro ao digitar
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    try {
      const validatedData = userSchema.parse(form); // valida Zod

      const res = await post('/api/admin/create-user', validatedData);
      if (!res.ok) throw new Error(res.error || 'Erro ao criar usuário');

      setSuccess(true);
      setForm({ name: '', email: '', role: 'admin' });
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

  const handleClose = () => {
    onClose();
    setForm({ name: '', email: '', role: 'admin' });
    setError(null);
    setSuccess(false);
    setFieldErrors({});
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Usuário" size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input id="name" name="name" label="Nome" value={form.name} onChange={handleChange} />
        <ErrorMessage message={fieldErrors.name} />

        <Input
          id="email"
          name="email"
          label="E-mail"
          type="email"
          value={form.email}
          onChange={handleChange}
        />
        <ErrorMessage message={fieldErrors.email} />

        <Select
          id="role"
          name="role"
          label="Perfil"
          value={form.role}
          onChange={handleChange}
          options={[
            { value: 'admin', label: 'Administrador' },
            { value: 'specialist', label: 'Especialista' },
          ]}
        />
        <ErrorMessage message={fieldErrors.role} />

        <div className={styles.formActions}>
          <OutlineButton onClick={handleClose} disabled={loading}>
            Cancelar
          </OutlineButton>
          <SolidButton type="submit" disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar Usuário'}
          </SolidButton>
        </div>
      </form>

      {error && <MessageModal message={error} onClose={handleCloseErrorModal} variant="error" />}
      {success && (
        <MessageModal
          title="Sucesso"
          message="Usuário criado com sucesso!"
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

export default AddUserModal;
