import React from 'react';
import { VehicleInfo } from '../types';
import styles from './VehicleInfoCard.module.css';

interface VehicleInfoCardProps {
  vehicle: VehicleInfo;
}

export const VehicleInfoCard: React.FC<VehicleInfoCardProps> = ({ vehicle }) => {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Informações do Veículo</h2>
      <div className={styles.grid}>
        <div className={styles.item}>
          <strong>Veículo:</strong> {vehicle.brand} {vehicle.model}{' '}
          {vehicle.year && `(${vehicle.year})`}
        </div>
        <div className={styles.item}>
          <strong>Placa:</strong> {vehicle.plate}
        </div>
        {vehicle.color && (
          <div className={styles.item}>
            <strong>Cor:</strong> {vehicle.color}
          </div>
        )}
      </div>
    </div>
  );
};
