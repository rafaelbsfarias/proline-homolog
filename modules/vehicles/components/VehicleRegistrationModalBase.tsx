'use client';

import React, { useEffect } from 'react';
import './VehicleRegistrationModal.css';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import ClientSearch from '@/modules/common/components/ClientSearch';
import Input from '@/modules/common/components/Input/Input';
import Modal from '@/modules/common/components/Modal/Modal';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import ErrorMessage from '@/modules/common/components/ErroMessage/ErrorMessage';
import { useVehicleRegistrationForm, VehicleFormData } from '../hooks/useVehicleRegistrationForm';

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

export interface VehicleRegistrationBaseProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userRole: UserRole;
  hiddenFields?: (keyof VehicleFormData)[];
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
              <ErrorMessage message={errors.clientId} />
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
            />
            <ErrorMessage message={errors.plate} />
          </div>
          <div className="form-group">
            <Input
              id="brand"
              name="brand"
              label="Marca"
              value={formData.brand}
              onChange={handleInputChange}
              disabled={loading}
            />
            <ErrorMessage message={errors.brand} />
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
            />
            <ErrorMessage message={errors.model} />
          </div>
          <div className="form-group">
            <Input
              id="color"
              name="color"
              label="Cor"
              value={formData.color}
              onChange={handleInputChange}
              disabled={loading}
            />
            <ErrorMessage message={errors.color} />
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
            />
            <ErrorMessage message={errors.year} />
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
              <ErrorMessage message={errors.fipe_value} />
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
              <ErrorMessage message={errors.initialKm} />
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
          <OutlineButton onClick={onClose} disabled={loading}>
            Cancelar
          </OutlineButton>
          <SolidButton type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar Veículo'}
          </SolidButton>
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
