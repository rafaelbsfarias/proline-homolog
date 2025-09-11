import React from 'react';
import styles from './VehicleCounter.module.css';

interface VehicleCounterHeaderProps {
  userName: string;
  vehicleCount: number;
  onRefresh: () => void;
  loading: boolean;
}

export const VehicleCounterHeader: React.FC<VehicleCounterHeaderProps> = ({
  userName,
  vehicleCount,
  onRefresh,
  loading
}) => {
  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>Painel do Cliente</h1>
        <p className={styles.welcome}>Bem-vindo, {userName}!</p>
        <div className={styles.counter}>
          <span className={styles.counterNumber}>{vehicleCount}</span>
          <span className={styles.counterLabel}>
            {vehicleCount === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}
          </span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className={styles.refreshButton}
            aria-label="Atualizar contagem de veículos"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
};