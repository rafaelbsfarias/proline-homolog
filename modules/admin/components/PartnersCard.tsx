'use client';

import React from 'react';
import styles from './PartnersCard.module.css';
import containerStyles from './PartnersCardContainer.module.css';

interface PartnerData {
  id: string;
  company_name: string;
  services_count: number;
  pending_budgets: number;
  executing_budgets: number;
  approval_budgets: number;
}

const mockPartnersData: PartnerData[] = [
  {
    id: '1',
    company_name: 'Auto Peças Silva Ltda',
    services_count: 15,
    pending_budgets: 3,
    executing_budgets: 7,
    approval_budgets: 2,
  },
  {
    id: '2',
    company_name: 'Centro Automotivo Santos',
    services_count: 22,
    pending_budgets: 5,
    executing_budgets: 12,
    approval_budgets: 1,
  },
  {
    id: '3',
    company_name: 'Oficina Mecânica Oliveira',
    services_count: 8,
    pending_budgets: 2,
    executing_budgets: 4,
    approval_budgets: 3,
  },
  {
    id: '4',
    company_name: 'Auto Elétrica Rodrigues',
    services_count: 12,
    pending_budgets: 1,
    executing_budgets: 8,
    approval_budgets: 0,
  },
  {
    id: '5',
    company_name: 'Centro de Revisão Carvalho',
    services_count: 18,
    pending_budgets: 4,
    executing_budgets: 9,
    approval_budgets: 2,
  },
];

interface PartnersCardProps {
  onLoadingChange?: (loading: boolean) => void;
}

const PartnersCard: React.FC<PartnersCardProps> = ({ onLoadingChange }) => {
  // Simular loading state
  React.useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(false);
    }
  }, [onLoadingChange]);

  return (
    <div className={containerStyles.partnersCardOuter}>
      <div className={styles.partnersCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Parceiros</h3>
          <div className={styles.totalPartners}>{mockPartnersData.length} parceiros ativos</div>
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
              {mockPartnersData.map(partner => (
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
                {mockPartnersData.reduce((sum, partner) => sum + partner.services_count, 0)}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Orçamentos Ativos:</span>
              <span className={styles.statValue}>
                {mockPartnersData.reduce((sum, partner) => sum + partner.executing_budgets, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnersCard;
