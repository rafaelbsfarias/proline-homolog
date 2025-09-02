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
    <div className={styles.actionsContainer}>
      <div className={styles.actionsGroup}>
        <button className={styles.primaryButton} onClick={onCreateVehicle} disabled={loading}>
          <span className={styles.buttonIcon}>+</span>
          Cadastrar Veículo
        </button>

        <button className={styles.secondaryButton} onClick={onCreateAddress} disabled={loading}>
          <span className={styles.buttonIcon}>📍</span>
          Adicionar Endereço
        </button>

        <button className={styles.refreshButton} onClick={onRefresh} disabled={loading}>
          <span className={styles.buttonIcon}>🔄</span>
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>
    </div>
  );
};
