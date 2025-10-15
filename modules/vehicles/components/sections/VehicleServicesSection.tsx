import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import { ServiceCard } from '../cards/ServiceCard';
import { ServiceData } from '../../types/VehicleDetailsTypes';
import { useExpandableSection } from '../../hooks/useExpandableSection';
import styles from './VehicleServicesSection.module.css';

interface VehicleServicesSectionProps {
  services: ServiceData[];
}

export const VehicleServicesSection: React.FC<VehicleServicesSectionProps> = ({ services }) => {
  const { isExpanded, headerAction } = useExpandableSection(false, styles);

  if (!services || services.length === 0) return null;

  return (
    <SectionCard title="Serviços Necessários" fullWidth headerAction={headerAction}>
      {isExpanded && (
        <div className={styles.grid}>
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              category={service.category}
              required={service.required}
              notes={service.notes}
            />
          ))}
        </div>
      )}
      {!isExpanded && (
        <div className={styles.collapsedInfo}>
          <p className={styles.collapsedText}>
            {services.length} {services.length === 1 ? 'serviço' : 'serviços'} necessário
            {services.length === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </SectionCard>
  );
};
