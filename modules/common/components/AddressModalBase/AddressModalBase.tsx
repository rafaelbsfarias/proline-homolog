'use client';
import React, { useMemo } from 'react';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import Input from '@/modules/common/components/Input/Input';
import Modal from '@/modules/common/components/Modal/Modal';
import { OutlineButton } from '../OutlineButton/OutlineButton';
import { SolidButton } from '../SolidButton/SolidButton';
import ErrorMessage from '@/modules/common/components/ErroMessage/ErrorMessage';
import { useAddressForm, AddressFormValues } from '../../hooks/Address/useAddressForm';
import styles from './AddressModalBase.module.css';

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
  const {
    form,
    errors,
    loading,
    error,
    success,
    handleChange,
    handleSubmit,
    setError,
    setSuccess,
  } = useAddressForm(isOpen, initialValues, onSubmit);

  const isEditMode = useMemo(() => {
    return !!(initialValues && Object.values(initialValues).some(v => v));
  }, [initialValues]);

  const submitButtonText = isEditMode ? 'Salvar Alterações' : 'Cadastrar Endereço';

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
            />
            <ErrorMessage message={errors.zip_code} />
          </div>
          <div>
            <Input
              id="street"
              name="street"
              label="Rua"
              value={form.street}
              onChange={handleChange}
            />
            <ErrorMessage message={errors.street} />
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
            />
            <ErrorMessage message={errors.number} />
          </div>
          <div>
            <Input
              id="neighborhood"
              name="neighborhood"
              label="Bairro"
              value={form.neighborhood}
              onChange={handleChange}
            />
            <ErrorMessage message={errors.neighborhood} />
          </div>
        </div>

        <div className={styles.formRow}>
          <div>
            <Input id="city" name="city" label="Cidade" value={form.city} onChange={handleChange} />
            <ErrorMessage message={errors.city} />
          </div>
          <div>
            <Input
              id="state"
              name="state"
              label="Estado"
              value={form.state}
              onChange={handleChange}
            />
            <ErrorMessage message={errors.state} />
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
            <ErrorMessage message={errors.complement} />
          </div>
        </div>

        {renderExtraFields?.({ loading })}

        <div className={styles.formActions}>
          <OutlineButton onClick={onClose} disabled={loading}>
            Cancelar
          </OutlineButton>
          <SolidButton type="submit" disabled={loading}>
            {loading ? 'Salvando...' : submitButtonText}
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
