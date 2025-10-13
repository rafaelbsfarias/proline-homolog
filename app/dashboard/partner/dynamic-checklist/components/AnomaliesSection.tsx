import React from 'react';
import { AnomalyEvidence } from '../types';
import { AnomalyCard } from './AnomalyCard';
import styles from './AnomaliesSection.module.css';

interface AnomaliesSectionProps {
  anomalies: AnomalyEvidence[];
  onAddAnomaly: () => void;
  onRemoveAnomaly: (id: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
  onAddPhotos: (id: string, files: FileList) => void;
  onRemovePhoto: (anomalyId: string, photoIndex: number) => void;
  onOpenPartRequestModal: (anomalyId: string) => void;
  onRemovePartRequest: (anomalyId: string) => void;
}

export const AnomaliesSection: React.FC<AnomaliesSectionProps> = ({
  anomalies,
  onAddAnomaly,
  onRemoveAnomaly,
  onUpdateDescription,
  onAddPhotos,
  onRemovePhoto,
  onOpenPartRequestModal,
  onRemovePartRequest,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Evidências e Anomalias {anomalies.length > 0 && `(${anomalies.length})`}
        </h2>
        <button type="button" onClick={onAddAnomaly} className={styles.addButton}>
          + Adicionar Anomalia
        </button>
      </div>

      {anomalies.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            Nenhuma anomalia registrada. Clique em &quot;+ Adicionar Anomalia&quot; para começar.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {anomalies.map((anomaly, index) => (
            <AnomalyCard
              key={anomaly.id}
              anomaly={anomaly}
              index={index}
              canRemove={anomalies.length > 1}
              onRemove={() => onRemoveAnomaly(anomaly.id)}
              onUpdateDescription={description => onUpdateDescription(anomaly.id, description)}
              onAddPhotos={files => onAddPhotos(anomaly.id, files)}
              onRemovePhoto={photoIndex => onRemovePhoto(anomaly.id, photoIndex)}
              onOpenPartRequestModal={() => onOpenPartRequestModal(anomaly.id)}
              onRemovePartRequest={() => onRemovePartRequest(anomaly.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
