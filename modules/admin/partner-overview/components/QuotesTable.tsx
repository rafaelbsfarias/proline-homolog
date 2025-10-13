/**
 * Quotes Table Component
 *
 * Displays quotes in a table format with:
 * - Search filter
 * - Status filter
 * - Action buttons (details, review, checklist)
 */

import React from 'react';
import type { Quote, QuoteStatus, QuoteFilterStatus } from '../types';
import styles from './QuotesTable.module.css';

interface QuotesTableProps {
  quotes: Array<Quote & { _group: QuoteStatus }>;
  query: string;
  status: QuoteFilterStatus;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: QuoteFilterStatus) => void;
  onOpenDetails: (quoteId: string) => void;
  onOpenReview: (quoteId: string) => void;
  onOpenChecklist: (vehicleId: string) => void;
}

const STATUS_LABELS: Record<QuoteFilterStatus, string> = {
  all: 'Todos',
  pending_admin_approval: 'Aprovação Admin',
  pending_client_approval: 'Aprovação Cliente',
  approved: 'Aprovados',
  rejected: 'Rejeitados',
  executing: 'Em Execução',
};

const STATUS_COLORS: Record<QuoteStatus, string> = {
  pending_admin_approval: styles.statusWarning,
  pending_client_approval: styles.statusInfo,
  approved: styles.statusSuccess,
  rejected: styles.statusDanger,
  executing: styles.statusPrimary,
};

export const QuotesTable: React.FC<QuotesTableProps> = ({
  quotes,
  query,
  status,
  onQueryChange,
  onStatusChange,
  onOpenDetails,
  onOpenReview,
  onOpenChecklist,
}) => {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Orçamentos</h2>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por ID ou OS..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={status}
          onChange={e => onStatusChange(e.target.value as QuoteFilterStatus)}
          className={styles.statusSelect}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {quotes.length === 0 ? (
        <div className={styles.emptyState}>Nenhum orçamento encontrado.</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>OS</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(quote => (
                <tr key={quote.id}>
                  <td className={styles.cellMono}>{quote.id.slice(0, 8)}...</td>
                  <td>{quote.service_order_id || '—'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${STATUS_COLORS[quote._group]}`}>
                      {STATUS_LABELS[quote._group]}
                    </span>
                  </td>
                  <td>
                    {quote.total_value != null
                      ? `R$ ${Number(quote.total_value).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}`
                      : '—'}
                  </td>
                  <td>{new Date(quote.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => onOpenDetails(quote.id)}
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        title="Ver detalhes"
                      >
                        Detalhes
                      </button>
                      {quote._group === 'pending_admin_approval' && (
                        <button
                          onClick={() => onOpenReview(quote.id)}
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          title="Revisar orçamento"
                        >
                          Revisar
                        </button>
                      )}
                      {quote.vehicle_id && (
                        <button
                          onClick={() => onOpenChecklist(quote.vehicle_id!)}
                          className={`${styles.btn} ${styles.btnInfo}`}
                          title="Ver checklist completo"
                        >
                          Checklist
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
