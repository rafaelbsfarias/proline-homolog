import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import ClientSearch from './ClientSearch';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { validatePlate, formatPlateInput, PLATE_ERROR_MESSAGES } from '../utils/plateValidation';
import styles from './VehicleRegistrationModal.module.css';

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  fipe_value?: number;
  estimated_arrival_date?: string;
  status: string;
  created_at: string;
  client: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface VehicleRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vehicle: Vehicle) => void;
}

interface VehicleFormData {
  clientId: string;
  licensePlate: string;
  brand: string;
  model: string;
  color: string;
  year: number | '';
  fipeValue: number | '';
  estimatedArrivalDate: string;
}

interface FormErrors {
  clientId?: string;
  licensePlate?: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: string;
  fipeValue?: string;
  estimatedArrivalDate?: string;
}

interface VehicleFormData {
  clientId: string;
  licensePlate: string;
  brand: string;
  model: string;
  color: string;
  year: number | '';
  fipeValue: number | '';
  estimatedArrivalDate: string;
}

interface FormErrors {
  clientId?: string;
  licensePlate?: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: string;
  fipeValue?: string;
  estimatedArrivalDate?: string;
}

interface Client {
  id: string;
  full_name: string;
  email: string;
}

const VehicleRegistrationModal: React.FC<VehicleRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<VehicleFormData>({
    clientId: '',
    licensePlate: '',
    brand: '',
    model: '',
    color: '',
    year: '',
    fipeValue: '',
    estimatedArrivalDate: '',
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const { post } = useAuthenticatedFetch();

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        clientId: '',
        licensePlate: '',
        brand: '',
        model: '',
        color: '',
        year: '',
        fipeValue: '',
        estimatedArrivalDate: '',
      });
      setSelectedClient(null);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedClient) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.licensePlate) {
      newErrors.licensePlate = PLATE_ERROR_MESSAGES.REQUIRED;
    } else {
      if (!validatePlate(formData.licensePlate)) {
        newErrors.licensePlate = PLATE_ERROR_MESSAGES.INVALID_FORMAT;
      }
    }

    if (!formData.brand) {
      newErrors.brand = 'Marca é obrigatória';
    }

    if (!formData.model) {
      newErrors.model = 'Modelo é obrigatório';
    }

    if (!formData.color) {
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

    if (formData.estimatedArrivalDate) {
      const date = new Date(formData.estimatedArrivalDate);
      if (isNaN(date.getTime())) {
        newErrors.estimatedArrivalDate = 'Data inválida';
      }
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
        clientId: selectedClient!.id,
        licensePlate: formData.licensePlate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        brand: formData.brand,
        model: formData.model,
        color: formData.color,
        year: Number(formData.year),
        fipeValue: formData.fipeValue ? Number(formData.fipeValue) : undefined,
        estimatedArrivalDate: formData.estimatedArrivalDate || undefined,
      };

      const response = await post<{
        success: boolean;
        message: string;
        vehicle: Vehicle;
      }>('/api/admin/create-vehicle', payload);

      if (response.ok && response.data) {
        onSuccess(response.data.vehicle);
        onClose();
      } else {
        throw new Error(response.error || 'Erro ao cadastrar veículo');
      }
    } catch (error) {
      // Show error to user via state instead of alert
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cadastrar veículo';
      setErrors({
        clientId: errorMessage.includes('Cliente') ? errorMessage : undefined,
        licensePlate: errorMessage.includes('placa') ? errorMessage : undefined,
      });

      // For generic errors, set a general error state
      if (!errorMessage.includes('Cliente') && !errorMessage.includes('placa')) {
        setErrors({ clientId: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    setFormData(prev => ({
      ...prev,
      clientId: client?.id || '',
    }));

    // Clear client error when user selects a client
    if (client && errors.clientId) {
      setErrors(prev => ({
        ...prev,
        clientId: undefined,
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      licensePlate: formatted,
    }));

    if (errors.licensePlate) {
      setErrors(prev => ({
        ...prev,
        licensePlate: undefined,
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cadastrar Veículo</h2>
          <button className="close-button" onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vehicle-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientSearch">Cliente *</label>
              <ClientSearch
                selectedClient={selectedClient}
                onClientSelect={handleClientSelect}
                placeholder="Buscar cliente por nome ou email..."
                disabled={loading}
                error={errors.clientId}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="licensePlate">Placa *</label>
              <input
                type="text"
                id="licensePlate"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleLicensePlateChange}
                placeholder="ABC-1234 ou ABC-1D23"
                className={errors.licensePlate ? 'error' : ''}
                disabled={loading}
                maxLength={8}
                required
              />
              {errors.licensePlate && <span className="error-message">{errors.licensePlate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="year">Ano *</label>
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
              <label htmlFor="brand">Marca *</label>
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
              <label htmlFor="model">Modelo *</label>
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
              <label htmlFor="color">Cor *</label>
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
              <label htmlFor="estimatedArrivalDate">Data Prevista de Chegada</label>
              <input
                type="date"
                id="estimatedArrivalDate"
                name="estimatedArrivalDate"
                value={formData.estimatedArrivalDate}
                onChange={handleInputChange}
                className={errors.estimatedArrivalDate ? 'error' : ''}
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.estimatedArrivalDate && (
                <span className="error-message">{errors.estimatedArrivalDate}</span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading} className="cancel-button">
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

export default VehicleRegistrationModal;
