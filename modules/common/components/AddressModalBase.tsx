'use client';
import React, { useEffect, useState } from 'react';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import { validateCEP, sanitizeString } from '@/modules/common/utils/inputSanitization';
import '@/modules/vehicles/components/VehicleRegistrationModal.css';

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
  renderExtraFields?: (ctx: { loading: boolean }) => React.ReactNode; // for specializations
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
    if (errors[name as keyof AddressFormValues]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vehicle-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="zip_code" className="required">
                CEP
              </label>
              <input
                id="zip_code"
                name="zip_code"
                value={form.zip_code}
                onChange={handleChange}
                placeholder="00000-000"
                required
              />
              {errors.zip_code && <span className="error-message">{errors.zip_code}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="street" className="required">
                Rua
              </label>
              <input
                id="street"
                name="street"
                value={form.street}
                onChange={handleChange}
                required
              />
              {errors.street && <span className="error-message">{errors.street}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="number" className="required">
                Número
              </label>
              <input
                id="number"
                name="number"
                value={form.number}
                onChange={handleChange}
                required
              />
              {errors.number && <span className="error-message">{errors.number}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="neighborhood" className="required">
                Bairro
              </label>
              <input
                id="neighborhood"
                name="neighborhood"
                value={form.neighborhood}
                onChange={handleChange}
                required
              />
              {errors.neighborhood && <span className="error-message">{errors.neighborhood}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city" className="required">
                Cidade
              </label>
              <input id="city" name="city" value={form.city} onChange={handleChange} required />
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="state" className="required">
                Estado
              </label>
              <input id="state" name="state" value={form.state} onChange={handleChange} required />
              {errors.state && <span className="error-message">{errors.state}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="complement">Complemento (opcional)</label>
              <input
                id="complement"
                name="complement"
                value={form.complement || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          {renderExtraFields?.({ loading })}

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading} className="cancel-button">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Salvando...' : 'Salvar Endereço'}
            </button>
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
      </div>
    </div>
  );
}
