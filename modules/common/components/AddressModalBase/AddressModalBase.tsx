'use client';
import React, { useEffect, useState } from 'react';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import { validateCEP, sanitizeString } from '@/modules/common/utils/inputSanitization';
import Input from '@/modules/common/components/Input/Input';
import Modal from '@/modules/common/components/Modal/Modal';
import { OutlineButton } from '../OutlineButton/OutlineButton';
import { SolidButton } from '../SolidButton/SolidButton';
import styles from './AddressModalBase.module.css';

export interface AddressFormValues {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  complement?: string;
}

export interface AddressModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  initialValues?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => Promise<{ success: boolean; message?: string } | void>;
  renderExtraFields?: (ctx: { loading: boolean }) => React.ReactNode;
}

export default function AddressModalBase({
  isOpen,
  onClose,
  title = 'Adicionar Endereço',
  initialValues,
  onSubmit,
  renderExtraFields,
}: AddressModalBaseProps) {
  const [form, setForm] = useState<AddressFormValues>({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormValues, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(prev => ({
        ...prev,
        street: initialValues?.street ?? '',
        number: initialValues?.number ?? '',
        neighborhood: initialValues?.neighborhood ?? '',
        city: initialValues?.city ?? '',
        state: initialValues?.state ?? '',
        zip_code: initialValues?.zip_code ?? '',
        complement: initialValues?.complement ?? '',
      }));
      setErrors({});
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, initialValues]);

  const validate = () => {
    const newErrors: Partial<Record<keyof AddressFormValues, string>> = {};
    if (!form.street.trim()) newErrors.street = 'Rua é obrigatória';
    if (!form.number.trim()) newErrors.number = 'Número é obrigatório';
    if (!form.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
    if (!form.city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!form.state.trim()) newErrors.state = 'Estado é obrigatório';
    if (!form.zip_code.trim()) {
      newErrors.zip_code = 'CEP é obrigatório';
    } else if (!validateCEP(form.zip_code)) {
      newErrors.zip_code = 'CEP inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof AddressFormValues])
      setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const sanitized: AddressFormValues = {
        street: sanitizeString(form.street),
        number: sanitizeString(form.number),
        neighborhood: sanitizeString(form.neighborhood),
        city: sanitizeString(form.city),
        state: sanitizeString(form.state),
        zip_code: sanitizeString(form.zip_code),
        complement: form.complement ? sanitizeString(form.complement) : undefined,
      };
      const res = await onSubmit(sanitized);
      if (!res || res.success) {
        setSuccess(res?.message || 'Endereço salvo com sucesso!');
      } else {
        setError(res.message || 'Falha ao salvar endereço');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar endereço');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className={styles.addressModalForm}>
        <div className={styles.formRow}>
          <div>
            <Input
              id="zip_code"
              name="zip_code"
              label="CEP"
              value={form.zip_code}
              onChange={handleChange}
              placeholder="00000-000"
              required
            />
            {errors.zip_code && <span className="error-message">{errors.zip_code}</span>}
          </div>
          <div>
            <Input
              id="street"
              name="street"
              label="Rua"
              value={form.street}
              onChange={handleChange}
              required
            />
            {errors.street && <span className="error-message">{errors.street}</span>}
          </div>
        </div>

        <div className={styles.formRow}>
          <div>
            <Input
              id="number"
              name="number"
              label="Número"
              value={form.number}
              onChange={handleChange}
              required
            />
            {errors.number && <span className="error-message">{errors.number}</span>}
          </div>
          <div>
            <Input
              id="neighborhood"
              name="neighborhood"
              label="Bairro"
              value={form.neighborhood}
              onChange={handleChange}
              required
            />
            {errors.neighborhood && <span className="error-message">{errors.neighborhood}</span>}
          </div>
        </div>

        <div className={styles.formRow}>
          <div>
            <Input
              id="city"
              name="city"
              label="Cidade"
              value={form.city}
              onChange={handleChange}
              required
            />
            {errors.city && <span className="error-message">{errors.city}</span>}
          </div>
          <div>
            <Input
              id="state"
              name="state"
              label="Estado"
              value={form.state}
              onChange={handleChange}
              required
            />
            {errors.state && <span className="error-message">{errors.state}</span>}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className="full-width">
            <Input
              id="complement"
              name="complement"
              label="Complemento (opcional)"
              value={form.complement || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        {renderExtraFields?.({ loading })}

        <div className={styles.formActions}>
          <OutlineButton onClick={onClose} disabled={loading}>
            Cancelar
          </OutlineButton>
          <SolidButton type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar Endereço'}
          </SolidButton>
        </div>
      </form>

      {error && <MessageModal message={error} variant="error" onClose={() => setError(null)} />}
      {success && (
        <MessageModal
          title="Sucesso"
          message={success}
          variant="success"
          onClose={() => {
            setSuccess(null);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}
