import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import styles from './VehicleObservationsSection.module.css';

interface VehicleObservationsSectionProps {
  observations?: string;
}

export const VehicleObservationsSection: React.FC<VehicleObservationsSectionProps> = ({
  observations,
}) => {
  // Não renderizar a seção se não houver observações
  if (!observations || observations.trim() === '') {
    return null;
  }

  return (
    <SectionCard title="Observações do Cliente" fullWidth>
      <div className={styles.container}>
        <p className={styles.text}>{observations}</p>
      </div>
    </SectionCard>
  );
};
