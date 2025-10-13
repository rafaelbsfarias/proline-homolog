import React from 'react';
import { VehicleInfo } from '../types';
import { formatVehicleInfo } from '../utils/formatters';
import styles from './ExecutionHeader.module.css';

interface ExecutionHeaderProps {
  vehicleInfo: VehicleInfo;
  onBack: () => void;
}

export const ExecutionHeader: React.FC<ExecutionHeaderProps> = ({ vehicleInfo, onBack }) => {
  return (
    <>
      <div className={styles.backButtonContainer}>
        <button onClick={onBack} className={styles.backButton}>
          ← Voltar ao Dashboard
        </button>
      </div>

      <div className={styles.card}>
        <h1 className={styles.title}>Evidências de Execução</h1>
        <p className={styles.subtitle}>
          Veículo: {formatVehicleInfo(vehicleInfo.brand, vehicleInfo.model, vehicleInfo.plate)}
        </p>
      </div>
    </>
  );
};
