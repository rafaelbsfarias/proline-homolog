import React from 'react';
import styles from './ServiceAlert.module.css';

export const ServiceAlert: React.FC = () => {
  return (
    <div className={styles.alert}>
      <span className={styles.icon}>⚠️</span>
      <span>
        <strong>Atenção:</strong> Este serviço precisa de pelo menos uma evidência antes da
        finalização
      </span>
    </div>
  );
};
