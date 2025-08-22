// modules/vehicles/components/VehicleRegistrationModalBase.tsx
'use client';

import React from 'react';
import MessageModal from '@/modules/common/components/MessageModal';
import './VehicleRegistrationModal.css';
import type { VehicleRegistrationBaseProps } from './types';
import { useVehicleRegistrationForm } from '../hooks/useVehicleRegistrationForm';
import { VehicleFormFields } from './VehicleFormFields';

function VehicleRegistrationModalBase(props: VehicleRegistrationBaseProps) {
  const {
    isOpen,
    onClose,
    onSuccess,
    userRole,
    hiddenFields,
  // initialVehicle, // removido pois não existe na props
  } = props;
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
  } = useVehicleRegistrationForm({
    isOpen,
    userRole,
    hiddenFields,
    onSuccess,
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cadastrar Novo Veículo</h2>
          <button className="close-button" onClick={onClose} disabled={loading}>✕</button>
        </div>
        <VehicleFormFields
          formData={formData}
          errors={errors}
          loading={loading}
          userRole={userRole}
          selectedClient={selectedClient}
          isHidden={isHidden}
          handleInputChange={handleInputChange}
          handlePlateChange={handlePlateChange}
          handleClientSelect={handleClientSelect}
          handleSubmit={handleSubmit}
          onClose={onClose}
        />
  {error && <MessageModal message={error} onClose={() => setError(null)} variant="error" />}
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
}

export default VehicleRegistrationModalBase;
