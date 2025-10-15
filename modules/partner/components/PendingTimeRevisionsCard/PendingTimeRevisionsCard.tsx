import React from 'react';
import styles from './PendingTimeRevisionsCard.module.css';

interface PendingRevision {
  quote_id: string;
  quote_number: string;
  client_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  requested_at: string;
  specialist_name: string;
  specialist_comments: string;
  items_count: number;
  revision_items_count: number;
}

interface PendingTimeRevisionsCardProps {
  revisions: PendingRevision[];
  loading: boolean;
  onReviewClick: (quoteId: string) => void;
  onDetailsClick: (quoteId: string) => void;
}

const PendingTimeRevisionsCard: React.FC<PendingTimeRevisionsCardProps> = ({
  revisions,
  loading,
  onReviewClick,
  onDetailsClick,
}) => {
  // Garantir que revisions é sempre um array
  const safeRevisions = Array.isArray(revisions) ? revisions : [];

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>⏱️ Solicitações de Ajuste de Prazo</h2>
        </div>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (safeRevisions.length === 0) {
    return null; // Ocultar card quando não há revisões
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          ⏱️ Solicitações de Ajuste de Prazo
          <span className={styles.badge}>{safeRevisions.length}</span>
        </h2>
      </div>

      <div className={styles.list}>
        {safeRevisions.map(revision => (
          <div key={revision.quote_id} className={styles.item}>
            <div className={styles.itemHeader}>
              <div className={styles.vehicleInfo}>
                <span className={styles.vehicleIcon}>🚗</span>
                <span className={styles.plate}>{revision.vehicle_plate}</span>
                <span className={styles.separator}>|</span>
                <span className={styles.clientName}>{revision.client_name}</span>
              </div>
            </div>

            <div className={styles.itemDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Orçamento:</span>
                <span className={styles.value}>#{revision.quote_number}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Solicitado em:</span>
                <span className={styles.value}>{formatDate(revision.requested_at)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Especialista:</span>
                <span className={styles.value}>{revision.specialist_name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Itens para revisar:</span>
                <span className={styles.value}>
                  {revision.revision_items_count} de {revision.items_count}
                </span>
              </div>
            </div>

            {revision.specialist_comments && (
              <div className={styles.comments}>
                <span className={styles.commentsIcon}>💬</span>
                <span className={styles.commentsText}>{revision.specialist_comments}</span>
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                onClick={() => onReviewClick(revision.quote_id)}
              >
                Revisar Prazos
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => onDetailsClick(revision.quote_id)}
              >
                Ver Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingTimeRevisionsCard;
