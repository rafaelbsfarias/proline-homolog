import React from 'react';
import styles from './VehicleCounterActions.module.css';

interface VehicleCounterActionsProps {
  onCreateVehicle: () => void;
  onCreateAddress: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const VehicleCounterActions: React.FC<VehicleCounterActionsProps> = ({
  onCreateVehicle,
  onCreateAddress,
  onRefresh,
  loading,
}) => {
  return (
    <div className={styles['vehicle-counter-actions']}>
      <button onClick={onCreateVehicle} className={styles['action-button']} disabled={loading}>
        ➕ Cadastrar Veículo
      </button>
      <button onClick={onCreateAddress} className={styles['action-button']} disabled={loading}>
        📍 Adicionar Endereço
      </button>
      <button onClick={onRefresh} className={styles['action-button']} disabled={loading}>
        🔄 Atualizar
      </button>
    </div>
  );
};
