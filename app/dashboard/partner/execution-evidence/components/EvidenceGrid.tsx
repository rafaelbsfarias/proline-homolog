import React from 'react';
import { Evidence } from '../types';
import { EvidenceCard } from './EvidenceCard';
import styles from './EvidenceGrid.module.css';

interface EvidenceGridProps {
  evidences: Evidence[];
  onDescriptionChange: (index: number, description: string) => void;
  onRemove: (index: number) => void;
}

export const EvidenceGrid: React.FC<EvidenceGridProps> = ({
  evidences,
  onDescriptionChange,
  onRemove,
}) => {
  if (evidences.length === 0) {
    return <p className={styles.empty}>Nenhuma evidência adicionada ainda</p>;
  }

  return (
    <div className={styles.grid}>
      {evidences.map((evidence, index) => (
        <EvidenceCard
          key={index}
          evidence={evidence}
          evidenceIndex={index}
          onDescriptionChange={desc => onDescriptionChange(index, desc)}
          onRemove={() => onRemove(index)}
        />
      ))}
    </div>
  );
};
