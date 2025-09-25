'use client';

import React from 'react';
import styles from './PartnersCard.module.css';
import containerStyles from './PartnersCardContainer.module.css';
import { supabase } from '@/modules/common/services/supabaseClient';

interface PartnerData {
  id: string;
  company_name: string;
  services_count: number;
  pending_budgets: number;
  executing_budgets: number;
  approval_budgets: number;
}

interface PartnersCardProps {
  onLoadingChange?: (loading: boolean) => void;
}

const PartnersCard: React.FC<PartnersCardProps> = ({ onLoadingChange }) => {
  const [partners, setPartners] = React.useState<PartnerData[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        onLoadingChange?.(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const resp = await fetch('/api/admin/partners/overview', {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        if (!resp.ok) {
          // Fallback: mantém lista vazia
          setPartners([]);
          return;
        }
        const data = (await resp.json()) as { partners?: PartnerData[] };
        if (!isMounted) return;
        setPartners(Array.isArray(data.partners) ? data.partners : []);
      } catch {
        if (!isMounted) return;
        setPartners([]);
      } finally {
        onLoadingChange?.(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [onLoadingChange]);

  return (
    <div className={containerStyles.partnersCardOuter}>
      <div className={styles.partnersCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Parceiros</h3>
          <div className={styles.totalPartners}>{partners.length} parceiros ativos</div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.partnersTable}>
            <thead>
              <tr>
                <th className={styles.companyColumn}>Empresa Parceira</th>
                <th className={styles.servicesColumn}>Serviços Cadastrados</th>
                <th className={styles.budgetColumn}>Orçamentos Pendentes</th>
                <th className={styles.budgetColumn}>Em Execução</th>
                <th className={styles.budgetColumn}>Para Aprovação</th>
              </tr>
            </thead>
            <tbody>
              {partners.map(partner => (
                <tr key={partner.id} className={styles.tableRow}>
                  <td className={styles.companyCell}>
                    <div className={styles.companyName}>{partner.company_name}</div>
                  </td>
                  <td className={styles.servicesCell}>
                    <span className={styles.servicesCount}>{partner.services_count}</span>
                  </td>
                  <td className={styles.budgetCell}>
                    <span className={`${styles.budgetBadge} ${styles.pending}`}>
                      {partner.pending_budgets}
                    </span>
                  </td>
                  <td className={styles.budgetCell}>
                    <span className={`${styles.budgetBadge} ${styles.executing}`}>
                      {partner.executing_budgets}
                    </span>
                  </td>
                  <td className={styles.budgetCell}>
                    <span className={`${styles.budgetBadge} ${styles.approval}`}>
                      {partner.approval_budgets}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.summaryStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Serviços:</span>
              <span className={styles.statValue}>
                {partners.reduce((sum, p) => sum + p.services_count, 0)}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Orçamentos Ativos:</span>
              <span className={styles.statValue}>
                {partners.reduce((sum, p) => sum + p.executing_budgets, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnersCard;
