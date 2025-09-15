import React from 'react';
import styles from './PartnersCard.module.css';

interface PartnerData {
  id: number;
  company_name: string;
  services_registered: number;
  pending_budgets: number;
  executing_budgets: number;
  approval_budgets: number;
}

// Mock data conforme solicitado
const mockPartnersData: PartnerData[] = [
  {
    id: 1,
    company_name: 'Auto Peças Silva Ltda',
    services_registered: 15,
    pending_budgets: 3,
    executing_budgets: 7,
    approval_budgets: 2,
  },
  {
    id: 2,
    company_name: 'Centro Automotivo Santos',
    services_registered: 22,
    pending_budgets: 5,
    executing_budgets: 12,
    approval_budgets: 1,
  },
  {
    id: 3,
    company_name: 'Oficina Mecânica Oliveira',
    services_registered: 8,
    pending_budgets: 2,
    executing_budgets: 4,
    approval_budgets: 0,
  },
  {
    id: 4,
    company_name: 'Peças e Acessórios Rodrigues',
    services_registered: 31,
    pending_budgets: 8,
    executing_budgets: 15,
    approval_budgets: 3,
  },
  {
    id: 5,
    company_name: 'Auto Center Pereira',
    services_registered: 19,
    pending_budgets: 4,
    executing_budgets: 9,
    approval_budgets: 1,
  },
];

const PartnersCard: React.FC = () => {
  return (
    <div className={styles.partnersCard}>
      <div className={styles.cardHeader}>
        <h2>Parceiros</h2>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.partnersTable}>
          <thead>
            <tr>
              <th>Empresa Parceira</th>
              <th>Serviços Cadastrados</th>
              <th>Orçamentos Pendentes</th>
              <th>Orçamentos em Execução</th>
              <th>Orçamentos para Aprovação</th>
            </tr>
          </thead>
          <tbody>
            {mockPartnersData.map(partner => (
              <tr key={partner.id}>
                <td className={styles.companyName}>{partner.company_name}</td>
                <td className={styles.numberCell}>{partner.services_registered}</td>
                <td className={styles.numberCell}>{partner.pending_budgets}</td>
                <td className={styles.numberCell}>{partner.executing_budgets}</td>
                <td className={styles.numberCell}>{partner.approval_budgets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartnersCard;
