'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ClientCollectPointModal.module.css';

interface ClientCollectPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AddressFormData {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isCollectPoint: boolean;
}

const ClientCollectPointModal: React.FC<ClientCollectPointModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<AddressFormData>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    isCollectPoint: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Here you would typically make an API call to create the address
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSuccess();
      onClose();
      setFormData({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        isCollectPoint: true,
      });
    } catch {
      setError('Erro ao cadastrar endereço. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        isCollectPoint: true,
      });
      setError(null);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Adicionar Endereço de Coleta</h2>
          <button
            type="button"
            onClick={handleClose}
            className={styles.closeButton}
            disabled={loading}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="street" className={styles.label}>
                Rua *
              </label>
              <input
                type="text"
                id="street"
                value={formData.street}
                onChange={e => handleInputChange('street', e.target.value)}
                className={styles.input}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="number" className={styles.label}>
                Número *
              </label>
              <input
                type="text"
                id="number"
                value={formData.number}
                onChange={e => handleInputChange('number', e.target.value)}
                className={styles.input}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="complement" className={styles.label}>
                Complemento
              </label>
              <input
                type="text"
                id="complement"
                value={formData.complement}
                onChange={e => handleInputChange('complement', e.target.value)}
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="neighborhood" className={styles.label}>
                Bairro *
              </label>
              <input
                type="text"
                id="neighborhood"
                value={formData.neighborhood}
                onChange={e => handleInputChange('neighborhood', e.target.value)}
                className={styles.input}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="city" className={styles.label}>
                Cidade *
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={e => handleInputChange('city', e.target.value)}
                className={styles.input}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="state" className={styles.label}>
                Estado *
              </label>
              <select
                id="state"
                value={formData.state}
                onChange={e => handleInputChange('state', e.target.value)}
                className={styles.select}
                required
                disabled={loading}
              >
                <option value="">Selecione...</option>
                <option value="AC">Acre</option>
                <option value="AL">Alagoas</option>
                <option value="AP">Amapá</option>
                <option value="AM">Amazonas</option>
                <option value="BA">Bahia</option>
                <option value="CE">Ceará</option>
                <option value="DF">Distrito Federal</option>
                <option value="ES">Espírito Santo</option>
                <option value="GO">Goiás</option>
                <option value="MA">Maranhão</option>
                <option value="MT">Mato Grosso</option>
                <option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option>
                <option value="PA">Pará</option>
                <option value="PB">Paraíba</option>
                <option value="PR">Paraná</option>
                <option value="PE">Pernambuco</option>
                <option value="PI">Piauí</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="RN">Rio Grande do Norte</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rondônia</option>
                <option value="RR">Roraima</option>
                <option value="SC">Santa Catarina</option>
                <option value="SP">São Paulo</option>
                <option value="SE">Sergipe</option>
                <option value="TO">Tocantins</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="zipCode" className={styles.label}>
                CEP *
              </label>
              <input
                type="text"
                id="zipCode"
                value={formData.zipCode}
                onChange={e => handleInputChange('zipCode', e.target.value)}
                className={styles.input}
                placeholder="00000-000"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isCollectPoint}
                onChange={e => handleInputChange('isCollectPoint', e.target.checked)}
                disabled={loading}
              />
              <span className={styles.checkboxText}>Este endereço é um ponto de coleta</span>
            </label>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Endereço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ClientCollectPointModal;
