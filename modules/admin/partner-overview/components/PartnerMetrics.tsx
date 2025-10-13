/**
 * Partner Metrics Component
 *
 * Displays partner metrics in card format:
 * - Services count
 * - Pending budgets
 * - Executing budgets
 * - Approval budgets
 */

import React from 'react';
import type { PartnerMetrics as PartnerMetricsType } from '../types';
import styles from './PartnerMetrics.module.css';

interface PartnerMetricsProps {
  metrics: PartnerMetricsType;
}

export const PartnerMetrics: React.FC<PartnerMetricsProps> = ({ metrics }) => {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Serviços Cadastrados</div>
        <div className={styles.cardValue}>{metrics.services_count}</div>
      </div>

      <div className={`${styles.card} ${styles.cardWarning}`}>
        <div className={styles.cardLabel}>Orçamentos Pendentes</div>
        <div className={styles.cardValue}>{metrics.pending_budgets}</div>
      </div>

      <div className={`${styles.card} ${styles.cardSuccess}`}>
        <div className={styles.cardLabel}>Em Execução</div>
        <div className={styles.cardValue}>{metrics.executing_budgets}</div>
      </div>

      <div className={`${styles.card} ${styles.cardDanger}`}>
        <div className={styles.cardLabel}>Para Aprovação</div>
        <div className={styles.cardValue}>{metrics.approval_budgets}</div>
      </div>
    </div>
  );
};
