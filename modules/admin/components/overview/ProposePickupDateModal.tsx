import React from 'react';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';

interface Props {
  vehiclePlate: string;
  vehicleInfo: string;
  initialDateIso: string | null;
  loading: boolean;
  error?: string;
  successMessage?: string;
  onClose: () => void;
  onChangeDate: (date: string) => void;
  onConfirm: () => void;
}

const ProposePickupDateModal: React.FC<Props> = ({
  vehiclePlate,
  vehicleInfo,
  initialDateIso,
  loading,
  error,
  successMessage,
  onClose,
  onChangeDate,
  onConfirm,
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>Propor data de retirada</h3>
        <div style={{ marginBottom: 16 }}>
          <p>
            <strong>Veículo:</strong> {vehiclePlate}
          </p>
          <p style={{ fontSize: '0.9em', color: '#666' }}>{vehicleInfo}</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="pickupDate"
            style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}
          >
            Data de retirada:
          </label>
          <input
            id="pickupDate"
            type="date"
            value={initialDateIso || ''}
            onChange={e => onChangeDate(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>
        {error && (
          <div
            style={{
              padding: '10px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              marginBottom: 12,
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
        {successMessage && (
          <div
            style={{
              padding: '10px',
              backgroundColor: '#efe',
              color: '#3c3',
              borderRadius: '4px',
              marginBottom: 12,
              fontSize: '14px',
            }}
          >
            {successMessage}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !initialDateIso}
            style={{
              padding: '8px 16px',
              backgroundColor: loading || !initialDateIso ? '#ccc' : '#002e4c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !initialDateIso ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {loading ? 'Enviando...' : 'Confirmar proposta'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposePickupDateModal;
