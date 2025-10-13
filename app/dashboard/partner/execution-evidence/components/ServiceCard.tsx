import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { ServiceWithEvidences } from '../types';
import { ServiceAlert } from './ServiceAlert';
import { ServiceActions } from './ServiceActions';
import { EvidenceGrid } from './EvidenceGrid';
import { formatDateTime } from '../utils/formatters';
import styles from './ServiceCard.module.css';

interface ServiceCardProps {
  service: ServiceWithEvidences;
  serviceIndex: number;
  onImageUpload: (file: File) => void;
  onComplete: () => void;
  onEvidenceDescriptionChange: (index: number, description: string) => void;
  onEvidenceRemove: (index: number) => void;
  uploading: boolean;
  completing: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  serviceIndex,
  onImageUpload,
  onComplete,
  onEvidenceDescriptionChange,
  onEvidenceRemove,
  uploading,
  completing,
}) => {
  const isCompleted = !!service.completed_at;
  const hasNoEvidences = service.evidences.length === 0;

  return (
    <div className={`${styles.card} ${isCompleted ? styles.completed : ''}`}>
      {isCompleted && (
        <div className={styles.completedBadge}>
          <FaCheck size={12} />
          Concluído
        </div>
      )}

      <h3 className={styles.title}>
        {serviceIndex + 1}. {service.description}
      </h3>

      {!isCompleted && hasNoEvidences && <ServiceAlert />}

      {!isCompleted && (
        <ServiceActions
          serviceId={service.id}
          onImageUpload={onImageUpload}
          onComplete={onComplete}
          uploading={uploading}
          completing={completing}
        />
      )}

      {isCompleted && (
        <p className={styles.completedText}>
          ✓ Serviço concluído em {formatDateTime(service.completed_at!)}
        </p>
      )}

      <EvidenceGrid
        evidences={service.evidences}
        onDescriptionChange={onEvidenceDescriptionChange}
        onRemove={onEvidenceRemove}
      />
    </div>
  );
};
