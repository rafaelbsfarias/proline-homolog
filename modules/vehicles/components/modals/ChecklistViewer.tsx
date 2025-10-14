'use client';

import React from 'react';
import type { PartnerChecklistData } from '../../hooks/usePartnerChecklist';
import { MechanicsChecklistView } from './MechanicsChecklistView';
import { AnomaliesChecklistView } from './AnomaliesChecklistView';
import styles from './ChecklistViewer.module.css';

interface ChecklistViewerProps {
  data: PartnerChecklistData;
  onClose: () => void;
}

export const ChecklistViewer: React.FC<ChecklistViewerProps> = ({ data, onClose }) => {
  // Traduzir tipo de parceiro para título
  const getTitle = () => {
    if (data.type === 'mechanics') return 'Vistoria - Mecânica';

    const titles: Record<string, string> = {
      bodyshop: 'Checklist de Funilaria/Pintura',
      tire_shop: 'Checklist de Pneus',
      car_wash: 'Checklist de Lavagem',
      store: 'Checklist de Loja',
      yard_wholesale: 'Checklist de Pátio Atacado',
    };

    return titles[data.checklist.partner?.type] || 'Checklist do Parceiro';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{getTitle()}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {data.type === 'mechanics' ? (
            <MechanicsChecklistView data={data} />
          ) : (
            <AnomaliesChecklistView data={data} />
          )}
        </div>
      </div>
    </div>
  );
};
