import React from 'react';
import { VehicleInfo } from '../../../checklist/types';
import styles from '../VehicleChecklistModal.module.css';

export interface VehicleChecklistHeaderProps {
  vehicle: VehicleInfo;
  isFinalized: boolean;
}

/**
 * Componente para exibir informações do cabeçalho do veículo no checklist
 * Responsável apenas pela apresentação das informações básicas do veículo
 * Segue o princípio da responsabilidade única
 */
const VehicleChecklistHeader: React.FC<VehicleChecklistHeaderProps> = ({
  vehicle,
  isFinalized,
}) => {
  return (
    <div className={styles.vehicleHeader}>
      <div>
        <span className={styles.detailLabel}>Veículo:</span> {vehicle.brand} {vehicle.model}{' '}
        {vehicle.year ? `• ${vehicle.year}` : ''}
      </div>
      <div>
        <span className={styles.detailLabel}>Placa:</span> {vehicle.plate}
      </div>
      {vehicle.color && (
        <div>
          <span className={styles.detailLabel}>Cor:</span> {vehicle.color}
        </div>
      )}
      {isFinalized && <div className={styles.success}>Checklist finalizado</div>}
    </div>
  );
};

export default VehicleChecklistHeader;
