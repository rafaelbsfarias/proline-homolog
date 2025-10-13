import React from 'react';
import { AnomalyEvidence } from '../types';
import { PhotoGallery } from './PhotoGallery';
import { PartRequestCard } from './PartRequestCard';
import styles from './AnomalyCard.module.css';

interface AnomalyCardProps {
  anomaly: AnomalyEvidence;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  onUpdateDescription: (description: string) => void;
  onAddPhotos: (files: FileList) => void;
  onRemovePhoto: (photoIndex: number) => void;
  onOpenPartRequestModal: () => void;
  onRemovePartRequest: () => void;
}

export const AnomalyCard: React.FC<AnomalyCardProps> = ({
  anomaly,
  index,
  canRemove,
  onRemove,
  onUpdateDescription,
  onAddPhotos,
  onRemovePhoto,
  onOpenPartRequestModal,
  onRemovePartRequest,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Anomalia {index + 1}</h3>
        {canRemove && (
          <button type="button" onClick={onRemove} className={styles.removeButton}>
            Remover
          </button>
        )}
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Descrição da Anomalia *</label>
        <textarea
          value={anomaly.description}
          onChange={e => onUpdateDescription(e.target.value)}
          placeholder="Descreva a anomalia encontrada..."
          required
          className={styles.textarea}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Evidências (Fotos)</label>

        <PhotoGallery photos={anomaly.photos} onRemove={onRemovePhoto} />

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={e => e.target.files && onAddPhotos(e.target.files)}
          className={styles.fileInput}
        />
        <p className={styles.hint}>
          Você pode enviar múltiplas imagens. Imagens com borda azul são novas, com borda verde já
          foram salvas.
        </p>
      </div>

      <div className={styles.partRequestSection}>
        <PartRequestCard
          partRequest={anomaly.partRequest}
          onEdit={onOpenPartRequestModal}
          onRemove={onRemovePartRequest}
          onAdd={onOpenPartRequestModal}
        />
      </div>
    </div>
  );
};
