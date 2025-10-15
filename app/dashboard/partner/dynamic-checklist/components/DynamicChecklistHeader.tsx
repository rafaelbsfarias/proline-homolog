import React from 'react';
import styles from './DynamicChecklistHeader.module.css';

interface DynamicChecklistHeaderProps {
  onBack: () => void;
}

export const DynamicChecklistHeader: React.FC<DynamicChecklistHeaderProps> = ({ onBack }) => {
  return (
    <div className={styles.header}>
      <div className={styles.container}>
        <button onClick={onBack} className={styles.backButton}>
          ← Voltar ao Dashboard
        </button>
        <h1 className={styles.title}>Vistoria do Veículo</h1>
      </div>
    </div>
  );
};
