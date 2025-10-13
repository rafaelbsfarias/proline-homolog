import React, { useState } from 'react';
import { SectionCard } from '../cards/SectionCard';
import { ServiceCard } from '../cards/ServiceCard';
import { ServiceData } from '../../types/VehicleDetailsTypes';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import styles from './VehicleServicesSection.module.css';

interface VehicleServicesSectionProps {
  services: ServiceData[];
}

export const VehicleServicesSection: React.FC<VehicleServicesSectionProps> = ({ services }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!services || services.length === 0) return null;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const headerAction = (
    <button onClick={toggleExpand} className={styles.toggleButton}>
      {isExpanded ? (
        <>
          Recolher <LuChevronUp size={18} />
        </>
      ) : (
        <>
          Expandir <LuChevronDown size={18} />
        </>
      )}
    </button>
  );

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
