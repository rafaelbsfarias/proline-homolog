import React from 'react';
import styles from './EmptyState.module.css';

export const EmptyState: React.FC = () => {
  return (
    <div className={styles.card}>
      <p className={styles.title}>📋 Nenhum serviço encontrado neste orçamento</p>
      <p className={styles.subtitle}>
        Este orçamento não possui serviços cadastrados ou ainda não foi completamente processado.
      </p>
    </div>
  );
};
