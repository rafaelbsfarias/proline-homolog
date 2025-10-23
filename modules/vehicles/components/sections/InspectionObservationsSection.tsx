import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import styles from './InspectionObservationsSection.module.css';

interface InspectionObservationsSectionProps {
  observations: string;
}

export const InspectionObservationsSection: React.FC<InspectionObservationsSectionProps> = ({
  observations,
}) => {
  if (!observations) return null;

  return (
    <SectionCard title="Observações Gerais" fullWidth>
      <div className={styles.container}>{observations}</div>
    </SectionCard>
  );
};
