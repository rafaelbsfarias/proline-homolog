import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import { MediaCard } from '../cards/MediaCard';
import { formatDateBR } from '../../utils/formatters';
import styles from './ExecutionEvidencesSection.module.css';

interface ExecutionEvidence {
  id: string;
  image_url: string;
  uploaded_at: string;
  description?: string;
}

interface ServiceExecution {
  serviceName: string;
  completed: boolean;
  completedAt?: string;
  evidences: ExecutionEvidence[];
}

interface ExecutionEvidencesSectionProps {
  services: ServiceExecution[];
  loading: boolean;
}

export const ExecutionEvidencesSection: React.FC<ExecutionEvidencesSectionProps> = ({
  services,
  loading,
}) => {
  if (loading || !services || services.length === 0) return null;

  return (
    <SectionCard
      title="Evidências de Execução"
      headerAction={<p className={styles.subtitle}>Fotos dos serviços realizados pelo parceiro</p>}
      fullWidth
    >
      {services.map((service, serviceIndex) => (
        <div
          key={serviceIndex}
          className={`${styles.serviceSection} ${
            serviceIndex < services.length - 1 ? styles.withBorder : ''
          }`}
        >
          <div className={styles.serviceHeader}>
            <h3 className={styles.serviceName}>{service.serviceName}</h3>
            {service.completed && (
              <span className={styles.completedBadge}>
                ✓ Concluído
                {service.completedAt && (
                  <span className={styles.completedDate}>
                    {' '}
                    • {formatDateBR(service.completedAt)}
                  </span>
                )}
              </span>
            )}
          </div>

          {service.evidences.length > 0 ? (
            <div className={styles.grid}>
              {service.evidences.map((evidence, evidenceIndex) => (
                <MediaCard
                  key={evidence.id}
                  src={evidence.image_url}
                  alt={`${service.serviceName} - Evidência ${evidenceIndex + 1}`}
                  date={evidence.uploaded_at}
                  description={evidence.description}
                  onError={() => {
                    /* hide image on error */
                  }}
                />
              ))}
            </div>
          ) : (
            <p className={styles.emptyMessage}>Nenhuma evidência registrada para este serviço</p>
          )}
        </div>
      ))}
    </SectionCard>
  );
};
