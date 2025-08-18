import React, { useState, useEffect } from 'react';
import ClientSearch from './ClientSearch';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { validatePlate, formatPlateInput, PLATE_ERROR_MESSAGES } from '../utils/plateValidation';
import './VehicleRegistrationModal.css';
import MessageModal from './MessageModal';

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
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number | '';
  fipe_value: number | '';
  estimated_arrival_date: string;
}

interface FormErrors {
  clientId?: string;
  plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: string;
  fipe_value?: string;
  estimated_arrival_date?: string;
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
    plate: '',
    brand: '',
    model: '',
    color: '',
    year: '',
    fipe_value: '',
    estimated_arrival_date: '',
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { post } = useAuthenticatedFetch();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientId: '',
        plate: '',
        brand: '',
        model: '',
        color: '',
        year: '',
        fipe_value: '',
        estimated_arrival_date: '',
      });
      setSelectedClient(null);
      setErrors({});
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedClient) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.plate) {
      newErrors.plate = PLATE_ERROR_MESSAGES.REQUIRED;
    } else {
      if (!validatePlate(formData.plate)) {
        newErrors.plate = PLATE_ERROR_MESSAGES.INVALID_FORMAT;
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

    if (formData.fipe_value !== '' && Number(formData.fipe_value) < 0) {
      newErrors.fipe_value = 'Valor FIPE deve ser positivo';
    }

    if (formData.estimated_arrival_date) {
      const date = new Date(formData.estimated_arrival_date);
      if (isNaN(date.getTime())) {
        newErrors.estimated_arrival_date = 'Data inválida';
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
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        clientId: selectedClient!.id,
        plate: formData.plate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        brand: formData.brand,
        model: formData.model,
        color: formData.color,
        year: Number(formData.year),
        fipe_value: formData.fipe_value ? Number(formData.fipe_value) : undefined,
        estimated_arrival_date: formData.estimated_arrival_date || undefined,
      };

      const response = await post<{
        success: boolean;
        message: string;
        vehicle: Vehicle;
        error?: string;
      }>('/api/admin/create-vehicle', payload);

      if (response.ok && response.data?.success) {
        setSuccess(true);
        onSuccess(response.data.vehicle);
      } else {
        throw new Error(response.data?.error || response.error || 'Erro ao cadastrar veículo');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao cadastrar veículo');
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

  const handleplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCloseErrorModal = () => {
    setError(null);
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
              <label htmlFor="plate">Placa *</label>
              <input
                type="text"
                id="plate"
                name="plate"
                value={formData.plate}
                onChange={handleplateChange}
                placeholder="ABC-1234 ou ABC-1D23"
                className={errors.plate ? 'error' : ''}
                disabled={loading}
                maxLength={8}
                required
              />
              {errors.plate && <span className="error-message">{errors.plate}</span>}
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
              <label htmlFor="fipe_value">Valor FIPE (R$)</label>
              <input
                type="number"
                id="fipe_value"
                name="fipe_value"
                value={formData.fipe_value}
                onChange={handleInputChange}
                placeholder="50000"
                className={errors.fipe_value ? 'error' : ''}
                disabled={loading}
                min="0"
                step="0.01"
              />
              {errors.fipe_value && <span className="error-message">{errors.fipe_value}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estimated_arrival_date">Data Prevista de Chegada</label>
              <input
                type="date"
                id="estimated_arrival_date"
                name="estimated_arrival_date"
                value={formData.estimated_arrival_date}
                onChange={handleInputChange}
                className={errors.estimated_arrival_date ? 'error' : ''}
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.estimated_arrival_date && (
                <span className="error-message">{errors.estimated_arrival_date}</span>
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
        {error && <MessageModal message={error} onClose={handleCloseErrorModal} variant="error" />}
        {success && (
          <MessageModal
            title="Sucesso"
            message="Veículo cadastrado com sucesso!"
            variant="success"
            onClose={() => {
              setSuccess(false);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default VehicleRegistrationModal;
