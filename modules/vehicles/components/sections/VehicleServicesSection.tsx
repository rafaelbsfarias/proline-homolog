import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import { ServiceCard } from '../cards/ServiceCard';
import { ServiceData } from '../../types/VehicleDetailsTypes';
import styles from './VehicleServicesSection.module.css';

interface VehicleServicesSectionProps {
  services: ServiceData[];
}

export const VehicleServicesSection: React.FC<VehicleServicesSectionProps> = ({ services }) => {
  if (!services || services.length === 0) return null;

  return (
    <SectionCard title="Serviços Necessários" fullWidth>
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
    </SectionCard>
  );
};
