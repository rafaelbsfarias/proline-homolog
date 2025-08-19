'use client';

import React, { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { validatePlate, formatPlateInput, PLATE_ERROR_MESSAGES } from '@/modules/common/utils/plateValidation';
import MessageModal from '@/modules/common/components/MessageModal';
import ClientSearch from '@/modules/common/components/ClientSearch';
import './VehicleRegistrationModal.css';

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  fipe_value?: number;
  initialKm?: number;
  observations?: string;
  estimated_arrival_date?: string;
  status: string;
  created_at: string;
  client?: { id: string; full_name: string; email: string };
}

export type UserRole = 'admin' | 'client';

export interface VehicleRegistrationBaseProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (vehicle?: Vehicle) => void;
  userRole: UserRole;
}

interface VehicleFormData {
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number | '';
  initialKm: number | '';
  fipe_value: number | '';
  observations: string;
  estimated_arrival_date: string;
}

interface FormErrors {
  clientId?: string;
  plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: string;
  initialKm?: string;
  fipe_value?: string;
  estimated_arrival_date?: string;
}

interface Client {
  id: string;
  full_name: string;
  email: string;
}

const VehicleRegistrationModalBase: React.FC<VehicleRegistrationBaseProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userRole,
}) => {
  const { post } = useAuthenticatedFetch();

  const [formData, setFormData] = useState<VehicleFormData>({
    clientId: '',
    plate: '',
    brand: '',
    model: '',
    color: '',
    year: '',
    initialKm: '',
    fipe_value: '',
    observations: '',
    estimated_arrival_date: '',
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientId: '',
        plate: '',
        brand: '',
        model: '',
        color: '',
        year: '',
        initialKm: '',
        fipe_value: '',
        observations: '',
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

    if (userRole === 'admin' && !selectedClient) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.plate.trim()) {
      newErrors.plate = PLATE_ERROR_MESSAGES.REQUIRED;
    } else if (!validatePlate(formData.plate)) {
      newErrors.plate = PLATE_ERROR_MESSAGES.INVALID_FORMAT;
    }

    if (!formData.brand.trim()) newErrors.brand = 'Marca é obrigatória';
    if (!formData.model.trim()) newErrors.model = 'Modelo é obrigatório';
    if (!formData.color.trim()) newErrors.color = 'Cor é obrigatória';

    if (!formData.year) {
      newErrors.year = 'Ano é obrigatório';
    } else {
      const currentYear = new Date().getFullYear();
      const y = Number(formData.year);
      if (y < 1900 || y > currentYear + 1) {
        newErrors.year = `Ano deve estar entre 1900 e ${currentYear + 1}`;
      }
    }

    if (formData.initialKm !== '' && Number(formData.initialKm) < 0) {
      newErrors.initialKm = 'Quilometragem deve ser positiva';
    }
    if (formData.fipe_value !== '' && Number(formData.fipe_value) < 0) {
      newErrors.fipe_value = 'Valor FIPE deve ser positivo';
    }

    if (userRole === 'admin' && formData.estimated_arrival_date) {
      const d = new Date(formData.estimated_arrival_date);
      if (isNaN(d.getTime())) newErrors.estimated_arrival_date = 'Data inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const endpoint = userRole === 'admin' ? '/api/admin/create-vehicle' : '/api/client/create-vehicle';
    const payload = {
      ...(userRole === 'admin' && { clientId: selectedClient!.id }),
      plate: formData.plate.trim().toUpperCase(),
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      color: formData.color.trim(),
      year: Number(formData.year),
      initialKm: formData.initialKm ? Number(formData.initialKm) : undefined,
      fipe_value: formData.fipe_value ? Number(formData.fipe_value) : undefined,
      observations: formData.observations.trim() || undefined,
      ...(userRole === 'admin' && { estimated_arrival_date: formData.estimated_arrival_date || undefined }),
    };

    try {
      const response = await post<{
        success: boolean;
        message: string;
        vehicle?: Vehicle;
        error?: string;
      }>(endpoint, payload);

      if (response.ok && response.data?.success) {
        setSuccess(true);
        onSuccess?.(response.data.vehicle);
      } else {
        throw new Error(response.data?.error || response.error || 'Erro ao cadastrar veículo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar veículo');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, clientId: client?.id || '' }));
    if (client && errors.clientId) {
      setErrors(prev => ({ ...prev, clientId: undefined }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPlateInput(e.target.value);
    setFormData(prev => ({ ...prev, plate: formatted }));
    if (errors.plate) setErrors(prev => ({ ...prev, plate: undefined }));
  };

  const handleClose = () => onClose();
  const handleCloseErrorModal = () => setError(null);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cadastrar Novo Veículo</h2>
          <button className="close-button" onClick={handleClose} disabled={loading}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="vehicle-form">
          {userRole === 'admin' && (
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="clientSearch" className="required">Cliente</label>
                <ClientSearch
                  selectedClient={selectedClient}
                  onClientSelect={handleClientSelect}
                  placeholder="Buscar cliente por nome ou email..."
                  disabled={loading}
                  error={errors.clientId}
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plate" className="required">Placa</label>
              <input
                type="text"
                id="plate"
                name="plate"
                value={formData.plate}
                onChange={handlePlateChange}
                placeholder="ABC-1234 ou ABC-1D23"
                className={errors.plate ? 'error' : ''}
                disabled={loading}
                maxLength={8}
                required
              />
              {errors.plate && <span className="error-message">{errors.plate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="year" className="required">Ano</label>
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
              <label htmlFor="brand" className="required">Marca</label>
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
              <label htmlFor="model" className="required">Modelo</label>
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
              <label htmlFor="color" className="required">Cor</label>
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

            {userRole === 'admin' && (
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
            )}
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="observations">Observações</label>
              <textarea
                id="observations"
                name="observations"
                value={formData.observations}
                onChange={handleInputChange}
                placeholder="Observações adicionais sobre o veículo..."
                disabled={loading}
                rows={3}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleClose} disabled={loading} className="cancel-button">
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
              handleClose();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default VehicleRegistrationModalBase;
