'use client';

import React, { useState } from 'react';
import './VehicleRegistrationModal.css';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { validatePlate, formatPlateInput, PLATE_ERROR_MESSAGES } from '../utils/plateValidation';

interface ClientVehicleRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface VehicleFormData {
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number | '';
  initialKm: number | '';
  fipeValue: number | '';
  observations: string;
}

interface FormErrors {
  plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: string;
  initialKm?: string;
  fipeValue?: string;
}

const ClientVehicleRegistrationModal: React.FC<ClientVehicleRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [formData, setFormData] = useState<VehicleFormData>({
    plate: '',
    brand: '',
    model: '',
    color: '',
    year: '',
    initialKm: '',
    fipeValue: '',
    observations: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleLicensePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPlateInput(e.target.value);
    setFormData(prev => ({
      ...prev,
      plate: formatted,
    }));

    if (errors.plate) {
      setErrors(prev => ({
        ...prev,
        plate: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.plate.trim()) {
      newErrors.plate = PLATE_ERROR_MESSAGES.REQUIRED;
    } else {
      if (!validatePlate(formData.plate)) {
        newErrors.plate = PLATE_ERROR_MESSAGES.INVALID_FORMAT;
      }
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Marca é obrigatória';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Modelo é obrigatório';
    }

    if (!formData.color.trim()) {
      newErrors.color = 'Cor é obrigatória';
    }

    if (!formData.year) {
      newErrors.year = 'Ano é obrigatório';
    } else {
      const currentYear = new Date().getFullYear();
      const year = Number(formData.year);
      if (year < 1900 || year > currentYear + 1) {
        newErrors.year = `Ano deve estar entre 1900 e ${currentYear + 1}`;
      }
    }

    if (formData.fipeValue !== '' && Number(formData.fipeValue) < 0) {
      newErrors.fipeValue = 'Valor FIPE deve ser positivo';
    }

    if (formData.initialKm !== '' && Number(formData.initialKm) < 0) {
      newErrors.initialKm = 'Quilometragem deve ser positiva';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        plate: formData.plate.trim().toUpperCase(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        color: formData.color.trim(),
        year: Number(formData.year),
        initialKm: formData.initialKm ? Number(formData.initialKm) : undefined,
        fipeValue: formData.fipeValue ? Number(formData.fipeValue) : undefined,
        observations: formData.observations.trim() || undefined,
      };

      const response = await authenticatedFetch('/api/client/create-vehicle', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(response.error || 'Erro ao cadastrar veículo');
      }

      // Reset form
      setFormData({
        plate: '',
        brand: '',
        model: '',
        color: '',
        year: '',
        initialKm: '',
        fipeValue: '',
        observations: '',
      });
      setErrors({});

      onSuccess?.();
      onClose();
    } catch (error) {
      setErrors({ plate: error instanceof Error ? error.message : 'Erro inesperado' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      plate: '',
      brand: '',
      model: '',
      color: '',
      year: '',
      initialKm: '',
      fipeValue: '',
      observations: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cadastrar Novo Veículo</h2>
          <button className="close-button" onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vehicle-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plate">Placa</label>
              <input
                type="text"
                id="plate"
                name="plate"
                value={formData.plate}
                onChange={handleLicensePlateChange}
                placeholder="ABC-1234 ou ABC-1D23"
                className={errors.plate ? 'error' : ''}
                disabled={loading}
                maxLength={8}
                required
              />
              {errors.plate && <span className="error-message">{errors.plate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="year">Ano</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                placeholder="2024"
                className={errors.year ? 'error' : ''}
                disabled={loading}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
              {errors.year && <span className="error-message">{errors.year}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="brand">Marca</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="Toyota, Volkswagen, etc."
                className={errors.brand ? 'error' : ''}
                disabled={loading}
                required
              />
              {errors.brand && <span className="error-message">{errors.brand}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="model">Modelo</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="Corolla, Golf, etc."
                className={errors.model ? 'error' : ''}
                disabled={loading}
                required
              />
              {errors.model && <span className="error-message">{errors.model}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color">Cor</label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="Branco, Preto, Azul, etc."
                className={errors.color ? 'error' : ''}
                disabled={loading}
                required
              />
              {errors.color && <span className="error-message">{errors.color}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="fipeValue">Valor FIPE (R$)</label>
              <input
                type="number"
                id="fipeValue"
                name="fipeValue"
                value={formData.fipeValue}
                onChange={handleInputChange}
                placeholder="50000"
                className={errors.fipeValue ? 'error' : ''}
                disabled={loading}
                min="0"
                step="0.01"
              />
              {errors.fipeValue && <span className="error-message">{errors.fipeValue}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="initialKm">Quilometragem Inicial</label>
              <input
                type="number"
                id="initialKm"
                name="initialKm"
                value={formData.initialKm}
                onChange={handleInputChange}
                placeholder="Ex: 50000"
                className={errors.initialKm ? 'error' : ''}
                disabled={loading}
                min="0"
              />
              {errors.initialKm && <span className="error-message">{errors.initialKm}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="observations">Observações</label>
              <textarea
                id="observations"
                name="observations"
                value={formData.observations}
                onChange={handleInputChange}
                placeholder="Observações adicionais sobre o veículo..."
                disabled={loading}
                rows={3}
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="cancel-button"
            >
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Cadastrando...' : 'Cadastrar Veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientVehicleRegistrationModal;
