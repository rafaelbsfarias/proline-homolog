/**
 * Card de serviço individual
 * Exibe categoria, se é necessário/opcional e observações
 */

import React from 'react';
import { translateServiceCategory } from '@/app/constants/messages';
import styles from './ServiceCard.module.css';

interface ServiceCardProps {
  category: string;
  required: boolean;
  notes?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ category, required, notes }) => {
  return (
    <div className={`${styles.card} ${required ? styles.required : ''}`}>
      <div className={styles.header}>
        <span className={styles.category}>{translateServiceCategory(category)}</span>
        <span className={required ? styles.requiredBadge : styles.optionalBadge}>
          {required ? 'Necessário' : 'Opcional'}
        </span>
      </div>
      {notes && (
        <div className={styles.notes}>
          <strong>Observações:</strong> {notes}
        </div>
      )}
    </div>
  );
};
