import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { Evidence } from '../types';
import styles from './EvidenceCard.module.css';

interface EvidenceCardProps {
  evidence: Evidence;
  evidenceIndex: number;
  onDescriptionChange: (description: string) => void;
  onRemove: () => void;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  evidenceIndex,
  onDescriptionChange,
  onRemove,
}) => {
  return (
    <div className={styles.card}>
      <img
        src={evidence.image_url}
        alt={`Evidência ${evidenceIndex + 1}`}
        className={styles.image}
      />
      <div className={styles.content}>
        <textarea
          placeholder="Descrição da evidência (opcional)"
          value={evidence.description || ''}
          onChange={e => onDescriptionChange(e.target.value)}
          className={styles.textarea}
        />
        <button onClick={onRemove} className={styles.removeButton}>
          <FaTrash size={12} />
          Remover
        </button>
      </div>
    </div>
  );
};
