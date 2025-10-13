'use client';

import React from 'react';
import styles from './ChecklistViewer.module.css';

interface Anomaly {
  id: string;
  description: string;
  photos: string[];
  severity: string;
  status: string;
  created_at: string;
}

interface AnomaliesChecklistData {
  type: 'anomalies';
  checklist: {
    vehicle_id: string;
    partner: {
      id: string;
      name: string;
      type: string;
    };
  };
  anomalies: Anomaly[];
  stats: {
    totalAnomalies: number;
  };
}

interface AnomaliesChecklistViewProps {
  data: AnomaliesChecklistData;
}

// Helper para traduzir tipo de parceiro
function translatePartnerType(type: string): string {
  const translations: Record<string, string> = {
    mechanic: 'Mecânica',
    bodyshop: 'Funilaria/Pintura',
    tire_shop: 'Pneus',
    car_wash: 'Lavagem',
    store: 'Loja',
    yard_wholesale: 'Pátio Atacado',
  };
  return translations[type] || type;
}

export const AnomaliesChecklistView: React.FC<AnomaliesChecklistViewProps> = ({ data }) => {
  return (
    <>
      {/* Header com informações do parceiro */}
      <div className={styles.summary}>
        <p>
          <strong>Parceiro:</strong> {data.checklist.partner?.name}
        </p>
        <p>
          <strong>Categoria:</strong> {translatePartnerType(data.checklist.partner?.type)}
        </p>
      </div>

      {/* Lista de anomalias */}
      {data.anomalies.length > 0 ? (
        <div className={styles.anomaliesList}>
          {data.anomalies.map(anomaly => (
            <div key={anomaly.id} className={styles.anomalyCard}>
              <div className={styles.anomalyHeader}>
                <p className={styles.anomalyDescription}>{anomaly.description}</p>
                <span className={`${styles.severityBadge} ${styles[anomaly.severity]}`}>
                  {anomaly.severity === 'low'
                    ? 'Leve'
                    : anomaly.severity === 'high'
                      ? 'Grave'
                      : 'Média'}
                </span>
              </div>

              {anomaly.photos.length > 0 && (
                <div className={styles.photosGrid}>
                  {anomaly.photos.map((url, idx) => (
                    <div key={idx} className={styles.photoItem}>
                      <img
                        src={url}
                        alt={`Foto ${idx + 1}`}
                        onClick={() => window.open(url, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>Nenhuma anomalia registrada.</p>
        </div>
      )}

      {/* Stats */}
      {data.anomalies.length > 0 && (
        <div className={styles.stats}>
          <p>Total de anomalias: {data.stats.totalAnomalies}</p>
        </div>
      )}
    </>
  );
};
