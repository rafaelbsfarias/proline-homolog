import React from 'react';
import styles from './VehicleCard.module.css';

interface VehicleCardProps {
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status?: string;
  onClick?: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  plate,
  brand,
  model,
  year,
  color,
  status,
  onClick
}) => {
  return (
    <div className={styles.vehicleCard} onClick={onClick}>
      <div className={styles.vehicleHeader}>
        <span className={styles.vehiclePlate}>{plate}</span>
        {status && <span className={styles.vehicleStatus}>{status}</span>}
      </div>
      <div className={styles.vehicleInfo}>
        <div className={styles.vehicleBrandModel}>
          {brand} {model}
        </div>
        <div className={styles.vehicleDetails}>
          <span>Ano: {year}</span>
          <span>Cor: {color}</span>
        </div>
      </div>
    </div>
  );
};