// modules/vehicles/components/VehicleRegistrationModalBase.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import './VehicleRegistrationModal.css';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import ClientSearch from '@/modules/common/components/ClientSearch';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import Input from '@/modules/common/components/Input/Input';
import Modal from '@/modules/common/components/Modal/Modal';

export type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  status?: string;
  fipe_value?: number | null;
  estimated_arrival_date?: string | null;
};

type UserRole = 'admin' | 'client';

type Client = { id: string; full_name: string; email: string };

type VehicleFormData = {
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  initialKm: string;
  fipe_value: string;
  observations: string;
  estimated_arrival_date: string;
  preparacao: boolean;
  comercializacao: boolean;
};

export interface VehicleRegistrationBaseProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userRole: UserRole;
  hiddenFields?: (keyof VehicleFormData)[];
}

function useVehicleRegistrationForm({
  isOpen,
  userRole,
  hiddenFields,
  onSuccess,
}: Pick<VehicleRegistrationBaseProps, 'isOpen' | 'userRole' | 'hiddenFields' | 'onSuccess'>) {
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
    preparacao: false,
    comercializacao: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setError(null);
      setSuccess(false);
      if (userRole !== 'admin') {
        setSelectedClient(null);
      }
    }
  }, [isOpen, userRole]);

  const isHidden = (k: keyof VehicleFormData) => !!hiddenFields?.includes(k);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target as { name: keyof VehicleFormData; value: string };
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value || '';
    const next = raw.toUpperCase().replace(/\s+/g, '').slice(0, 8);
    setFormData(prev => ({ ...prev, plate: next }));
    if (errors.plate) setErrors(prev => ({ ...prev, plate: undefined }));
  };

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, clientId: client?.id || '' }));
    if (errors.clientId) setErrors(prev => ({ ...prev, clientId: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof VehicleFormData, string>> = {};
    const required: (keyof VehicleFormData)[] = ['plate', 'brand', 'model', 'color', 'year'];
    if (userRole === 'admin') required.push('clientId');
    for (const k of required) {
      if (!isHidden(k) && !String(formData[k] || '').trim()) {
        nextErrors[k] = 'Campo obrigatório';
      }
    }
    if (formData.year && !/^\d{4}$/.test(formData.year)) {
      nextErrors.year = 'Ano inválido';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    try {
      if (userRole === 'admin') {
        const payload = {
          clientId: formData.clientId,
          plate: formData.plate,
          brand: formData.brand,
          model: formData.model,
          color: formData.color,
          year: Number(formData.year),
          fipe_value: formData.fipe_value ? Number(formData.fipe_value) : undefined,
          estimated_arrival_date: formData.estimated_arrival_date || undefined,
          preparacao: formData.preparacao,
          comercializacao: formData.comercializacao,
        };
        const resp = await post<{ success: boolean; message?: string; error?: string }>(
          '/api/admin/create-vehicle',
          payload
        );
        if (!resp.ok || !resp.data?.success)
          throw new Error(resp.data?.error || 'Erro ao cadastrar.');
      } else {
        const payload = {
          plate: formData.plate,
          brand: formData.brand,
          model: formData.model,
          color: formData.color,
          year: Number(formData.year),
          initialKm: formData.initialKm ? Number(formData.initialKm) : undefined,
          fipe_value: formData.fipe_value ? Number(formData.fipe_value) : undefined,
          observations: formData.observations || undefined,
          preparacao: formData.preparacao,
          comercializacao: formData.comercializacao,
        };
        const resp = await post<{ success: boolean; message?: string; error?: string }>(
          '/api/client/create-vehicle',
          payload
        );
        if (!resp.ok || !resp.data?.success)
          throw new Error(resp.data?.error || 'Erro ao cadastrar.');
      }
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Erro ao cadastrar veículo.');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    errors,
    loading,
    selectedClient,
    isHidden,
    handleInputChange,
    handlePlateChange,
    handleClientSelect,
    handleSubmit,
    error,
    success,
    setError,
    setSuccess,
  } as const;
}

function VehicleRegistrationModalBase(props: VehicleRegistrationBaseProps) {
  const { isOpen, onClose, onSuccess, userRole, hiddenFields } = props;

  const {
    formData,
    errors,
    loading,
    selectedClient,
    isHidden,
    handleInputChange,
    handlePlateChange,
    handleClientSelect,
    handleSubmit,
    error,
    success,
    setError,
    setSuccess,
    setFormData,
  } = useVehicleRegistrationForm({
    isOpen,
    userRole,
    hiddenFields,
    onSuccess,
  });

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
        preparacao: false,
        comercializacao: false,
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, setFormData, setError, setSuccess]);

  const handleClose = () => onClose();

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cadastrar Novo Veículo" size="lg">
      <form className="vehicle-form" onSubmit={handleSubmit}>
        {userRole === 'admin' && (
          <div className="form-row">
            <div className="form-group full-width">
              <label className={`required`} htmlFor="clientId">
                Cliente
              </label>
              <ClientSearch
                selectedClient={selectedClient}
                onClientSelect={handleClientSelect}
                disabled={loading}
                error={errors.clientId}
              />
              {errors.clientId && <div className="error-message">{errors.clientId}</div>}
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <Input
              id="plate"
              name="plate"
              label="Placa"
              value={formData.plate}
              onChange={handlePlateChange}
              placeholder="AAA1B23"
              disabled={loading}
              required
            />
            {errors.plate && <div className="error-message">{errors.plate}</div>}
          </div>
          <div className="form-group">
            <Input
              id="brand"
              name="brand"
              label="Marca"
              value={formData.brand}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
            {errors.brand && <div className="error-message">{errors.brand}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <Input
              id="model"
              name="model"
              label="Modelo"
              value={formData.model}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
            {errors.model && <div className="error-message">{errors.model}</div>}
          </div>
          <div className="form-group">
            <Input
              id="color"
              name="color"
              label="Cor"
              value={formData.color}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
            {errors.color && <div className="error-message">{errors.color}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <Input
              id="year"
              name="year"
              type="number"
              label="Ano"
              value={formData.year}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
            {errors.year && <div className="error-message">{errors.year}</div>}
          </div>
          {!isHidden('fipe_value') && (
            <div className="form-group">
              <Input
                id="fipe_value"
                name="fipe_value"
                type="number"
                label="Valor FIPE"
                value={formData.fipe_value}
                onChange={handleInputChange}
                disabled={loading}
              />
              {errors.fipe_value && <div className="error-message">{errors.fipe_value}</div>}
            </div>
          )}
        </div>

        {!isHidden('initialKm') && (
          <div className="form-row">
            <div className="form-group">
              <Input
                id="initialKm"
                name="initialKm"
                type="number"
                label="KM Inicial"
                value={formData.initialKm}
                onChange={handleInputChange}
                disabled={loading}
              />
              {errors.initialKm && <div className="error-message">{errors.initialKm}</div>}
            </div>
            {userRole === 'admin' && (
              <div className="form-group">
                <label htmlFor="estimated_arrival_date">Previsão de Chegada</label>
                <input
                  id="estimated_arrival_date"
                  name="estimated_arrival_date"
                  type="date"
                  value={formData.estimated_arrival_date}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            )}
          </div>
        )}

        <div className="form-row">
          <div className="form-group full-width">
            <label>Finalidade do Veículo</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="preparacao"
                  name="preparacao"
                  checked={formData.preparacao}
                  onChange={e => setFormData(prev => ({ ...prev, preparacao: e.target.checked }))}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Preparação
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="comercializacao"
                  name="comercializacao"
                  checked={formData.comercializacao}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, comercializacao: e.target.checked }))
                  }
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Comercialização
              </label>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="observations">Observações</label>
            <textarea
              id="observations"
              name="observations"
              value={formData.observations}
              onChange={handleInputChange}
              disabled={loading}
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar Veículo'}
          </button>
        </div>
      </form>

      {error && <MessageModal message={error} onClose={() => setError(null)} variant="error" />}
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
    </Modal>
  );
}

export default VehicleRegistrationModalBase;
