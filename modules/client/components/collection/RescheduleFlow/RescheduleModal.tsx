import React, { useState } from 'react';
import { RescheduleModalProps } from '../types';
import DatePickerBR from '@/modules/common/components/DatePickerBR';

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  minIso,
  loading = false,
}) => {
  const [selectedDate, setSelectedDate] = useState('');

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate);
    }
  };

  const handleCancel = () => {
    setSelectedDate('');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 8,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>
          Sugerir Nova Data de Coleta
        </h3>

        <p style={{ marginBottom: 20, color: '#666', fontSize: 14 }}>
          Selecione uma nova data para a coleta neste endereço:
        </p>

        <div style={{ marginBottom: 24 }}>
          <DatePickerBR
            valueIso={selectedDate}
            minIso={minIso}
            onChangeIso={setSelectedDate}
            ariaLabel="Selecionar nova data para coleta"
          />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            className="refresh-button"
            onClick={handleCancel}
            disabled={loading}
            style={{
              background: '#f5f5f5',
              color: '#333',
              border: '1px solid #ddd',
            }}
          >
            Cancelar
          </button>
          <button
            className="refresh-button"
            onClick={handleConfirm}
            disabled={!selectedDate || loading}
            style={{
              background: '#007bff',
              color: 'white',
              border: '1px solid #007bff',
            }}
          >
            {loading ? 'Enviando...' : 'Enviar Sugestão'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
