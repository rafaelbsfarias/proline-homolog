import React from 'react';
import styles from './VehicleCounterError.module.css';

interface VehicleCounterErrorProps {
  error: string;
  onRetry: () => void;
}

export const VehicleCounterError: React.FC<VehicleCounterErrorProps> = ({ error, onRetry }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>⚠️</div>
      <div className={styles.errorContent}>
        <h3 className={styles.errorTitle}>Erro</h3>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={onRetry} className={styles.retryButton}>
          Tentar novamente
        </button>
      </div>
    </div>
  );
};