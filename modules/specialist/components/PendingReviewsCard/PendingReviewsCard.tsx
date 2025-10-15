import React from 'react';
import styles from './PendingReviewsCard.module.css';

interface PendingReview {
  quote_id: string;
  quote_number: string;
  client_name: string;
  partner_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  updated_at: string;
  partner_comments: string | null;
  last_revision_comments: string | null;
  items_count: number;
  total_value: number;
  waiting_days: number;
  revision_count: number;
}

interface PendingReviewsCardProps {
  reviews: PendingReview[];
  loading: boolean;
  onReviewClick: (quoteId: string) => void;
}

const PendingReviewsCard: React.FC<PendingReviewsCardProps> = ({
  reviews,
  loading,
  onReviewClick,
}) => {
  const safeReviews = Array.isArray(reviews) ? reviews : [];

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Revisões de Prazos Pendentes</h2>
        </div>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (safeReviews.length === 0) {
    return null; // Ocultar card quando não há revisões pendentes
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getWaitingTimeClass = (days: number) => {
    if (days <= 1) return styles.waitingNormal;
    if (days <= 3) return styles.waitingWarning;
    return styles.waitingUrgent;
  };

  const getWaitingTimeText = (days: number) => {
    if (days === 0) return 'Hoje';
    if (days === 1) return '1 dia';
    return `${days} dias`;
  };

  const getRevisionCountBadge = (count: number) => {
    if (count <= 1) return null;
    if (count === 2) return styles.revision2;
    return styles.revision3Plus;
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            Revisões de Prazos Pendentes
            <span className={styles.badge}>{safeReviews.length}</span>
          </h2>
          <p className={styles.subtitle}>Parceiros atualizaram prazos - Aguardam sua análise</p>
        </div>
      </div>

      <div className={styles.list}>
        {safeReviews.map(review => (
          <div key={review.quote_id} className={styles.item}>
            <div className={styles.itemHeader}>
              <div className={styles.vehicleInfo}>
                <span className={styles.plate}>{review.vehicle_plate}</span>
                <span className={styles.separator}>|</span>
                <span className={styles.clientName}>{review.client_name}</span>
              </div>
              <div className={`${styles.waitingTime} ${getWaitingTimeClass(review.waiting_days)}`}>
                {getWaitingTimeText(review.waiting_days)}
              </div>
            </div>

            <div className={styles.itemDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Orçamento:</span>
                <span className={styles.value}>#{review.quote_number}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Parceiro:</span>
                <span className={styles.value}>{review.partner_name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Atualizado em:</span>
                <span className={styles.value}>{formatDate(review.updated_at)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Valor Total:</span>
                <span className={styles.valueHighlight}>{formatCurrency(review.total_value)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Itens:</span>
                <span className={styles.value}>{review.items_count}</span>
              </div>
              {review.revision_count > 1 && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Rodada de revisão:</span>
                  <span
                    className={`${styles.value} ${getRevisionCountBadge(review.revision_count)}`}
                  >
                    {review.revision_count}ª revisão
                  </span>
                </div>
              )}
            </div>

            {review.partner_comments && (
              <div className={styles.comments}>
                <span className={styles.commentsLabel}>Comentário do parceiro:</span>
                <span className={styles.commentsText}>{review.partner_comments}</span>
              </div>
            )}

            {review.last_revision_comments && (
              <div className={styles.previousComments}>
                <span className={styles.commentsLabel}>Sua última solicitação:</span>
                <span className={styles.commentsText}>{review.last_revision_comments}</span>
              </div>
            )}

            <div className={styles.statusBanner}>
              <span className={styles.statusText}>
                Parceiro ajustou os prazos - Revise e aprove ou solicite novos ajustes
              </span>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.reviewButton}
                onClick={() => onReviewClick(review.quote_id)}
                title="Revisar prazos ajustados"
              >
                Revisar Prazos Ajustados
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingReviewsCard;
