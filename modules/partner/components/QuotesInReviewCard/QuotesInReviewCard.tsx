import React from 'react';
import styles from './QuotesInReviewCard.module.css';

interface QuoteInReview {
  quote_id: string;
  quote_number: string;
  client_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  submitted_at: string;
  partner_comments?: string;
  items_count: number;
  total_value: number;
  waiting_days: number;
  has_time_revision?: boolean;
  revision_comments?: string | null;
}

interface QuotesInReviewCardProps {
  quotes: QuoteInReview[];
  loading: boolean;
  onViewDetailsClick: (quoteId: string) => void;
  onEditTimesClick?: (quoteId: string) => void;
}

const QuotesInReviewCard: React.FC<QuotesInReviewCardProps> = ({
  quotes,
  loading,
  onViewDetailsClick,
  onEditTimesClick,
}) => {
  // Garantir que quotes é sempre um array
  const safeQuotes = Array.isArray(quotes) ? quotes : [];

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>🔍 Orçamentos em Análise</h2>
        </div>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (safeQuotes.length === 0) {
    return null; // Ocultar card quando não há orçamentos em análise
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

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            🔍 Orçamentos em Análise
            <span className={styles.badge}>{safeQuotes.length}</span>
          </h2>
          <p className={styles.subtitle}>Aguardando aprovação do admin após revisão de prazos</p>
        </div>
      </div>

      <div className={styles.list}>
        {safeQuotes.map(quote => (
          <div key={quote.quote_id} className={styles.item}>
            <div className={styles.itemHeader}>
              <div className={styles.vehicleInfo}>
                <span className={styles.vehicleIcon}>🚗</span>
                <span className={styles.plate}>{quote.vehicle_plate}</span>
                <span className={styles.separator}>|</span>
                <span className={styles.clientName}>{quote.client_name}</span>
              </div>
              <div className={`${styles.waitingTime} ${getWaitingTimeClass(quote.waiting_days)}`}>
                ⏱️ {getWaitingTimeText(quote.waiting_days)}
              </div>
            </div>

            <div className={styles.itemDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Orçamento:</span>
                <span className={styles.value}>#{quote.quote_number}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Enviado em:</span>
                <span className={styles.value}>{formatDate(quote.submitted_at)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Valor Total:</span>
                <span className={styles.valueHighlight}>{formatCurrency(quote.total_value)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Itens:</span>
                <span className={styles.value}>{quote.items_count}</span>
              </div>
              {quote.has_time_revision && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Revisão de prazo:</span>
                  <span className={styles.value} style={{ color: '#b45309', fontWeight: 600 }}>
                    Solicitada
                  </span>
                </div>
              )}
            </div>

            {quote.partner_comments && (
              <div className={styles.comments}>
                <span className={styles.commentsIcon}>💬</span>
                <span className={styles.commentsText}>{quote.partner_comments}</span>
              </div>
            )}

            <div className={styles.statusBanner}>
              <span className={styles.statusIcon}>⏳</span>
              <span className={styles.statusText}>
                {quote.has_time_revision
                  ? 'Solicitação de revisão de prazos pelo especialista'
                  : 'Aguardando revisão do admin - Você já fez sua parte!'}
              </span>
            </div>

            <div className={styles.actions}>
              {quote.has_time_revision && onEditTimesClick && (
                <button
                  className={styles.detailsButton}
                  onClick={() => onEditTimesClick(quote.quote_id)}
                  title="Editar prazos conforme solicitação"
                >
                  Editar Prazos
                </button>
              )}
              <button
                className={styles.detailsButton}
                onClick={() => onViewDetailsClick(quote.quote_id)}
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

export default QuotesInReviewCard;
