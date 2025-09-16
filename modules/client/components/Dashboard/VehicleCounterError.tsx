import React from 'react';
import styles from './VehicleCounterError.module.css';

interface VehicleCounterErrorProps {
  error: string;
  onRetry: () => void;
}

export const VehicleCounterError: React.FC<VehicleCounterErrorProps> = ({ error, onRetry }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>⚠️</div>
        <div className={styles.errorMessage}>
          <h3 className={styles.errorTitle}>Erro ao carregar veículos</h3>
          <p className={styles.errorDescription}>{error}</p>
        </div>
        <button className={styles.retryButton} onClick={onRetry}>
          <span className={styles.retryIcon}>🔄</span>
          Tentar Novamente
        </button>
      </div>
    </div>
  );
};
